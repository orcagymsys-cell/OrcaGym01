import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'edge';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('orca_session', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  try {
    cookies().delete('orca_session');
  } catch (_) {}
  return response;
}

export async function GET(req: Request) {
  const url = new URL('/', req.url);
  const response = NextResponse.redirect(url);
  response.cookies.set('orca_session', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  try {
    cookies().delete('orca_session');
  } catch (_) {}
  return response;
}
