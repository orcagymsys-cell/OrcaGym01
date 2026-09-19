'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { compressImage } from '@/lib/imageUtils';
import { Child } from '@/lib/types';

export default function AddChildPage() {
  const router = useRouter();
  const [childrenCount, setChildrenCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [dob, setDob] = useState('2020-05-05');
  const [gender, setGender] = useState('Girl');
  const [selectedHours, setSelectedHours] = useState<number | ''>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsTooltip, setShowTermsTooltip] = useState(false);
  const [parentPurchased, setParentPurchased] = useState(0);
  const [familyUsed, setFamilyUsed] = useState(0);

  useEffect(() => {
    async function checkCount() {
      const user = store.getCurrentUser();
      if (!user) {
        router.push('/');
        return;
      }
      const existing = await store.getChildren(user.id);
      if (existing.length >= 20) {
        showToast('สามารถเพิ่มข้อมูลเด็กได้สูงสุด 20 คนต่อบัญชี');
        router.push('/home');
        return;
      }
      setChildrenCount(existing.length);

      // คำนวณโควต้าตะกร้าครอบครัว
      const purchased = user.purchased_hours || 6;
      const used = existing.reduce((sum, c) => sum + (c.total_hours || 0), 0);
      setParentPurchased(purchased);
      setFamilyUsed(used);
    }
    checkCount();
  }, [router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      try {
        const compressedBase64 = await compressImage(file, 600);
        setPhotoDataUrl(compressedBase64);
      } catch (err) {
        console.error('Failed to compress image:', err);
        // Fallback to original
        const reader = new FileReader();
        reader.onload = (evt) => {
          setPhotoDataUrl(evt.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const saveChild = async (): Promise<Child | null> => {
    let user = store.getCurrentUser();
    if (!user) {
      const allUsers = await store.getUsers();
      const parentUser = allUsers.find(u => u.role !== 'admin') || {
        id: 'u_napaporn',
        user_id: 'napaporn',
        name: 'นภาพร ภู่วรวรรณ',
        phone: '0812345678',
        email: 'napaporn@gmail.com',
        role: 'parent' as const
      };
      user = parentUser;
      store.setCurrentUser(user);
    }

    // Ensure parent user profile is persisted in USERS list
    await store.saveUser(user);

    const fName = fullName.trim() || nickname.trim();
    const nName = nickname.trim() || (fullName.trim() ? fullName.trim().split(/\s+/)[0] : '');

    if (!fName || !nName) {
      showToast('กรุณากรอกชื่อและชื่อเล่นของเด็ก');
      return null;
    }

    const validDob = dob || '2020-05-05';

    // ตรวจสอบโควต้าตะกร้าครอบครัว: โควต้าที่ยังเหลืออยู่ในตะกร้า
    const latestChildren = await store.getChildren(user.id);
    const latestUsed = latestChildren.reduce((sum, c) => sum + (c.total_hours || 0), 0);
    const purchased = user.purchased_hours || 6;
    const basketRemaining = purchased - latestUsed;
    
    // Default to remaining basket hours if not explicitly set
    const hoursToSet = selectedHours !== '' ? Number(selectedHours) : Math.max(0, basketRemaining);

    if (hoursToSet > basketRemaining) {
      showToast(`⚠️ ไม่สามารถเพิ่มได้! โควต้าที่เหลือในตะกร้าครอบครัวมีเพียง ${basketRemaining} ครั้ง แต่ต้องการกำหนด ${hoursToSet} ครั้ง กรุณาแก้ไขจำนวนหรือติดต่อแอดมินเพื่อเติมโควต้า`);
      setParentPurchased(purchased);
      setFamilyUsed(latestUsed);
      return null;
    }

    if (basketRemaining <= 0) {
      showToast(`⚠️ โควต้าตะกร้าครอบครัวถูกใช้หมดแล้ว (${purchased} ครั้ง) กรุณาติดต่อแอดมินเพื่อเติมโควต้า`);
      return null;
    }

    const pid = (user.id && user.id !== 'u_parent' && user.id !== 'parent')
      ? user.id
      : (user.user_id || user.email || user.name || user.phone || 'u_napaporn');

    const newChild: Child = {
      id: 'c_' + Date.now() + Math.floor(Math.random() * 1000),
      parent_id: pid,
      full_name: fName,
      nickname: nName,
      dob: validDob,
      gender,
      avatar: gender.toLowerCase() === 'boy' ? 'boy' : 'girl',
      photo_url: photoDataUrl || null,
      status: 'approved',
      course_name: 'Orca Cubs',
      total_hours: hoursToSet,
      used_hours: 0,
      expiry_date: (() => {
        let months = 2;
        const p = user.purchased_hours || 6;
        if (p >= 48) months = 12;
        else if (p >= 24) months = 6;
        else if (p >= 12) months = 4;
        const d = new Date(user.payment_datetime || user.created_at || new Date().toISOString().replace(' ', 'T'));
        const validD = isNaN(d.getTime()) ? new Date() : d;
        validD.setMonth(validD.getMonth() + months);
        return `${String(validD.getDate()).padStart(2, '0')}/${String(validD.getMonth() + 1).padStart(2, '0')}/${validD.getFullYear()}`;
      })()
    };

    await store.saveChild(newChild);
    // อัปเดตโควต้าใน state หลังบันทึก
    setFamilyUsed(latestUsed);
    setParentPurchased(purchased);
    return newChild;
  };

  const handleAddAnother = async () => {
    if (childrenCount + 1 >= 20) {
      showToast('สามารถเพิ่มข้อมูลเด็กได้สูงสุด 20 คนเท่านั้น');
      return;
    }

    setIsSubmitting(true);
    try {
      const saved = await saveChild();
      if (saved) {
        showToast(`เพิ่มข้อมูล ${saved.nickname} เรียบร้อยแล้ว (เปิดใช้งานคอร์สเรียนเรียบร้อย)`);
        setFullName('');
        setNickname('');
        setSelectedHours('');
        setPhotoDataUrl(null);
        setSelectedFile(null);
        setChildrenCount(prev => prev + 1);
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDone = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const saved = await saveChild();
      if (saved) {
        showToast(`บันทึกข้อมูล ${saved.nickname} เรียบร้อยแล้ว (เปิดใช้งานคอร์สเรียนเรียบร้อย)`);
        router.push('/home');
      }
    } catch (err: any) {
      showToast('Error: ' + err.message);
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const titleText = childrenCount === 0 
    ? 'Student Information' 
    : childrenCount === 1 
    ? 'Add 2nd Child' 
    : childrenCount === 2 
    ? 'Add 3rd Child' 
    : `Add ${childrenCount + 1}th Child`;

  return (
    <div className="font-sans">
      <div className="mb-4">
        <BackButton text="◀ Back (กลับหน้า Home)" />
      </div>

      <h2 className="text-2xl font-bold text-[#001a3a] text-center mb-4">
        {titleText}
      </h2>

      {/* Family Basket Quota Banner */}
      {parentPurchased > 0 && (
        <div className={`mx-auto max-w-md mb-5 px-4 py-3 rounded-2xl border text-sm font-bold text-center flex items-center justify-center gap-2 ${
          (parentPurchased - familyUsed) <= 0
            ? 'bg-rose-50 border-rose-300 text-rose-700'
            : (parentPurchased - familyUsed) <= 2
            ? 'bg-amber-50 border-amber-300 text-amber-800'
            : 'bg-sky-50 border-sky-200 text-sky-800'
        }`}>
          🛒 โควต้าตะกร้าครอบครัว:
          <span className="text-lg font-extrabold">
            {Math.max(0, parentPurchased - familyUsed)}
          </span>
          / {parentPurchased} ครั้ง ที่ยังไม่จัดสรร
          {(parentPurchased - familyUsed) <= 0 && (
            <span className="ml-1 text-rose-600">⚠️ หมดแล้ว!</span>
          )}
        </div>
      )}

      {/* Photo Upload Circle Container */}
      <div className="relative w-24 h-24 mx-auto mb-6 cursor-pointer">
        <label htmlFor="photoInput" className="cursor-pointer block w-full h-full">
          <div className="w-full h-full rounded-full border-[3.5px] border-sky-600 bg-sky-100 flex items-center justify-center text-4xl overflow-hidden shadow-inner">
            {photoDataUrl ? (
              <img src={photoDataUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span>👧🏻</span>
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-lg font-bold border-2 border-white shadow">
            +
          </div>
        </label>
        <input
          type="file"
          id="photoInput"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <form onSubmit={handleDone} className="w-full max-w-[320px] mx-auto text-left">
        <div className="mb-4">
          <label className="block text-lg font-bold text-[#001a3a] mb-1">
            Child's Full Name:
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full h-11 px-4 border-[1.8px] border-[#486581] rounded-full text-[#102a43] focus:outline-none focus:border-[#001a3a]"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-bold text-[#001a3a] mb-1">
            Nickname:
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full h-11 px-4 border-[1.8px] border-[#486581] rounded-full text-[#102a43] focus:outline-none focus:border-[#001a3a]"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-bold text-[#001a3a] mb-1">
            Date of Birth <span className="text-sm text-slate-500 font-normal">(กดรูปปฏิทินด้านขวาเพื่อเลือกวันเกิด)</span>:
          </label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="w-full h-11 px-4 border-[1.8px] border-[#486581] rounded-full text-[#102a43] focus:outline-none focus:border-[#001a3a]"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-lg font-bold text-[#001a3a] mb-1">
            Gender:
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full h-11 px-4 border-[1.8px] border-[#486581] rounded-full text-[#102a43] focus:outline-none focus:border-[#001a3a]"
            required
          >
            <option value="Girl">Girl (เด็กหญิง)</option>
            <option value="Boy">Boy (เด็กชาย)</option>
          </select>
        </div>

        {/* Selected Course Hours Input */}
        <div className="mb-6 font-['Anuphan',sans-serif]">
          <label className="flex flex-wrap items-center gap-1 text-base font-bold text-[#001a3a] mb-1">
            จัดสรรจำนวนครั้ง/ชั่วโมงเรียนให้น้อง:
            {parentPurchased > 0 && (
              <span className="text-xs font-normal text-sky-700">
                (เหลือในตะกร้า: <strong>{Math.max(0, parentPurchased - familyUsed)}</strong> ครั้ง)
              </span>
            )}
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={selectedHours}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '');
              const num = val === '' ? '' : Number(val);
              const maxAllowed = Math.max(0, parentPurchased - familyUsed);
              if (num !== '' && parentPurchased > 0 && Number(num) > maxAllowed) {
                showToast(`⚠️ ใส่ได้สูงสุด ${maxAllowed} ครั้ง (โควต้าที่เหลือในตะกร้าครอบครัว)`);
                setSelectedHours(maxAllowed);
              } else {
                setSelectedHours(num);
              }
            }}
            placeholder={parentPurchased > 0 ? `สูงสุด ${Math.max(0, parentPurchased - familyUsed)} ครั้ง` : 'โปรดระบุจำนวนครั้งที่ต้องการให้น้อง'}
            className="w-full h-11 px-4 border-[1.8px] border-[#486581] rounded-full text-[#102a43] font-bold text-sm bg-sky-50/50 focus:outline-none focus:border-[#001a3a] placeholder:text-slate-400 placeholder:font-normal"
            required
          />
          <p className="text-[11px] text-slate-500 font-normal mt-1 pl-2">
            * ระบุจำนวนครั้งเรียนจากตะกร้าครอบครัวเพื่อจัดสรรให้เด็กคนนี้
            {parentPurchased > 0 && ` (ใส่ได้สูงสุด ${Math.max(0, parentPurchased - familyUsed)} ครั้ง)`}
          </p>
        </div>

        {/* Terms Acceptance & Hover Popover Detail Box */}
        <div className="mb-6 relative font-['Anuphan',sans-serif]">
          <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer shrink-0"
              required
            />
            <label htmlFor="acceptTerms" className="text-xs font-bold text-[#001a3a] cursor-pointer select-none leading-tight">
              ฉันยอมรับ{' '}
              <a
                href="/terms"
                target="_blank"
                onMouseEnter={() => setShowTermsTooltip(true)}
                onMouseLeave={() => setShowTermsTooltip(false)}
                className="text-blue-600 underline font-extrabold cursor-pointer relative inline-block hover:text-blue-800"
              >
                [ข้อตกลงและเงื่อนไขการให้บริการ]
              </a>{' '}
              <span className="text-[11px] text-slate-500 font-normal">(I accept terms and conditions)</span>
            </label>
          </div>

          {/* Hover Detail Box */}
          {showTermsTooltip && (
            <div 
              onMouseEnter={() => setShowTermsTooltip(true)}
              onMouseLeave={() => setShowTermsTooltip(false)}
              className="absolute bottom-full left-0 mb-2 w-full bg-white border-2 border-sky-400 rounded-2xl p-4 shadow-xl z-50 text-left animate-fadeIn"
            >
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-sky-100">
                <span className="text-lg">📜</span>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#001a3a]">
                  ข้อตกลงและเงื่อนไขการให้บริการ (Terms & Conditions)
                </h4>
              </div>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-4 font-normal leading-relaxed">
                <li>การลาเรียน ต้องแจ้งล่วงหน้าอย่างน้อย 24 ชั่วโมง มิฉะนั้นจะไม่สามารถขอเรียนชดเชยได้</li>
                <li>ขอสงวนสิทธิ์ไม่คืนค่าเรียนทุกกรณีหลังจากเริ่มคอร์สแล้ว (เว้นแต่มีใบรับรองแพทย์)</li>
                <li>ควรมาถึงโรงยิมก่อนเวลาเรียน 10-15 นาที และแต่งกายด้วยชุดฝึกซ้อมของทางโรงยิมให้เรียบร้อย</li>
                <li>สิทธิ์การเรียนชดเชยเป็นไปตามจำนวนและระยะเวลาที่โรงยิมกำหนด</li>
              </ul>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-sky-800 font-bold text-center">
                💡 เลื่อนเมาส์ออกเพื่อซ่อนกล่อง หรือคลิกเพื่อเปิดดูข้อตกลงฉบับเต็ม
              </div>
            </div>
          )}
        </div>

        {/* + Add Another Child Button */}
        <button
          type="button"
          onClick={handleAddAnother}
          disabled={isSubmitting}
          className="w-full max-w-[300px] bg-sky-600 text-white font-bold text-lg py-3 rounded-full border-b-[3.5px] border-sky-800 mx-auto block mb-3.5 hover:bg-sky-700 active:translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:border-b-0 disabled:translate-y-[3.5px]"
        >
          {isSubmitting ? 'กำลังบันทึก...' : '+ Add Another Child'}
        </button>

        {/* Done Button */}
        <button 
          type="submit" 
          className="btn-primary-orca disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'กำลังบันทึก...' : 'Done'}
        </button>
      </form>
    </div>
  );
}
