import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import { Metadata } from 'next';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'About Us - ORCA GYMNASTICS',
  description: 'เกี่ยวกับ บริษัท ออก้ายิม จำกัด (ORCA GYM CO., LTD.)',
};

export default function AboutUsPage() {
  return (
    <div className="flex flex-col items-center max-w-4xl mx-auto py-8 px-4 font-['Comic_Sans_MS',_'Chalkboard_SE',_'Comic_Neue',_sans-serif]">
      <div className="w-full flex items-center mb-8">
        <Link href="/dashboard" className="flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1a2d5c] rounded-xl font-bold text-sm transition-colors border border-slate-300 shadow-sm">
          <ChevronLeft size={18} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
      
      <div className="bg-white rounded-3xl shadow-lg border-2 border-sky-100 p-8 md:p-12 text-center w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-sky-300 via-blue-400 to-sky-300"></div>
        
        <Image src="/images/logo.png" alt="ORCA" width={180} height={180} className="object-contain mx-auto mb-6 drop-shadow-md hover:scale-105 transition-transform" />
        
        <h1 className="text-3xl md:text-4xl font-black text-[#183363] mb-4">
          บริษัท ออก้ายิม จำกัด
        </h1>
        <h2 className="text-xl md:text-2xl font-bold text-sky-600 mb-8 uppercase tracking-wide">
          (ORCA GYM CO., LTD.)
        </h2>
        
        <div className="bg-sky-50 rounded-2xl p-6 md:p-8 text-base md:text-xl font-medium text-slate-700 leading-relaxed max-w-2xl mx-auto shadow-inner border border-sky-100">
          <p>
            สถาบันสอนและฝึกทักษะกีฬายิมนาสติก กายกรรม โยคะ การเต้นรำ ทุกรูปแบบ และเชียร์ลีดเดอร์ 
            ให้แก่ เด็ก เยาวชน และบุคคลทั่วไป 
          </p>
          <br/>
          <p>
            เพื่อพัฒนาศักยภาพทางร่างกาย การทรงตัว ความคล่องตัว และเสริมสร้างสมาธิความมั่นใจในตนเอง 
            ปูพื้นฐานแน่นด้วยทีมโค้ชระดับมืออาชีพ 🐬
          </p>
        </div>
      </div>
    </div>
  );
}
