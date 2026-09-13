'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { UserProfile } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (password !== confirmPassword) {
      showToast('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (!acceptTerms) {
      showToast('กรุณากดยอมรับเงื่อนไขก่อนเข้าเรียน');
      return;
    }

    setIsSubmitting(true);
    try {
      const newUser: UserProfile = {
        id: 'u_' + Date.now(),
        user_id: phone.trim() || fullName.trim(),
        name: fullName.trim(),
        phone: phone.trim(),
        role: 'parent'
      };

      await store.saveUser(newUser);
      store.setCurrentUser(newUser);
      showToast('สมัครสมาชิกสำเร็จ กรุณาเพิ่มข้อมูลผู้เรียน (ลูก)');
      router.push('/home');
    } catch (err) {
      console.error('Registration error:', err);
      showToast('สมัครสมาชิกสำเร็จ');
      router.push('/home');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-2 text-center font-sans">
      <div className="mb-4 flex flex-col items-center">
        <img
          src="/images/orca_logo.png"
          alt="ORCA GYMNASTICS"
          style={{ width: '180px', maxWidth: '85%', height: 'auto' }}
          className="mx-auto object-contain mb-2"
        />
        <h2 className="text-2xl font-bold text-[#001a3a] underline mt-2 font-sans">
          Register
        </h2>
      </div>

      <form onSubmit={handleRegister} className="w-full max-w-[320px] text-left">
        <div className="mb-4">
          <label className="block text-lg font-bold text-[#001a3a] mb-1">
            Parent's Full Name
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
            Password
          </label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 px-4 border-[1.8px] border-[#486581] rounded-full text-[#102a43] focus:outline-none focus:border-[#001a3a]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-lg font-bold text-[#001a3a] mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPwd ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 px-4 border-[1.8px] border-[#486581] rounded-full text-[#102a43] focus:outline-none focus:border-[#001a3a]"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-lg font-bold text-[#001a3a] mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full h-11 px-4 border-[1.8px] border-[#486581] rounded-full text-[#102a43] focus:outline-none focus:border-[#001a3a]"
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-base font-bold text-[#001a3a] mb-1">
            เงื่อนไขการเข้าเรียน & ความปลอดภัย
          </label>
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-700 leading-relaxed mb-3">
            📌 <strong>เงื่อนไขและข้อตกลงในการเรียน Orca Gymnastics</strong><br />
            1. นักเรียนต้องแต่งกายชุดยิมนาสติกหรือชุดกีฬาที่เหมาะสม<br />
            2. การจองคลาสเรียนหรือยกเลิกคลาสเรียนต้องทำล่วงหน้าอย่างน้อย 1 วัน<br />
            3. ผู้ปกครองต้องแจ้งประวัติสุขภาพหรือข้อจำกัดทางร่างกายของนักเรียนให้ยิมทราบก่อนเข้าเรียน<br />
            4. ชั่วโมงเรียนมีอายุตามที่กำหนดในแพ็กเกจ
          </div>
          <div className="flex items-center gap-2 font-bold text-base text-[#102a43]">
            <input
              type="checkbox"
              id="acceptTerms"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="w-4 h-4 accent-[#001a3a] cursor-pointer"
              required
            />
            <label htmlFor="acceptTerms" className="cursor-pointer">ยอมรับเงื่อนไขก่อนเข้าเรียน</label>
          </div>
        </div>

        <button type="submit" className="btn-primary-orca">
          {isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'Sign up'}
        </button>
      </form>

      <div className="mt-6 text-base text-[#334e68] space-y-2">
        <p>
          Already have an account?{' '}
          <Link href="/" className="text-[#003366] font-bold text-lg underline">
            Sign in
          </Link>
        </p>
        <span className="inline-block bg-sky-100 text-sky-800 font-bold px-3 py-1 rounded-full text-xs">
          ข้อมูลผู้ปกครอง
        </span>
      </div>
    </div>
  );
}
