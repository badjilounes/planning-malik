import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'node:crypto';
import { PrismaService } from '@planning/data-access';
import type { AuthResponse, AuthTokens, AuthUserDto } from '@planning/types';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshRequestUser } from './strategies/jwt-refresh.strategy';

const BCRYPT_ROUNDS = 12;
const REFRESH_TTL_DAYS = 7;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        displayName: dto.displayName,
        timezone: dto.timezone ?? 'UTC',
      },
    });
    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return this.buildAuthResponse(user);
  }

  /**
   * Rotate a refresh token. If the presented token isn't found in the DB
   * (e.g. already-revoked but still valid JWT), we treat it as reuse and
   * revoke every active session for that user. Standard pattern.
   */
  async refresh(payload: RefreshRequestUser): Promise<AuthTokens> {
    const tokenHash = hashToken(payload.rawToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored || stored.userId !== payload.sub) {
      // Signed JWT but absent from DB → likely stolen + replayed.
      await this.prisma.refreshToken.updateMany({
        where: { userId: payload.sub, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      this.logger.warn(`Refresh token reuse detected for user ${payload.sub}`);
      throw new ForbiddenException('Refresh token reuse detected');
    }
    if (stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Invalidate old, issue new.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
    return this.issueTokens(user.id, user.email);
  }

  async logout(userId: string, rawRefreshToken: string): Promise<void> {
    const tokenHash = hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ─── internals ─────────────────────────────────────────────────────────

  private async buildAuthResponse(user: {
    id: string;
    email: string;
    displayName: string | null;
    timezone: string;
  }): Promise<AuthResponse> {
    const tokens = await this.issueTokens(user.id, user.email);
    const dto: AuthUserDto = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      timezone: user.timezone,
    };
    return { user: dto, tokens };
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokens> {
    const jti = randomUUID();
    const accessToken = await this.jwt.signAsync({ sub: userId, email }, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_TTL') ?? '15m',
    } as JwtSignOptions);
    const refreshToken = await this.jwt.signAsync({ sub: userId, email, jti }, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_TTL') ?? '7d',
    } as JwtSignOptions);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }
}

function hashToken(raw: string): string {
  // SHA-256 is sufficient: we're hashing a 256-bit-entropy JWT, not a
  // human-chosen password. bcrypt would be gratuitous and slow.
  return createHash('sha256').update(raw).digest('hex');
}
