'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addChild } from '@/app/actions/children';

export default function AddChildForm() {
  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Boy' | 'Girl'>('Girl');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

    const res = await (addChild as any)({ 
      full_name: fullName, 
      nickname, 
      dob, 
      gender, 
      photo_url: photoUrl
    });
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-200" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif" }}>
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
        
        <div className="mt-6 mb-6">
          <a href="#" className="text-xs sm:text-sm font-bold text-[#1a2d5c] underline underline-offset-4 decoration-1 hover:text-blue-800">
            + Add Another Child
          </a>
        </div>
        
        <div className="flex justify-center w-full">
          <button
            type="submit"
            disabled={loading}
            className="w-32 py-2 text-white bg-[#1a2d5c] rounded-full hover:bg-[#111d3d] focus:outline-none font-bold shadow-[0px_3px_0px_0px_#ef4444,0px_3px_0px_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#ef4444] disabled:opacity-50 transition-all"
          >
            {loading ? 'Wait...' : 'Done'}
          </button>
        </div>
      </form>
    </div>
  );
}
