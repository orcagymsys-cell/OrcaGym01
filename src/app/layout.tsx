import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ORCA GYMNASTICS',
  description: 'สถาบันสอนและฝึกทักษะกีฬายิมนาสติก กายกรรม โยคะ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body className={`antialiased bg-slate-50 min-h-screen ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
