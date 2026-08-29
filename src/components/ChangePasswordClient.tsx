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
    <div className="min-h-screen bg-[#cce3ee] font-[family-name:'Comic_Sans_MS',_'Chalkboard_SE',_'Comic_Neue',_sans-serif]">
      {/* Header */}
      <div className="bg-[#183363] text-white p-4 sticky top-0 z-40 shadow-md">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#183363] font-black text-xl">O</span>
            </div>
            <h1 className="text-xl font-black tracking-wider uppercase">CHANGE PASSWORD</h1>
          </div>
          <ParentMenu />
        </div>
      </div>

      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-[2rem] shadow-xl border-4 border-white/50">
        <h2 className="text-2xl font-black text-[#183363] mb-6 text-center">เปลี่ยนรหัสผ่าน</h2>
        
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">รหัสผ่านปัจจุบัน (Current Password)</label>
            <input 
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none font-semibold"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">รหัสผ่านใหม่ (New Password)</label>
            <input 
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none font-semibold"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">ยืนยันรหัสผ่านใหม่ (Confirm Password)</label>
            <input 
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#183363] outline-none font-semibold"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 text-white bg-[#1a2d5c] rounded-xl hover:bg-[#111d3d] font-bold text-lg tracking-wide disabled:opacity-50"
          >
            {loading ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>
    </div>
  );
}
