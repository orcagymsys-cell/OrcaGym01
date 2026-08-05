import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// 🟢 เพิ่มบรรทัดนี้เพื่อรองรับ Edge Runtime บน Cloudflare Pages

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ORCA GYMNASTICS - ระบบจองคลาสเรียนยิมนาสติกเด็ก",
  description: "สถาบันสอนและฝึกทักษะกีฬายิมนาสติกเด็ก ออก้ายิม (ORCA GYMNASTICS)",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden bg-slate-50 text-slate-800 font-sans selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}