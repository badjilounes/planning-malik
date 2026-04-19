import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAMES } from './lib/session';

const PUBLIC_PATHS = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE_NAMES.access));
  // When an RSC detects a stale token it redirects here with ?reauth=1.
  // The access cookie may still be present (RSCs can't clear cookies) — let
  // the user reach /login instead of bouncing back to /calendar.
  const isReauth = searchParams.get('reauth') === '1';

  if (!hasSession && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic && !isReauth) {
    const url = request.nextUrl.clone();
    url.pathname = '/calendar';
    url.searchParams.delete('from');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static assets.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
