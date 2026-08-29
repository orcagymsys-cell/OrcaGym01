import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { Resend } from 'resend';

export const runtime = 'edge';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');
  try {
    const { email, phone_number } = await request.json();

    if (!email || !phone_number) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและเบอร์โทรศัพท์ให้ครบถ้วน' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim())
      .eq('phone_number', phone_number.trim())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้งานที่ตรงกับอีเมลและเบอร์โทรศัพท์นี้' }, { status: 404 });
    }

    const emailPrefix = email.split('@')[0];
    const phoneDigits = phone_number.replace(/\D/g, '');
    const last4Phone = phoneDigits.slice(-4) || '1234';
    const newPassword = `${emailPrefix}${last4Phone}`;

    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', user.id);

    if (updateError) {
      throw new Error('เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน');
    }

    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'OrcaGym <onboarding@resend.dev>',
      to: email.trim(),
      subject: 'รหัสผ่านใหม่สำหรับการเข้าสู่ระบบ ORCA GYMNASTICS',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #183363; text-align: center;">ORCA GYMNASTICS</h2>
          <p>สวัสดีคุณ ${user.full_name},</p>
          <p>ระบบได้ทำการรีเซ็ตรหัสผ่านของคุณเรียบร้อยแล้ว คุณสามารถเข้าสู่ระบบด้วยข้อมูลใหม่ดังนี้:</p>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Username:</strong> ${user.username}</p>
            <p style="margin: 0;"><strong>Password ใหม่:</strong> ${newPassword}</p>
          </div>
          <p style="color: #64748b; font-size: 14px;">เมื่อเข้าสู่ระบบแล้ว คุณสามารถเปลี่ยนรหัสผ่านได้ที่เมนู เปลี่ยนรหัสผ่าน</p>
        </div>
      `
    });

    if (emailError) {
      console.error('Resend Error:', emailError);
      return NextResponse.json({ error: 'ไม่สามารถส่งอีเมลได้ โปรดลองอีกครั้งในภายหลัง' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
