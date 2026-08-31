'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ParentMenu from '@/components/ParentMenu';

export default function ChangePasswordClient() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);

    try {
      // Get current user ID from cookie
      const sessionCookie = document.cookie.split('; ').find(row => row.startsWith('session='));
      if (!sessionCookie) {
        throw new Error('ไม่พบเซสชัน กรุณาเข้าสู่ระบบใหม่');
      }
      const userId = sessionCookie.split('=')[1];

      // Verify current password
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        throw new Error('ไม่พบข้อมูลผู้ใช้งาน');
      }

      if (user.password !== currentPassword) {
        throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      }

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: newPassword })
        .eq('id', userId);

      if (updateError) {
        throw new Error('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }

      setSuccess('เปลี่ยนรหัสผ่านสำเร็จ!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-[family-name:'Comic_Sans_MS',_'Chalkboard_SE',_'Comic_Neue',_sans-serif] pb-20">
      
      {/* Header Area to match Dashboard */}
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-2 relative sm:pt-4">
          <div className="shrink-0 flex justify-center sm:justify-start w-full sm:w-auto mt-16 sm:mt-0">
            <img 
              src="/images/logo.png" 
              alt="ORCA" 
              className="object-contain w-32 sm:w-40 h-auto" 
            />
          </div>
          
          <div className="flex items-center space-x-3 sm:absolute sm:left-1/2 sm:-translate-x-1/2 my-4 sm:my-0">
            <span className="text-4xl sm:text-5xl" role="img" aria-label="key">🔑</span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#183363] border-b-4 border-[#183363] pb-1 whitespace-nowrap flex items-center font-[family-name:'MiPancake',_sans-serif]">
              CHANGE PASSWORD
            </h1>
          </div>
          
          <div className="w-[120px] hidden sm:block" />
        </div>
        
        <div className="w-full max-w-5xl mx-auto h-[4px] bg-slate-300 mb-6 rounded-full"></div>

        <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-start gap-6">
          {/* Left Sidebar Menu */}
          <div className="w-full md:w-[240px] shrink-0 sticky top-6 z-40 hidden md:block">
            <ParentMenu />
          </div>
          
          {/* Mobile Menu */}
          <div className="w-full shrink-0 mb-4 md:hidden flex justify-center">
            <ParentMenu />
          </div>

          {/* Right Main Content */}
          <div className="flex-1 w-full min-w-0">
            <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-white rounded-3xl shadow-xl border-4 border-sky-100">
              <h2 className="text-2xl font-black text-[#183363] mb-6 text-center tracking-wide">เปลี่ยนรหัสผ่าน</h2>
              
              {error && (
                <div className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-4 font-bold text-sm border border-rose-200">
                  ❌ {error}
                </div>
              )}
              
              {success && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl mb-4 font-bold text-sm border border-emerald-200">
                  ✅ {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">รหัสผ่านปัจจุบัน (Current Password)</label>
                  <input 
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-[#183363] focus:ring-4 focus:ring-sky-100 outline-none font-semibold transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">รหัสผ่านใหม่ (New Password)</label>
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-[#183363] focus:ring-4 focus:ring-sky-100 outline-none font-semibold transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">ยืนยันรหัสผ่านใหม่ (Confirm Password)</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-2xl focus:border-[#183363] focus:ring-4 focus:ring-sky-100 outline-none font-semibold transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 mt-2 text-white bg-[#1a2d5c] rounded-2xl hover:bg-sky-600 font-bold text-lg tracking-wide shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-[#1a2d5c]"
                >
                  {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'บันทึกรหัสผ่านใหม่'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
