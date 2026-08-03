'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';
import { registerUser } from '@/app/actions/auth';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await registerUser({ fullName, phone, password } as any);
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/login?registered=true');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif" }}>
      <div className="w-full max-w-[400px] p-8 flex flex-col items-center">
        
        <div className="mb-2">
          <Image 
            src="/images/logo.png" 
            alt="ORCA GYMNASTICS" 
            width={180} 
            height={180}
            className="object-contain"
          />
        </div>
        
        <h1 className="text-[20px] font-bold text-black mb-6 tracking-widest uppercase text-center">
          ORCA GYMNASTICS
        </h1>

        <h2 className="text-[26px] font-bold text-[#1a2d5c] underline underline-offset-8 decoration-[3px] mb-8">
          Register
        </h2>

        {error && (
          <div className="w-full p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="flex items-center space-x-3">
            <label className="w-40 text-[18px] text-black text-left">Parent's Full Name</label>
            <input 
              type="text" 
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="flex-1 w-full px-4 py-1.5 border-[1.5px] border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#183363]" 
              required 
            />
          </div>

          <div className="flex items-center space-x-3 relative">
            <label className="w-40 text-[18px] text-black text-left">Password</label>
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex-1 w-full px-4 py-1.5 border-[1.5px] border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#183363]" 
              required 
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute -right-9 top-1/2 -translate-y-1/2 text-black hover:text-gray-700">
              {showPassword ? <EyeOff size={24} strokeWidth={2.5} /> : <Eye size={24} strokeWidth={2.5} />}
            </button>
          </div>

          <div className="flex items-center space-x-3 relative">
            <label className="w-40 text-[18px] text-black text-left">Confirm Password</label>
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="flex-1 w-full px-4 py-1.5 border-[1.5px] border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#183363]" 
              required 
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute -right-9 top-1/2 -translate-y-1/2 text-black hover:text-gray-700">
              {showConfirmPassword ? <EyeOff size={24} strokeWidth={2.5} /> : <Eye size={24} strokeWidth={2.5} />}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <label className="w-40 text-[18px] text-black text-left">Phone Number</label>
            <input 
              type="text" 
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1 w-full px-4 py-1.5 border-[1.5px] border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-[#183363]" 
              required 
            />
          </div>
          
          <div className="pt-8 flex justify-center w-full">
            <button 
              type="submit" 
              disabled={loading}
              className="w-[200px] py-2.5 text-white bg-[#1a2d5c] rounded-[2rem] hover:bg-[#111d3d] focus:outline-none font-bold text-[24px] tracking-wide shadow-[0px_4px_0px_0px_#ef4444,0px_4px_0px_2px_#1a2d5c] border-2 border-[#1a2d5c] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#ef4444] transition-all disabled:opacity-50"
            >
              {loading ? 'Wait...' : 'Sign up'}
            </button>
          </div>

          <div className="mt-8 text-[18px] text-gray-600 text-center">
            Already have an account? <Link href="/login" className="font-bold text-[#1a2d5c]">Sign in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
