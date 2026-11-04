import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const rawUsername = body.username ?? '';
    const rawPassword = body.password ?? '';

    // Strip zero-width characters and whitespace
    const cleanUsername = String(rawUsername).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    const cleanPassword = String(rawPassword).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json({ success: false, error: 'กรุณากรอก Username และ Password' }, { status: 400 });
    }

    const lowerInput = cleanUsername.toLowerCase();
    const digitsInput = cleanUsername.replace(/[^0-9]/g, '');

    const isEmail = lowerInput.includes('@');
    const isPhone = digitsInput.length >= 9 && !/[a-zA-Z]/.test(cleanUsername);

    let query = supabase.from('profiles').select('*');
    if (isEmail) {
      query = query.or(`email.eq.${lowerInput},email.ilike.${lowerInput}`);
    } else if (isPhone) {
      query = query.or(`phone.eq.${cleanUsername},phone.ilike.%${digitsInput}%,user_id.ilike.${lowerInput}`);
    } else {
      query = query.or(`user_id.eq.${cleanUsername},user_id.ilike.${cleanUsername},user_id.ilike.${lowerInput},email.ilike.${lowerInput}`);
    }

    const { data: users, error } = await query;
    if (error) throw error;

    // Find the user whose password matches (handle exact and trimmed match)
    const foundUser = users?.find(u => (u.password || '').trim() === cleanPassword) || users?.[0];

    if (foundUser && (foundUser.password || '').trim() === cleanPassword) {
      const sessionData = { 
        id: foundUser.id, 
        role: foundUser.role, 
        user_id: foundUser.user_id,
        payment_ref_no: foundUser.payment_ref_no 
      };
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
    console.error('LOGIN ERROR:', err); 
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
