import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value || request.headers.get('authorization');
  const { pathname } = request.nextUrl;

  const publicRoutes = ['/login', '/register', '/admin/login'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // RELAXED FOR CROSS-DOMAIN SUPPORT:
  // We let /dashboard pass through so client-side Bearer tokens can work.
  if (!isPublicRoute && !token && pathname !== '/' && !pathname.startsWith('/dashboard')) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute && token && !pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/duel/:path*',
    '/contest/:path*',
    '/leaderboard/:path*',
    '/analytics/:path*',
    '/login',
    '/register',
    '/admin/:path*',
  ],
};
