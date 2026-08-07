import type { Metadata } from 'next';
import './globals.css';


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
