'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ParentMenu() {
  const [isOpen, setIsOpen] = useState(false); // Default closed
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="relative z-50 font-[family-name:'Comic_Sans_MS',_'Chalkboard_SE',_'Comic_Neue',_sans-serif]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white px-5 py-2.5 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center space-x-2 border-2 border-white/50"
        style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif" }}
      >
        <span className="text-2xl leading-none">🍔</span>
        <span className="text-xl font-black text-white drop-shadow-sm uppercase tracking-wide">Menu</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-[240px] bg-white/95 backdrop-blur-sm flex flex-col p-3 rounded-3xl shadow-2xl border-4 border-sky-100 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <Link href="/dashboard" className="group flex items-center px-4 py-3 text-[#183363] font-extrabold text-lg hover:bg-sky-50 rounded-2xl transition-colors">
            <span className="mr-3 text-2xl group-hover:scale-125 transition-transform">🏠</span> HOME
          </Link>
          <Link href="/classes" className="group flex items-center px-4 py-3 text-[#183363] font-extrabold text-lg hover:bg-sky-50 rounded-2xl transition-colors">
            <span className="mr-3 text-2xl group-hover:scale-125 transition-transform">🐬</span> CLASSES
          </Link>
          <Link href="/schedule" className="group flex items-center px-4 py-3 text-[#183363] font-extrabold text-lg hover:bg-sky-50 rounded-2xl transition-colors">
            <span className="mr-3 text-2xl group-hover:scale-125 transition-transform">📅</span> SCHEDULE
          </Link>
          <Link href="/about" className="group flex items-center px-4 py-3 text-[#183363] font-extrabold text-lg hover:bg-sky-50 rounded-2xl transition-colors">
            <span className="mr-3 text-2xl group-hover:scale-125 transition-transform">🌊</span> ABOUT US
          </Link>
          <div className="h-1 w-full bg-slate-100 my-1 rounded-full"></div>
          <button 
            onClick={handleLogout}
            className="group flex items-center px-4 py-3 text-rose-600 font-extrabold text-lg hover:bg-rose-50 rounded-2xl transition-colors text-left"
          >
            <span className="mr-3 text-2xl group-hover:scale-125 transition-transform">🚪</span> LOG OUT
          </button>
        </div>
      )}
    </div>
  );
}
