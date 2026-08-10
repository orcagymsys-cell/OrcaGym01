'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AddChildForm({ userId }: { userId: string }) {
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Boy' | 'Girl'>('Girl');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!userId) throw new Error('Not authorized. Please login again.');

      const { data: dbUser, error: userError } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!dbUser) throw new Error(`User not found for ID: ${userId}. Error: ${userError?.message || 'none'}`);

      const maxAllowed = dbUser.max_children_allowed || 10;
      const { data: currentChildren } = await supabase.from('children').select('id').eq('parent_id', userId);
      
      if (currentChildren && currentChildren.length >= maxAllowed) {
        throw new Error(`คุณลงทะเบียนบุตรหลานครบตามจำนวนที่กำหนดแล้ว (${maxAllowed} คน)`);
      }

      const initialClasses = dbUser.purchased_classes || 0;
      const childId = `child_${Date.now()}`;

      let finalPhotoUrl = '';
      if (photoUrl && photoUrl.startsWith('data:image/')) {
        const resFetch = await fetch(photoUrl);
        const blob = await resFetch.blob();
        const fileExt = blob.type.split('/')[1] || 'jpeg';
        const fileName = `${childId}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          console.error('Error uploading photo to storage:', uploadError);
          // Fallback: Use the base64 string directly in the database (matches DashboardClient behavior)
          finalPhotoUrl = photoUrl;
        } else {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          finalPhotoUrl = publicUrlData.publicUrl;
        }
      }

      const newChild = {
        id: childId,
        parent_id: userId,
        full_name: fullName,
        nickname,
        dob,
        gender,
        photo_url: finalPhotoUrl,
        assigned_course_id: '',
        assigned_course_title: 'รอ Admin เลือกคลาส & อนุมัติ',
        course_approval_status: 'pending',
        total_classes: initialClasses,
        used_classes: 0,
        remaining_classes: initialClasses,
        expiry_date: '',
        status: 'pending'
      };

      const { error: insertError } = await supabase.from('children').insert([newChild]);
      if (insertError) throw insertError;

      if (dbUser.first_login) {
        await supabase.from('users').update({ first_login: false }).eq('id', userId);
      }
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto bg-white/90 backdrop-blur-sm p-4 sm:p-8 rounded-[2rem] shadow-xl border-4 border-white">
      <h2 className="text-xl font-bold text-[#1a2d5c] mb-4">Student Information</h2>
      
      {error && (
        <div className="w-full p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col items-center">
        <div className="relative mb-5">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-transparent bg-pink-100 flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">👧🏻</span>
            )}
          </div>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
          >
            <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold pb-1 leading-none cursor-pointer">
              +
            </div>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="w-full max-w-sm space-y-4">
          <div className="flex items-center space-x-2">
            <label className="w-1/3 text-xs sm:text-sm text-gray-700 whitespace-nowrap text-right pr-2">Child's Full Name:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex-1 w-full border-b border-black focus:outline-none focus:border-b-2 focus:border-[#1a2d5c] bg-transparent pb-1 px-1"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="w-1/3 text-xs sm:text-sm text-gray-700 whitespace-nowrap text-right pr-2">Nickname:</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="flex-1 w-full border-b border-black focus:outline-none focus:border-b-2 focus:border-[#1a2d5c] bg-transparent pb-1 px-1"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="w-1/3 text-xs sm:text-sm text-gray-700 whitespace-nowrap text-right pr-2">Date of Birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="flex-1 w-full border-b border-black focus:outline-none focus:border-b-2 focus:border-[#1a2d5c] bg-transparent pb-1 px-1 text-sm cursor-pointer"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <label className="w-1/3 text-xs sm:text-sm text-gray-700 whitespace-nowrap text-right pr-2">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as 'Boy' | 'Girl')}
              className="flex-1 w-full border-b border-black focus:outline-none focus:border-b-2 focus:border-[#1a2d5c] bg-transparent pb-1 px-1 appearance-none cursor-pointer"
            >
              <option value="Boy">Boy</option>
              <option value="Girl">Girl</option>
            </select>
          </div>
        </div>
        
        <div className="w-full max-w-sm mb-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#1a2d5c] rounded border-gray-300 focus:ring-[#1a2d5c]"
            />
            <span className="text-xs text-slate-700 leading-tight">
              ฉันยอมรับ <a href="#" className="text-blue-600 underline">ข้อตกลงและเงื่อนไขการใช้บริการ</a> (I accept the terms and conditions)
            </span>
          </label>
        </div>
        
        <div className="flex justify-center w-full">
          <button
            type="submit"
            disabled={loading || !acceptedTerms}
            className={`w-32 py-2 text-white rounded-full focus:outline-none font-bold shadow-[0px_3px_0px_0px_#ef4444,0px_3px_0px_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#ef4444] transition-all ${
              !acceptedTerms ? 'bg-slate-400 border-slate-500 shadow-none cursor-not-allowed' : 'bg-[#1a2d5c] hover:bg-[#111d3d]'
            }`}
          >
            {loading ? 'Wait...' : 'Done'}
          </button>
        </div>
      </form>
    </div>
  );
}
