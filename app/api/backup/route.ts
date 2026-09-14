import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cloudflare Edge Runtime requires standard Web APIs
export const runtime = 'edge';

function toCSV(data: any[]) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) val = '';
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    if (key !== 'orca_backup_secret_2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // On Cloudflare Pages (Edge), we CANNOT use 'nodemailer' because it relies on Node.js TCP sockets.
    // Instead, we use an HTTP-based Email API like Resend.
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ 
        error: 'RESEND_API_KEY is not set. Cloudflare Edge requires an HTTP Email API (like Resend) instead of Nodemailer.' 
      }, { status: 500 });
    }

    // Convert CSV strings to base64 for the API payload
    const encodeBase64 = (str: string) => {
      const bytes = new TextEncoder().encode('\uFEFF' + str); // Add BOM for Excel UTF-8 support
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // Default testing email for Resend
        to: 'orcagymsys@gmail.com',
        subject: `[Daily Backup] Orca Gymnastics System - ${dateStr}`,
        text: 'ระบบได้ส่งไฟล์สำรองข้อมูล (Backup) ประจำวันมาให้เรียบร้อยแล้วครับ คุณสามารถดาวน์โหลดไฟล์ CSV ที่แนบมานี้ไปเปิดดูใน Excel ได้เลยครับ\n\n- profiles.csv (ข้อมูลผู้ปกครอง)\n- children.csv (ข้อมูลนักเรียนและโควต้า)\n- bookings.csv (ข้อมูลการจองคลาส)',
        attachments: [
          { filename: `profiles_${dateStr}.csv`, content: encodeBase64(profilesCSV) },
          { filename: `children_${dateStr}.csv`, content: encodeBase64(childrenCSV) },
          { filename: `bookings_${dateStr}.csv`, content: encodeBase64(bookingsCSV) }
        ]
      })
    });

    if (!res.ok) {
      const errorData = await res.text();
      throw new Error('Email API failed: ' + errorData);
    }

    return NextResponse.json({ success: true, message: 'Backup sent via Resend API successfully' });
  } catch (error: any) {
    console.error('Backup error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
