'use client';
import { useState, useEffect, useRef } from 'react';
import { showToast } from './Toast';
import { store } from '@/lib/supabase';

export default function ServiceTermsModal() {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const currentUser = store.getCurrentUser();
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return false;
    if (currentUser.pdpa_accepted) return false;
    return true;
  });
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [mediaConsent, setMediaConsent] = useState<boolean | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // No longer need useEffect for checkPDPA since it's initialized synchronously

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    const totalScrollable = scrollHeight - clientHeight;
    if (totalScrollable > 0) {
      const pct = Math.min(100, Math.round((scrollTop / totalScrollable) * 100));
      setScrollProgress(pct);
    }

    if (scrollTop + clientHeight >= scrollHeight - 15) {
      setHasScrolledToBottom(true);
      setScrollProgress(100);
    }
  };

  const handleAccept = async () => {
    if (!hasScrolledToBottom || !isChecked || mediaConsent === null) {
      if (!hasScrolledToBottom) {
        showToast('กรุณาเลื่อนอ่านข้อตกลงและเงื่อนไขให้จบก่อน');
      } else if (!isChecked) {
        showToast('กรุณาติ๊กยอมรับข้อตกลงและเงื่อนไข');
      } else if (mediaConsent === null) {
        showToast('กรุณาเลือกความยินยอมเรื่องการใช้ภาพและสื่อ');
      }
      return;
    }

    if (typeof window !== 'undefined') {
      const currentUser = store.getCurrentUser();
      
      if (currentUser) {
        // Save to database
        const updatedUser = {
          ...currentUser,
          pdpa_accepted: true,
          media_consent: mediaConsent,
          pdpa_accepted_at: new Date().toISOString()
        };
        await store.saveUser(updatedUser);
        store.setCurrentUser(updatedUser);
      }
      
      setIsOpen(false);
      showToast('ขอบคุณที่ยอมรับข้อตกลงและนโยบาย PDPA'); window.location.reload();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-[#001a3a]/80 backdrop-blur-sm animate-fade-in font-['Anuphan',sans-serif]">
      <div className="bg-white w-full max-w-xl max-h-full rounded-[24px] shadow-2xl flex flex-col overflow-hidden border border-white/20 animate-scale-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2b66c4] to-[#1e4b96] p-5 shrink-0 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">
              ระเบียบและข้อปฏิบัติ
            </h3>
            <p className="text-white/80 text-xs mt-0.5">
              สำหรับผู้เรียนยิมนาสติก Orca Cubs โรงยิม ORCA
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 flex flex-col flex-1 min-h-[400px]">
          
          {/* Scrollable Terms Box */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pr-3 mb-4 space-y-5 text-sm custom-scrollbar"
            style={{ maxHeight: '35vh' }}
          >
            {/* Section 1 */}
            <div>
              <h4 className="font-bold text-[#1e3a66] text-xs mb-1">
                1. ข้อตกลงการใช้บริการ
              </h4>
              <p className="text-slate-600 leading-relaxed">
                ผู้ใช้บริการตกลงที่จะใช้บริการตามวัตถุประสงค์ที่ระบุไว้เท่านั้น และไม่ใช้บริการในทางที่ผิดกฎหมาย หรือขัดต่อศีลธรรมอันดีของสังคม
              </p>
              <ul className="list-disc list-inside pl-1 mt-1 space-y-1 text-slate-500">
                <li>ชั่วโมงเรียนมีอายุการใช้งานตามแพ็กเกจที่สมัคร (เช่น 6 ครั้ง อายุ 2 เดือน, 12 ครั้ง อายุ 4 เดือน, 24 ครั้ง อายุ 6 เดือน)</li>
                <li>การจองคลาสเรียนขึ้นอยู่กับจำนวน Quotas ว่างในแต่ละรอบเวลา (สูงสุด 10 คนต่อรอบ)</li>
                <li>ชั่วโมงเรียนไม่สามารถโอนสิทธิ์ให้ผู้อื่น หรือเปลี่ยนเป็นเงินสดได้ทุกกรณี</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div>
              <h4 className="font-bold text-[#1e3a66] text-xs mb-1">
                2. ความรับผิดชอบของผู้ใช้บริการ
              </h4>
              <p className="text-slate-600 leading-relaxed">
                ผู้ใช้บริการต้องรักษาข้อมูลบัญชีผู้ใช้ไว้เป็นความลับ และไม่เปิดเผยให้บุคคลอื่นทราบ รวมถึงรับผิดชอบต่อการใช้งานทุกกิจกรรมที่เกิดขึ้นจากบัญชีของตนเอง
              </p>
              <ul className="list-disc list-inside pl-1 mt-1 space-y-1 text-slate-500">
                <li>นักเรียนต้องแต่งกายด้วยชุดยิมนาสติกหรือชุดกีฬาที่เหมาะสม ยืดหยุ่น ไม่มีกระดุมหรือซิปโลหะ</li>
                <li>นักเรียนต้องปฏิบัติตามคำสั่งของโค้ชผู้เชี่ยวชาญตลอดเวลาซ้อม</li>
                <li>ไม่อนุญาตให้นักเรียนหรือผู้ปกครองเล่นอุปกรณ์ในยิมก่อนได้รับอนุญาตจากโค้ช</li>
                <li>หากมีประวัติโรคประจำตัวหรือบาดเจ็บ ต้องแจ้งให้ยิมทราบล่วงหน้า</li>
              </ul>
            </div>

            {/* Section 3 */}
            <div>
              <h4 className="font-bold text-[#1e3a66] text-xs mb-1">
                3. การยกเลิกและแก้ไขข้อตกลง
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Orca Gymnastics ขอสงวนสิทธิ์ในการเปลี่ยนแปลง แก้ไข หรือยกเลิกข้อตกลงนี้ได้ตลอดเวลา โดยจะแจ้งให้ผู้ใช้บริการทราบผ่านช่องทางที่เหมาะสม
              </p>
              <ul className="list-disc list-inside pl-1 mt-1 space-y-1 text-slate-500">
                <li>การจองหรือยกเลิกคลาสเรียนต้องทำผ่านระบบล่วงหน้าอย่างน้อย 1 วัน (24 ชั่วโมง)</li>
                <li>กรณีขอยกเลิกกระทันหันน้อยกว่า 24 ชั่วโมง หรือขาดเรียนโดยไม่แจ้งล่วงหน้า ระบบจะตัดชั่วโมงเรียนตามปกติ</li>
              </ul>
            </div>

            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center font-bold text-emerald-800 text-[11px]">
              ✅ ท่านได้อ่านข้อตกลงและเงื่อนไขการบริการครบถ้วนแล้ว 100%
            </div>
          </div>

          {/* Footer Area with Checkbox, PDPA & Button */}
          <div className="pt-3 border-t border-slate-100 shrink-0 space-y-4">
            
            {/* Checkbox */}
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="acceptTermsCheck"
                disabled={!hasScrolledToBottom}
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-[#2563eb] text-[#2563eb] focus:ring-[#2563eb] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
              />
              <label
                htmlFor="acceptTermsCheck"
                className={`text-xs sm:text-sm font-bold select-none cursor-pointer ${
                  hasScrolledToBottom ? 'text-[#1e3a66]' : 'text-slate-400 cursor-not-allowed'
                }`}
              >
                {hasScrolledToBottom
                  ? 'ฉันได้อ่านและยอมรับระเบียบข้อปฏิบัตินี้'
                  : `ฉันได้อ่านและยอมรับระเบียบข้อปฏิบัตินี้ (เลื่อนอ่าน ${scrollProgress}%)`}
              </label>
            </div>

            {/* PDPA Section */}
            <div className={`p-3 bg-slate-50 rounded-xl border ${hasScrolledToBottom ? 'border-blue-100' : 'border-slate-100 opacity-50'}`}>
              <p className="text-xs font-bold text-[#1e3a66] mb-2 leading-relaxed">
                การใช้ภาพและสื่อประชาสัมพันธ์ (PDPA) <br/>
                <span className="text-[11px] font-normal text-slate-500">โดยทั้งหมดนี้จะถูกบันทึกในฐานข้อมูลเป็นไปตามนโยบาย กฎหมาย มาตรฐาน PDPA</span>
              </p>
              
              <div className="space-y-2">
                <label className={`flex items-start gap-2.5 ${!hasScrolledToBottom ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="media_consent"
                    disabled={!hasScrolledToBottom}
                    checked={mediaConsent === true}
                    onChange={() => setMediaConsent(true)}
                    className="mt-0.5 w-4 h-4 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer disabled:cursor-not-allowed shrink-0"
                  />
                  <span className="text-xs text-slate-700 leading-tight">
                    <strong>ยินยอม</strong> ให้โรงยิมใช้ภาพถ่ายหรือวิดีโอของผู้เรียนเพื่อการประชาสัมพันธ์
                  </span>
                </label>
                
                <label className={`flex items-start gap-2.5 ${!hasScrolledToBottom ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="media_consent"
                    disabled={!hasScrolledToBottom}
                    checked={mediaConsent === false}
                    onChange={() => setMediaConsent(false)}
                    className="mt-0.5 w-4 h-4 text-rose-500 focus:ring-rose-500 cursor-pointer disabled:cursor-not-allowed shrink-0"
                  />
                  <span className="text-xs text-slate-700 leading-tight">
                    <strong>ไม่ยินยอม</strong>
                  </span>
                </label>
              </div>
            </div>

            {/* Blue Pill Button */}
            <button
              onClick={handleAccept}
              disabled={!hasScrolledToBottom || !isChecked || mediaConsent === null}
              className={`w-full h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-base rounded-full shadow-[0_4px_0_#60a5fa] hover:shadow-[0_2px_0_#60a5fa] active:translate-y-0.5 transition-all font-['Anuphan',sans-serif] ${
                !hasScrolledToBottom || !isChecked || mediaConsent === null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              บันทึกและเข้าสู่ระบบ
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
