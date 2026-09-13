import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email, otp, hash } = await req.json();
    
    const salt = process.env.OTP_SALT || 'orcagym';
    const expectedHash = crypto.createHash('sha256').update(`${otp}-${email}-${salt}`).digest('hex');

    if (expectedHash === hash) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'รหัส OTP ไม่ถูกต้อง' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
