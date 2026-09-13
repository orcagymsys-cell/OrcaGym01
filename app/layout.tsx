import type { Metadata } from 'next';
import './globals.css';
import AppLayoutWrapper from '@/components/AppLayoutWrapper';

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
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anuphan:wght@300;400;500;600;700&family=Comic+Neue:ital,wght@0,400;0,700;1,700&family=Kanit:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-200 min-h-[100dvh] font-sans">
        <AppLayoutWrapper>{children}</AppLayoutWrapper>
      </body>
    </html>
  );
}
