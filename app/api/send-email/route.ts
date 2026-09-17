import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { email, name, subject, body } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: 'ระบบยังไม่ได้ตั้งค่ารหัสผ่านอีเมล (GMAIL_APP_PASSWORD)' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'orcagymsys@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const htmlBody = body.replace(/\n/g, '<br/>');

    const mailOptions = {
      from: '"ORCA GYMNASTICS" <orcagymsys@gmail.com>',
      to: email,
      subject: subject || 'แจ้งเตือนจาก ORCA GYMNASTICS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #001a3a;">ORCA GYMNASTICS</h2>
          </div>
          <div style="color: #334155; line-height: 1.6; font-size: 16px;">
            ${htmlBody}
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
