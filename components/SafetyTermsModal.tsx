'use client';
import { useState, useEffect, useRef } from 'react';
import { showToast } from './Toast';

export default function SafetyTermsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if safety terms have been accepted in current session
    const accepted = sessionStorage.getItem('orca_safety_terms_accepted');
    if (!accepted) {
      setIsOpen(true);
    }
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Calculate percentage
    const totalScrollable = scrollHeight - clientHeight;
    if (totalScrollable > 0) {
      const pct = Math.min(100, Math.round((scrollTop / totalScrollable) * 100));
      setScrollProgress(pct);
    }

    // Check if user reached bottom (with 15px threshold)
    if (scrollTop + clientHeight >= scrollHeight - 15) {
      setHasScrolledToBottom(true);
      setScrollProgress(100);
    }
  };

  const handleAccept = () => {
    if (!hasScrolledToBottom) return;
    sessionStorage.setItem('orca_safety_terms_accepted', 'true');
    setIsOpen(false);
    showToast('ยอมรับเงื่อนไขการเข้าเรียนเรียบร้อยแล้ว');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-md transition-all animate-fade-in font-sans">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#001a3a] to-[#003366] text-white p-5 text-center relative shrink-0">
          <div className="inline-block bg-amber-400 text-[#001a3a] text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-wide">
            🛡️ ประกาศสำคัญสำหรับผู้ปกครอง
          </div>
          <h2 className="text-xl font-bold font-sans">
            เงื่อนไขการเข้าเรียน & ความปลอดภัย
          </h2>
          <p className="text-xs text-sky-200 mt-1">
            สถาบันยิมนาสติกเด็ก ORCA GYMNASTICS
          </p>
        </div>

        {/* Instructions banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-between font-semibold">
          <span>📜 กรุณาอ่านเงื่อนไขด้านล่างให้ครบจนจบเพื่อเปิดปุ่มตกลง</span>
          <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md font-bold">
            {scrollProgress}%
          </span>
        </div>

        {/* Scrollable Terms Content */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed font-sans max-h-[360px] bg-slate-50/50"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-semibold">
            📌 เพื่อความปลอดภัยสูงสุดของนักเรียนทุกท่าน ผู้ปกครองโปรดอ่านและทำความเข้าใจข้อปฏิบัติในการเข้าเรียนดังต่อไปนี้:
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#001a3a] text-base flex items-center gap-1.5">
              1. การแต่งกายและการเตรียมความพร้อม
            </h3>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600">
              <li>นักเรียนต้องสวมชุดยิมนาสติก หรือชุดกีฬาที่มีความยืดหยุ่นสูง ไม่มีซิปหรือกระดุมโลหะ</li>
              <li>ควรมัดผมให้เรียบร้อยก่อนเข้าชั้นเรียนเพื่อป้องกันอุปสรรคในการฝึกซ้อม</li>
              <li>ห้ามสวมเครื่องประดับ เช่น สร้อยคอ ต่างหู หรือนาฬิกา ในขณะฝึกซ้อมโดยเด็ดขาด</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#001a3a] text-base flex items-center gap-1.5">
              2. มาตรการความปลอดภัยและวินัยในห้องเรียน
            </h3>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600">
              <li>นักเรียนต้องปฏิบัติตามคำสั่งของโค้ชผู้เชี่ยวชาญอย่างเคร่งครัดตลอดเวลา</li>
              <li>ไม่อนุญาตให้นักเรียนเล่นอุปกรณ์ในยิมโดยไม่มีโค้ชควบคุมดูแล</li>
              <li>หากมีประวัติสุขภาพ ปัญหากระดูก หรือโรคประจำตัว ผู้ปกครองต้องแจ้งให้ยิมทราบล่วงหน้า</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#001a3a] text-base flex items-center gap-1.5">
              3. นโยบายการจองและการยกเลิกคลาสเรียน
            </h3>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600">
              <li>การจองคลาสเรียนต้องทำผ่านระบบล่วงหน้าอย่างน้อย 1 วัน</li>
              <li>หากต้องการยกเลิกหรือเปลี่ยนรอบเรียน ต้องแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมง</li>
              <li>ชั่วโมงเรียนมีอายุการใช้งานตามแพ็กเกจที่ผู้ปกครองสมัคร</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-[#001a3a] text-base flex items-center gap-1.5">
              4. การรับ-ส่งนักเรียน
            </h3>
            <ul className="list-disc list-inside pl-2 space-y-1 text-slate-600">
              <li>ผู้ปกครองต้องมารับ-ส่งนักเรียนตรงตามเวลาเพื่อความปลอดภัย</li>
              <li>กรณีผู้ปกครองให้ผู้อื่นมารับแทน กรุณาแจ้งเจ้าหน้าที่หน้าเคาน์เตอร์ล่วงหน้า</li>
            </ul>
          </div>

          {/* End of content marker */}
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-800 mt-4">
            ✅ ท่านได้อ่านข้อตกลงและเงื่อนไขความปลอดภัยครบถ้วนแล้ว
          </div>
        </div>

        {/* Scroll Progress Bar */}
        <div className="w-full bg-slate-200 h-1.5 shrink-0">
          <div
            className="bg-emerald-500 h-full transition-all duration-150"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0 text-center">
          {hasScrolledToBottom ? (
            <button
              onClick={handleAccept}
              className="w-full py-3.5 px-6 bg-[#003366] hover:bg-[#001a3a] text-white font-bold rounded-2xl text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 border-b-4 border-[#d90429]"
            >
              <span>✅ ยอมรับเงื่อนไขการเข้าเรียน</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3.5 px-6 bg-slate-200 text-slate-400 font-bold rounded-2xl text-base cursor-not-allowed border-2 border-slate-300 flex items-center justify-center gap-2"
            >
              <span>📜 กรุณาเลื่อนอ่านเงื่อนไขให้จบ ({scrollProgress}%)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
