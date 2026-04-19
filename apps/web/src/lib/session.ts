import { cookies } from 'next/headers';
import type { AuthTokens, AuthUserDto } from '@planning/types';

const ACCESS_COOKIE = 'pm_access';
const REFRESH_COOKIE = 'pm_refresh';
const USER_COOKIE = 'pm_user';
const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60;
const ACCESS_TTL_SECONDS = 60 * 60; // the JWT expires in 15m; we keep the
// cookie a bit longer so it survives briefly for /login reauth flows.

type CookieJar = Awaited<ReturnType<typeof cookies>>;

/**
 * Read the current access token. Returns null if unauthenticated.
 * Safe to call from RSC.
 */
export async function getAccessToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<AuthUserDto | null> {
  const jar = await cookies();
  const raw = jar.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as AuthUserDto;
  } catch {
    return null;
  }
}

/**
 * Persist a fresh auth response. Must be called from a Server Action or
 * Route Handler (not an RSC — Next.js forbids cookie mutation in RSC).
 */
export async function setSession(tokens: AuthTokens, user?: AuthUserDto): Promise<void> {
  const jar = await cookies();
  writeAuthCookies(jar, tokens, user);
}

export async function clearSession(): Promise<void> {
  try {
    const jar = await cookies();
    jar.delete(ACCESS_COOKIE);
    jar.delete(REFRESH_COOKIE);
    jar.delete(USER_COOKIE);
  } catch {
    // Called from a Server Component — Next forbids cookie mutation in RSC.
    // The caller will redirect; stale cookies are handled by the proxy's
    // `reauth` bypass so the user can land on /login and re-authenticate.
  }
}

function writeAuthCookies(jar: CookieJar, tokens: AuthTokens, user?: AuthUserDto): void {
  const secure = process.env.NODE_ENV === 'production';
  jar.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: ACCESS_TTL_SECONDS,
  });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: REFRESH_TTL_SECONDS,
  });
  if (user) {
    // Non-sensitive — used by client components to display "hi, {name}".
    // Not relied on for auth decisions (server checks the access token).
    jar.set(USER_COOKIE, encodeURIComponent(JSON.stringify(user)), {
      httpOnly: false,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: REFRESH_TTL_SECONDS,
    });
  }
}

export const SESSION_COOKIE_NAMES = {
  access: ACCESS_COOKIE,
  refresh: REFRESH_COOKIE,
  user: USER_COOKIE,
} as const;
