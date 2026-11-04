import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export const runtime = 'edge';

export async function GET() {
  try {
    const cookie = cookies().get('orca_session')?.value;
    if (!cookie) {
      return NextResponse.json({ success: false, error: 'No session' }, { status: 401 });
    }
    const session = await decrypt(cookie);
    if (!session || !session.id) {
      return NextResponse.json({ success: false, error: 'Invalid session' }, { status: 401 });
    }

    const { data: user, error } = await supabase
      .from('profiles')
      .select('id,user_id,name,phone,email,password,role,payment_amount,payment_ref_no,payment_payer_name,payment_bank,payment_datetime,payment_history,purchased_hours,created_at,pdpa_accepted,media_consent,pdpa_accepted_at')
      .eq('id', session.id)
      .single();

    if (error || !user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
