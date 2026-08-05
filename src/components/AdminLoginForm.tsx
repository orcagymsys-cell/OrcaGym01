'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import Image from 'next/image';
import { Eye, EyeOff, Shield } from 'lucide-react';

export default function AdminLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, 'admin', password);

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else if (res?.success) {
        window.location.href = '/admin/dashboard';
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred during admin login.');
      setLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="w-full max-w-md p-10 flex flex-col items-center bg-slate-800 rounded-2xl shadow-2xl border border-slate-700">
        <img 
          src="/images/logo_light.png" 
          alt="ORCA GYMNASTICS" 
          className="w-40 h-40 object-contain mb-6 drop-shadow-md" 
        />

        
        <h1 className="text-2xl font-bold text-white mb-2">ADMIN PORTAL</h1>
        <p className="text-slate-400 text-sm mb-8">Authorized Personnel Only</p>

        {error && (
          <div className="w-full p-3 mb-6 text-sm text-red-200 bg-red-900/50 border border-red-800 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[34px] text-slate-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none font-semibold text-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Log in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
