'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { store } from '@/lib/supabase';
import MenuDrawer from './MenuDrawer';
import { UserProfile } from '@/lib/types';

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(store.getCurrentUser());
  }, [pathname]);

  if (!mounted) {
    return null;
  }

  // Hide header on Auth pages
  if (pathname === '/' || pathname === '/register' || pathname === '/reset-password') {
    return null;
  }

  return (
    <>
      <header className="h-16 px-5 flex items-center justify-between bg-white border-b border-slate-200 sticky top-0 z-40 lg:hidden">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/orca_logo.png"
            alt="ORCA GYMNASTICS"
            style={{ width: '50px', height: 'auto' }}
            className="object-contain drop-shadow-xs shrink-0"
          />
          <div className="flex flex-col justify-center">
            <span className="text-[17px] font-extrabold text-[#001a3a] leading-tight font-sans tracking-wide">
              ORCA GYMNASTICS
            </span>
            {user && (
              <span className="text-xs font-normal text-[#0284c7] font-['Anuphan',sans-serif] tracking-wide mt-0.5 flex items-center gap-1">
                <span>{user.role === 'admin' ? '🛡️' : '👤'}</span>
                <span>{user.name}</span>
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsMenuOpen(true)}
          className="lg:hidden bg-[#001a3a] text-white border-none px-4 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform font-sans cursor-pointer"
        >
          🏠 MENU ☰
        </button>
      </header>

      <MenuDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
}
