import { NextResponse, type NextRequest } from 'next/server';

// Next 16 renamed `middleware` to `proxy`.
// Cookie-gate: if no JWT cookie, force login.
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || 'mf_session';

const PUBLIC_PATHS = new Set<string>(['/login']);
const PUBLIC_PREFIXES = ['/api/login', '/api/me', '/api/logout'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths and asset/internal Next paths.
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Match everything except Next internals and static files.
  matcher: ['/((?!_next/|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
};
