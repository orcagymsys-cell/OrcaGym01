'use client';
import BackButton from '@/components/BackButton';

export default function AboutPage() {
  return (
    <div className="font-sans max-w-2xl mx-auto p-2 sm:p-4">
      <div className="mb-4">
        <BackButton />
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001a3a] text-center mb-6 tracking-wide">
        ABOUT US
      </h2>

      <div className="text-center p-4 bg-white rounded-3xl shadow-xs border border-slate-100">
        <img
          src="/images/orca_logo.png"
          alt="ORCA GYMNASTICS"
          className="w-44 sm:w-48 h-auto mx-auto mb-5 object-contain"
        />

        <h3 className="text-2xl font-bold text-[#001a3a] mb-4 font-sans">
          Orca Gymnastics Academy
        </h3>
        
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-xl mx-auto font-medium px-2">
          สถาบันยิมนาสติกสำหรับเด็กเพื่อเสริมสร้างทักษะทางร่างกายและการเคลื่อนไหวอย่างถูกวิธี สนุกสนาน สมวัย ปูพื้นฐานแน่นเพื่อพร้อม <span className="inline-block">ต่อยอด</span> ในระดับที่สูงขึ้นได้อย่างมั่นใจ
        </p>


      </div>
    </div>
  );
}
