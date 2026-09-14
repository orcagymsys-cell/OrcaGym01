import type { Metadata } from 'next';
import { Anuphan } from 'next/font/google';
import './globals.css';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';

const anuphan = Anuphan({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-anuphan',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Orca Gymnastics - ระบบจองคลาสเรียนยิมสำหรับเด็ก',
  description: 'ระบบจองคลาสเรียนยิม Orca Gymnastics สำหรับผู้ปกครองและแอดมิน',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={anuphan.variable}>
      <body className="bg-slate-200 min-h-[100dvh] font-sans">
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
