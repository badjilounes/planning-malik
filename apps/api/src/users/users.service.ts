import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@planning/data-access';
import type { AuthUserDto } from '@planning/types';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AuthUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, displayName: true, timezone: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
