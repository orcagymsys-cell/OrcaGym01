'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ParentMenu() {
  const [isOpen, setIsOpen] = useState(true); // Default open for visibility based on screenshot
  const router = useRouter();

  const handleLogout = async () => {
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="relative z-50 mt-2 font-[family-name:'Comic_Sans_MS',_'Chalkboard_SE',_'Comic_Neue',_sans-serif]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0a3161] hover:bg-[#072448] text-white px-5 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-3 w-[220px]"
        style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif" }}
      >
        <span className="text-3xl leading-none pt-0.5">🏠</span>
        <span className="text-2xl font-black text-white drop-shadow-sm uppercase">Menu</span>
      </button>

      {isOpen && (
        <div className="mt-6 w-[250px] bg-white flex flex-col space-y-5 px-2">
          <Link href="/" className="block text-[#0a3161] font-extrabold text-xl hover:text-sky-600 uppercase tracking-wide">
            HOME
          </Link>
          <Link href="/classes" className="block text-[#0a3161] font-extrabold text-xl hover:text-sky-600 uppercase tracking-wide">
            ORCA CLASSES & PRICING
          </Link>
          <Link href="/schedule" className="block text-[#0a3161] font-extrabold text-xl hover:text-sky-600 uppercase tracking-wide">
            SCHEDULE
          </Link>
          <Link href="/#about" className="block text-[#0a3161] font-extrabold text-xl hover:text-sky-600 uppercase tracking-wide">
            ABOUT US
          </Link>
          <button 
            onClick={handleLogout}
            className="w-full text-left text-[#0a3161] font-extrabold text-xl hover:text-sky-600 uppercase tracking-wide"
          >
            LOG OUT
          </button>
        </div>
      )}
    </div>
  );
}
