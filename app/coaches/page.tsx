'use client';

export default function CoachesPage() {
  return (
    <div className="font-['Anuphan',sans-serif] bg-slate-50 min-h-screen pb-10">
      <div className="bg-gradient-to-r from-[#2b66c4] to-[#1e4b96] text-white p-5 rounded-b-[24px] shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3">
                    <div>
            <h1 className="text-xl font-bold tracking-wide">ทีมโค้ช</h1>
            <p className="text-white/80 text-xs mt-0.5">Orca Gymnastics Coaches</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mt-20 px-6 text-center animate-fade-in">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center animate-bounce shadow-inner">
            <span className="text-5xl">🚧</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center animate-pulse shadow-sm">
            <span className="text-2xl">🛠️</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[#1e3a66] mb-3">
          อยู่ในระหว่างการพัฒนา
        </h2>
        
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm mb-8">
          ข้อมูลทีมโค้ชผู้เชี่ยวชาญของเรากำลังอยู่ในขั้นตอนการอัปവและรวบรวมข้อมูล เพื่อให้ผู้ปกครองได้รับข้อมูลที่ครบถ้วนที่สุดครับ
        </p>

        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 w-full max-w-sm">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
            <span className="text-lg">⏳</span>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-700">Coming Soon</h3>
            <p className="text-xs text-slate-400">เร็วๆ นี้</p>
          </div>
        </div>
      </div>
    </div>
  );
}
