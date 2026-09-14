'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { UserProfile } from '@/lib/types';

export default function SignInPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    router.prefetch('/home');
    router.prefetch('/admin/dashboard');
  }, [router]);

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    
    // Completely strip any zero-width spaces, thin spaces, etc.
    const rawUser = username.replace(/[\u200B-\u200D\uFEFF]/g, '');
    const cleanUsername = rawUser.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      showToast('กรุณากรอก Username, อีเมล หรือเบอร์โทรศัพท์');
      return;
    }
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword })
      });
      const data = await res.json();
      
      if (data.success && data.user) {
        store.setCurrentUser(data.user);
        showToast(`ยินดีต้อนรับ ${data.user.name}`);
        router.push(data.user.role === 'admin' ? '/admin/dashboard' : '/home');
      } else {
        showToast('❌ รหัสผ่านไม่ถูกต้อง หรือไม่พบข้อมูลผู้ใช้งาน');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Sign in error:', err);
      showToast('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden bg-gradient-to-b from-[#ffffff] via-[#eaf4ff] to-[#d0e5ff]">
      
      {/* Wallpaper Theme Ornaments (Matching Reference Image) */}
      {/* Top-Left Soft Blue Blob Curve */}
      <div className="absolute -top-16 -left-16 w-72 h-72 bg-[#d6e8ff]/70 rounded-full blur-2xl pointer-events-none" />

      {/* Top-Right Soft Blue Floating Bubbles */}
      <div className="absolute top-10 right-10 w-24 h-24 bg-[#c8e2ff]/80 rounded-full blur-[1px] pointer-events-none" />
      <div className="absolute top-36 right-6 w-10 h-10 bg-[#b8d8fa]/70 rounded-full blur-[0.5px] pointer-events-none" />
      <div className="absolute top-48 right-12 w-5 h-5 bg-[#dbebff] rounded-full blur-[0.5px] pointer-events-none" />

      {/* Bottom Layered Ocean Waves (Exact Match to Reference Image) */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none z-0">
        <svg className="relative block w-full h-40 sm:h-56" viewBox="0 0 1200 140" preserveAspectRatio="none">
          <path d="M0,40 C180,120 400,-10 650,70 C900,150 1080,20 1200,50 L1200,140 L0,140 Z" fill="#93c5fd" opacity="0.45" />
          <path d="M0,55 C220,130 480,10 720,80 C960,150 1100,40 1200,65 L1200,140 L0,140 Z" fill="#60a5fa" opacity="0.65" />
          <path d="M0,75 C260,135 520,35 780,95 C1020,150 1120,60 1200,85 L1200,140 L0,140 Z" fill="#2563eb" opacity="0.85" />
          <path d="M0,95 C300,145 600,55 850,110 C1050,150 1150,85 1200,105 L1200,140 L0,140 Z" fill="#1d4ed8" />
        </svg>
      </div>

      {/* Top Branding Section */}
      <div className="flex flex-col items-center text-center mb-6 relative z-10">
        {/* Transparent Logo */}
        <div className="w-40 sm:w-44 flex justify-center items-center">
          <img
            src="/images/orca_logo.png"
            alt="ORCA GYMNASTICS"
            style={{ width: '160px', height: 'auto', maxWidth: '100%' }}
            className="object-contain"
          />
        </div>
      </div>

      {/* Member Login Card (Exact Pixel-Perfect Match) */}
      <div className="w-full max-w-[365px] bg-white rounded-[28px] shadow-2xl border border-white/60 relative z-10 overflow-hidden">
        
        {/* Card Header Banner (Royal Blue background, 3-people icon, MEMBER LOGIN) */}
        <div className="bg-[#2b66c4] text-white py-5 px-4 text-center flex flex-col items-center justify-center rounded-t-[26px]">
          {/* 3 People SVG Outline Icon */}
          <svg className="w-10 h-10 text-white mb-1" width="40" height="40" style={{ width: '40px', height: '40px' }} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-lg font-bold tracking-wider font-['Anuphan',sans-serif] uppercase">
            MEMBER LOGIN
          </h2>
        </div>

        {/* Card Form Body */}
        <form onSubmit={handleSignIn} className="p-6 space-y-4">
          
          {/* Username Input Field */}
          <div className="flex items-center border border-[#7ca9ed] rounded-full overflow-hidden bg-white hover:border-[#2b66c4] focus-within:border-[#2b66c4] transition-all shadow-xs">
            <div className="w-12 h-11 bg-[#2563eb] text-white flex items-center justify-center shrink-0 rounded-l-full">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full h-11 px-3 text-[#1e293b] font-['Anuphan',sans-serif] font-bold text-base outline-none bg-transparent placeholder:text-[#94a3b8]"
              required
            />
          </div>

          {/* Password Input Field */}
          <div className="flex items-center border border-[#7ca9ed] rounded-full overflow-hidden bg-white hover:border-[#2b66c4] focus-within:border-[#2b66c4] transition-all shadow-xs relative">
            <div className="w-12 h-11 bg-[#2563eb] text-white flex items-center justify-center shrink-0 rounded-l-full">
              <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full h-11 pl-3 pr-10 text-[#1e293b] font-['Anuphan',sans-serif] font-bold text-base outline-none bg-transparent placeholder:text-[#94a3b8]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-slate-400 hover:text-slate-700 bg-transparent border-none cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <svg className="w-5 h-5 text-slate-500 hover:text-slate-800" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>

          {/* Remember me Checkbox */}
          <div className="flex items-center gap-2.5 ml-1 pt-1">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-[#2b66c4] text-[#2563eb] cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-base font-bold text-[#1d4ed8] font-['Anuphan',sans-serif] cursor-pointer">
              Remember me
            </label>
          </div>

          {/* Sign in Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-lg rounded-full shadow-[0_4px_0_#60a5fa] hover:shadow-[0_2px_0_#60a5fa] hover:translate-y-0.5 active:translate-y-1 transition-all cursor-pointer font-['Anuphan',sans-serif]"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Footer Reset Password Link */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100 text-xs font-bold font-['Anuphan',sans-serif]">
            <span className="text-[#94a3b8] font-semibold text-xs">
              Forgot Password ?
            </span>
            <Link
              href="/reset-password"
              className="border border-[#93c5fd] bg-white hover:bg-blue-50 text-[#2563eb] px-3.5 py-1 rounded-full font-bold text-[11px] uppercase tracking-wide transition-all cursor-pointer"
            >
              RESET PASSWORD
            </Link>
          </div>

        </form>

      </div>
    </div>
  );
}
