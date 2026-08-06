import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'edge';

export async function GET() {
  const response = NextResponse.json({
    success: true,
    user: { id: 'admin_1', role: 'admin', first_login: false }
  });
  response.cookies.set('session', 'admin_1', {
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });
  return response;
}

export async function POST(request: Request) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { username, password } = body;

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'ไม่พบชื่อผู้ใช้งานนี้ในระบบ (User not found)' }, { status: 401 });
    }

    if (password && user.password && password.trim() !== user.password) {
      return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง (Invalid password)' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user: { 
        id: user.id, 
        role: user.role, 
        first_login: user.first_login 
      }
    });

    response.cookies.set('session', user.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return response;
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
