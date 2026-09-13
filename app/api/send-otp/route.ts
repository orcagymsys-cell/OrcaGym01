import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { email, name } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: 'ระบบยังไม่ได้ตั้งค่ารหัสผ่านอีเมล (GMAIL_APP_PASSWORD)' }, { status: 500 });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Create a hash to verify later without a DB
    const salt = process.env.OTP_SALT || 'orcagym';
    const hash = crypto.createHash('sha256').update(`${otp}-${email}-${salt}`).digest('hex');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'orcagymsys@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: '"ORCA GYMNASTICS" <orcagymsys@gmail.com>',
      to: email,
      subject: 'รหัส OTP สำหรับรีเซ็ตรหัสผ่าน - ORCA GYMNASTICS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #001a3a; text-align: center;">รีเซ็ตรหัสผ่านของคุณ</h2>
          <p>สวัสดีคุณ <strong>${name || 'ผู้ปกครอง'}</strong>,</p>
          <p>เราได้รับคำขอให้รีเซ็ตรหัสผ่านสำหรับบัญชี ORCA GYMNASTICS ของคุณ</p>
          <p>กรุณานำรหัส OTP 6 หลักด้านล่างไปกรอกในหน้าเว็บไซต์ เพื่อยืนยันตัวตน:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb; background: #eff6ff; padding: 15px 30px; border-radius: 10px; border: 2px dashed #93c5fd;">
              ${otp}
            </span>
          </div>
          <p style="color: #64748b; font-size: 14px; text-align: center;">รหัสนี้ใช้ได้เพียงครั้งเดียว กรุณาอย่าเปิดเผยรหัสนี้แก่ผู้อื่น</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, hash });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
