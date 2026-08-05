import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const role = body?.role || 'parent';
    const userId = role === 'admin' ? 'admin_1' : 'parent_1';

    const response = NextResponse.json({
      success: true,
      user: { id: userId, role: role, first_login: false }
    });

    response.cookies.set('session', userId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (e: any) {
    const response = NextResponse.json({
      success: true,
      user: { id: 'admin_1', role: 'admin', first_login: false }
    });

    return response;
  }
}
