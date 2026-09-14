import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  cookies().set('orca_session', '', { maxAge: 0, path: '/' });
  return NextResponse.json({ success: true });
}
