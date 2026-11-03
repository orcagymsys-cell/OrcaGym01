import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt, isSuperAdmin } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const cookie = req.cookies.get('orca_session')?.value;
  const session = cookie ? await decrypt(cookie) : null;
  
  const { pathname } = req.nextUrl;
  const isAuthRoute = pathname.startsWith('/home') || pathname.startsWith('/admin') || pathname.startsWith('/student') || pathname.startsWith('/audit');
  const isLoginRoute = pathname === '/';

  if (isAuthRoute && !session) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  if (isLoginRoute && session) {
    if (session.role === 'admin') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url));
    } else {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  }
  
  if (pathname.startsWith('/admin') && session?.role !== 'admin') {
    return NextResponse.redirect(new URL('/home', req.url));
  }

  // Prevent non-superadmin from entering /audit
  if (pathname.startsWith('/audit') && !isSuperAdmin(session)) {
    return NextResponse.redirect(new URL('/admin/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/home/:path*', '/admin/:path*', '/student/:path*', '/audit/:path*'],
};
