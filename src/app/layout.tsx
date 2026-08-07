import type { Metadata } from 'next';
import './globals.css';
import { Kanit } from 'next/font/google';

export const kanit = Kanit({ 
  weight: ['400', '600', '700', '800', '900'],
  subsets: ['latin', 'thai'],
});

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
      <body className="antialiased bg-slate-50 min-h-screen" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Mali', 'Comic Neue', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
