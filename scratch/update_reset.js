const fs = require('fs');

let page = `
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { UserProfile } from '@/lib/types';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [foundUser, setFoundUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  
  const [otpInput, setOtpInput] = useState('');
  const [otpHash, setOtpHash] = useState('');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [step, setStep] = useState<'request' | 'sent' | 'new_password'>('request');

  // Step 1: Verify Email entered by Parent and send OTP
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsVerifying(true);
    try {
      const allUsers = await store.getUsers();
      const cleanInput = email.trim().toLowerCase();
      
      let user = allUsers.find(u => {
        const uEmail = u.email ? u.email.toLowerCase() : '';
        return uEmail === cleanInput;
      });

      if (!user) {
        showToast('ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาใช้อีเมลที่ลงทะเบียนไว้');
        setIsVerifying(false);
        return;
      }
      
      if (!user.email || !user.email.includes('@')) {
        showToast('บัญชีนี้ไม่มีอีเมลที่ถูกต้อง กรุณาติดต่อ Admin');
        setIsVerifying(false);
        return;
      }

      setFoundUser(user);

      // Call API to send OTP
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name: user.name })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        showToast('เกิดข้อผิดพลาดในการส่งอีเมล: ' + (data.error || ''));
        setIsVerifying(false);
        return;
      }

      setOtpHash(data.hash);
      setStep('sent');
      showToast(\`ระบบได้ส่งรหัส OTP ไปที่อีเมล \${user.email} แล้ว\`);
    } catch (err) {
      console.error('Verify email error:', err);
      showToast('เกิดข้อผิดพลาดในการตรวจสอบข้อมูล');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim() || !foundUser) return;
    
    setIsVerifying(true);
    try {
      const res = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: foundUser.email, otp: otpInput.trim(), hash: otpHash })
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        setStep('new_password');
        showToast('ตรวจสอบ OTP สำเร็จ กรุณาตั้งรหัสผ่านใหม่');
      } else {
        showToast(data.error || 'รหัส OTP ไม่ถูกต้อง');
      }
    } catch (error) {
       showToast('เกิดข้อผิดพลาดในการตรวจสอบ OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser) return;

    if (newPassword !== confirmPassword) {
      showToast('รหัสผ่านทั้งสองช่องไม่ตรงกัน');
      return;
    }
    if (newPassword.length < 3) {
      showToast('รหัสผ่านต้องมีความยาวอย่างน้อย 3 ตัวอักษร');
      return;
    }

    setIsResetting(true);
    try {
      await store.updateUser(foundUser.id, {
        password: newPassword.trim()
      });
      showToast('🎉 ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่');
      router.push('/');
    } catch (err) {
      console.error('Reset password error:', err);
      showToast('เกิดข้อผิดพลาดในการตั้งรหัสผ่าน');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden bg-gradient-to-b from-[#ffffff] via-[#eaf4ff] to-[#d0e5ff]">
      
      <div className="absolute -top-16 -left-16 w-72 h-72 bg-[#d6e8ff]/70 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-24 h-24 bg-[#c8e2ff]/80 rounded-full blur-[1px] pointer-events-none" />
      <div className="absolute top-36 right-6 w-10 h-10 bg-[#b8d8fa]/70 rounded-full blur-[0.5px] pointer-events-none" />
      <div className="absolute top-48 right-12 w-5 h-5 bg-[#dbebff] rounded-full blur-[0.5px] pointer-events-none" />

      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-0">
        <svg className="relative block w-full h-40 sm:h-56" viewBox="0 0 1200 140" preserveAspectRatio="none">
          <path d="M0,40 C180,120 400,-10 650,70 C900,150 1080,20 1200,50 L1200,140 L0,140 Z" fill="#93c5fd" opacity="0.45" />
          <path d="M0,55 C220,130 480,10 720,80 C960,150 1100,40 1200,65 L1200,140 L0,140 Z" fill="#60a5fa" opacity="0.65" />
          <path d="M0,75 C260,135 520,35 780,95 C1020,150 1120,60 1200,85 L1200,140 L0,140 Z" fill="#2563eb" opacity="0.85" />
          <path d="M0,95 C300,145 600,55 850,110 C1050,150 1150,85 1200,105 L1200,140 L0,140 Z" fill="#1d4ed8" />
        </svg>
      </div>

      <div className="flex flex-col items-center text-center mb-6 relative z-10">
        <div className="w-36 flex justify-center items-center">
          <img
            src="/images/orca_logo.png"
            alt="ORCA GYMNASTICS"
            style={{ width: '150px', height: 'auto', maxWidth: '100%' }}
            className="object-contain"
          />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#001a3a] tracking-wider mt-1">
          ORCA GYMNASTICS
        </h1>
      </div>

      <div className="w-full max-w-[420px] bg-white rounded-[28px] shadow-2xl border border-white/80 relative z-10 overflow-hidden">
        
        <div className="bg-[#2b66c4] text-white py-5 px-6 text-center flex flex-col items-center justify-center rounded-t-[26px]">
          <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center mb-2">
            <svg className="w-7 h-7 text-white fill-current" viewBox="0 0 24 24">
              <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v2h2v-2h2v-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-wide">
            ตั้งรหัสผ่านใหม่
          </h2>
          <p className="text-sm text-blue-100 mt-1 font-medium">
            Reset Password
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          
          {step === 'request' && (
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              
              <div className="bg-blue-50/90 border border-blue-200/80 p-4 rounded-2xl text-slate-700 text-sm sm:text-base leading-relaxed">
                📌 <strong>คำแนะนำ:</strong> กรุณากรอก <strong>อีเมล</strong> ที่ได้แจ้งไว้กับทางแอดมิน เพื่อรับรหัส OTP สำหรับตั้งรหัสผ่านใหม่
              </div>

              <div>
                <label className="block text-base sm:text-lg font-bold text-[#001a3a] mb-2">
                  อีเมล (Email)
                </label>
                <div className="flex items-center border-2 border-[#7ca9ed] rounded-full overflow-hidden bg-white hover:border-[#2b66c4] focus-within:border-[#2b66c4] transition-all shadow-xs">
                  <div className="w-12 h-12 bg-[#2563eb] text-white flex items-center justify-center shrink-0 rounded-l-full">
                    <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-12 px-4 text-[#1e293b] font-bold text-base sm:text-lg outline-none bg-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-lg rounded-full shadow-[0_4px_0_#60a5fa] hover:shadow-[0_2px_0_#60a5fa] active:translate-y-1 transition-all cursor-pointer"
              >
                {isVerifying ? 'กำลังส่งรหัส OTP...' : 'รับรหัสผ่านทางอีเมล'}
              </button>

              <div className="text-center pt-2">
                <Link href="/" className="inline-flex items-center text-sm sm:text-base font-bold text-[#2563eb] hover:text-[#1d4ed8] hover:underline">
                  ← กลับสู่หน้าเข้าสู่ระบบ
                </Link>
              </div>
            </form>
          )}

          {step === 'sent' && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
              <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl text-emerald-900 text-base leading-relaxed">
                <span className="text-3xl block mb-2">📩</span>
                เราได้ส่งรหัส OTP 6 หลักไปที่อีเมล<br />
                <strong className="text-emerald-800">{foundUser?.email}</strong><br />
                <span className="text-sm text-emerald-700 mt-2 block">
                  กรุณากรอกรหัส OTP เพื่อยืนยันตัวตน
                </span>
              </div>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="รหัส OTP 6 หลัก"
                  className="w-full h-14 px-4 text-center text-[#1e293b] font-extrabold text-2xl tracking-[0.5em] border-2 border-[#7ca9ed] rounded-2xl outline-none focus:border-[#2b66c4] shadow-xs"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-full shadow-[0_4px_0_#34d399] active:translate-y-1 transition-all cursor-pointer"
              >
                {isVerifying ? 'กำลังตรวจสอบ...' : 'ยืนยันรหัส OTP'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-sm font-bold text-slate-500 hover:text-slate-800 underline border-none bg-transparent cursor-pointer"
                >
                  ลองกรอกอีเมลอื่น
                </button>
              </div>
            </form>
          )}

          {step === 'new_password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="text-sm sm:text-base text-slate-700 bg-sky-50 p-4 rounded-2xl border border-sky-100">
                👤 บัญชีผู้ใช้: <strong>{foundUser?.name}</strong>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-bold text-[#001a3a] mb-2">
                  รหัสผ่านใหม่
                </label>
                <div className="flex items-center border-2 border-[#7ca9ed] rounded-full overflow-hidden bg-white hover:border-[#2b66c4] focus-within:border-[#2b66c4] transition-all shadow-xs relative">
                  <div className="w-12 h-12 bg-[#2563eb] text-white flex items-center justify-center shrink-0 rounded-l-full">
                    <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-12 pl-4 pr-12 text-[#1e293b] font-bold text-base sm:text-lg outline-none bg-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 text-slate-400 hover:text-slate-700 border-none bg-transparent cursor-pointer"
                  >
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-bold text-[#001a3a] mb-2">
                  ยืนยันรหัสผ่านใหม่
                </label>
                <div className="flex items-center border-2 border-[#7ca9ed] rounded-full overflow-hidden bg-white hover:border-[#2b66c4] focus-within:border-[#2b66c4] transition-all shadow-xs">
                  <div className="w-12 h-12 bg-[#2563eb] text-white flex items-center justify-center shrink-0 rounded-l-full">
                    <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-12 px-4 text-[#1e293b] font-bold text-base sm:text-lg outline-none bg-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isResetting}
                className="w-full h-12 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-lg rounded-full shadow-[0_4px_0_#60a5fa] hover:shadow-[0_2px_0_#60a5fa] active:translate-y-1 transition-all cursor-pointer"
              >
                {isResetting ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/"
                  className="text-sm sm:text-base font-bold text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
                >
                  ← ยกเลิก / กลับสู่หน้าเข้าสู่ระบบ
                </Link>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
`;
fs.writeFileSync('app/reset-password/page.tsx', page, 'utf8');
