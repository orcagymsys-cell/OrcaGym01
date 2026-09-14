import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    
    const lowerInput = username.toLowerCase();
    const digitsInput = lowerInput.replace(/[^0-9]/g, '');

    // Check if input is likely an email, phone, or username
    const isEmail = lowerInput.includes('@');
    const isPhone = digitsInput.length >= 9;

    let query = supabase.from('profiles').select('*');
    if (isEmail) {
      query = query.eq('email', lowerInput);
    } else if (isPhone) {
      query = query.ilike('phone', `%${digitsInput}%`);
    } else {
      query = query.eq('user_id', lowerInput);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    const foundUser = users?.[0];

    if (foundUser && foundUser.password === password.trim()) {
      const sessionData = { id: foundUser.id, role: foundUser.role, user_id: foundUser.user_id };
      const token = await encrypt(sessionData);
      
      cookies().set('orca_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
      
      return NextResponse.json({ success: true, user: foundUser });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
