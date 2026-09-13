import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Convert array of objects to CSV string
function toCSV(data: any[]) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = '';
      // Escape quotes and wrap in quotes if contains comma
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export async function GET(request: Request) {
  try {
    // 1. Verify Authorization (Simple secret key to prevent unauthorized triggers)
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'orca_backup_secret_2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Data from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [profilesRes, childrenRes, bookingsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('children').select('*'),
      supabase.from('bookings').select('*')
    ]);

    const profilesCSV = toCSV(profilesRes.data || []);
    const childrenCSV = toCSV(childrenRes.data || []);
    const bookingsCSV = toCSV(bookingsRes.data || []);

    const dateStr = new Date().toISOString().split('T')[0];

    // 3. Email the CSVs
    if (!process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({ error: 'GMAIL_APP_PASSWORD is not set' }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'orcagymsys@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: 'orcagymsys@gmail.com',
      to: 'orcagymsys@gmail.com', // Sends to themselves, or admin can change this
      subject: `[Daily Backup] Orca Gymnastics System - ${dateStr}`,
      text: 'ระบบได้ส่งไฟล์สำรองข้อมูล (Backup) ประจำวันมาให้เรียบร้อยแล้วครับ คุณสามารถดาวน์โหลดไฟล์ CSV ที่แนบมานี้ไปเปิดดูใน Excel ได้เลยครับ\n\n- profiles.csv (ข้อมูลผู้ปกครอง)\n- children.csv (ข้อมูลนักเรียนและโควต้า)\n- bookings.csv (ข้อมูลการจองคลาส)',
      attachments: [
        { filename: `profiles_${dateStr}.csv`, content: Buffer.from('\uFEFF' + profilesCSV, 'utf-8'), contentType: 'text/csv' },
        { filename: `children_${dateStr}.csv`, content: Buffer.from('\uFEFF' + childrenCSV, 'utf-8'), contentType: 'text/csv' },
        { filename: `bookings_${dateStr}.csv`, content: Buffer.from('\uFEFF' + bookingsCSV, 'utf-8'), contentType: 'text/csv' }
      ]
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: 'Backup sent to email successfully' });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
