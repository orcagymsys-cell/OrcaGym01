'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('orca_parent_username');
    const savedPass = localStorage.getItem('orca_parent_password');
    if (savedUser && savedPass) {
      setUsername(savedUser);
      setPassword(savedPass);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('orca_parent_username', username);
      localStorage.setItem('orca_parent_password', password);
    } else {
      localStorage.removeItem('orca_parent_username');
      localStorage.removeItem('orca_parent_password');
    }

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'parent' }),
      });

      const data = await res.json().catch(() => ({ error: 'Invalid response from server' }));

      if (res.ok && data?.success) {
        if (data.user?.id) {
          document.cookie = `session=${data.user.id}; path=/; max-age=604800; SameSite=Lax`;
        }
        window.location.href = data.user?.first_login ? '/family/add' : '/dashboard';
      } else {
        setError(data?.error || 'เข้าสู่ระบบไม่สำเร็จ');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้');
      setLoading(false);
    }
  };




  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
      <div 
        className="w-full max-w-md bg-white/80 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col items-center" 
      >
        
        <img 
          src="/images/logo.png" 
          alt="ORCA GYMNASTICS" 
          className="w-32 h-32 sm:w-40 sm:h-40 object-contain mb-4 transition-transform hover:scale-105 duration-300"
        />

        
        <h1 className="text-xl sm:text-2xl font-bold text-black mb-8 sm:mb-10 tracking-widest uppercase text-center">
          ORCA GYMNASTICS
        </h1>

        {error && (
          <div className="w-full p-4 mb-6 text-sm text-red-500 bg-red-50 rounded-xl border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5 sm:space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <label className="w-full sm:w-24 text-base sm:text-lg font-bold text-black pl-2 sm:pl-0 text-left">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="flex-1 w-full px-5 py-2.5 sm:py-2 border-2 border-slate-700 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#183363] transition-all bg-white/50 backdrop-blur-sm"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0">
            <label className="w-full sm:w-24 text-base sm:text-lg font-bold text-black pl-2 sm:pl-0 text-left">Password</label>
            <div className="flex-1 relative w-full">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-2.5 sm:py-2 border-2 border-slate-700 rounded-full focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-[#183363] transition-all pr-12 bg-white/50 backdrop-blur-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
              </button>
            </div>
          </div>

          <div className="flex items-center sm:pl-[112px] pt-1">
            <label className="flex items-center space-x-3 text-sm sm:text-base text-black cursor-pointer group select-none">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer appearance-none w-5 h-5 rounded-md border-2 border-black checked:bg-[#183363] checked:border-[#183363] transition-colors cursor-pointer" 
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium group-hover:text-gray-700 transition-colors">Remember me</span>
            </label>
          </div>

          <div className="pt-6 sm:pt-8 flex justify-center w-full">
            <button
              type="submit"
              disabled={loading}
              className="w-[85%] sm:w-[220px] py-3 text-white bg-[#1a2d5c] rounded-full hover:bg-[#111d3d] focus:outline-none font-bold text-xl sm:text-2xl tracking-wide disabled:opacity-50 shadow-[0px_5px_0px_0px_#ef4444,0px_5px_0px_2px_#1a2d5c] border-2 border-[#1a2d5c] mb-2 transition-all active:translate-y-1 active:shadow-[0px_0px_0px_0px_#ef4444] disabled:active:translate-y-0"
            >
              {loading ? 'Wait...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center space-y-4 pt-6 sm:pt-8 border-t border-gray-100 mt-4">
            <div className="text-xs sm:text-sm font-semibold text-slate-600 bg-sky-50/80 p-3.5 rounded-2xl border border-sky-200 text-left leading-relaxed">
              💡 ผู้ปกครองจะได้รับ <strong>Username</strong> และ <strong>Password</strong> สำหรับเข้าสู่ระบบจากแอดมินโดยตรงหลังจากสั่งซื้อคลาสเรียนยิมนาสติกเรียบร้อยแล้ว
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
