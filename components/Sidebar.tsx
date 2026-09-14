'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { store } from '@/lib/supabase';
import { showToast } from './Toast';
import { UserProfile } from '@/lib/types';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserProfile | null>(null);
  
  const currentTab = searchParams ? searchParams.get('tab') : null;

  useEffect(() => {
    setUser(store.getCurrentUser());
  }, [pathname, searchParams]);

  const handleLogout = () => {
    store.setCurrentUser(null);
    showToast('ลงชื่อออกจากระบบเรียบร้อย');
    fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
    window.location.replace('/');
  };

  // Hide sidebar on auth pages
  if (pathname === '/' || pathname === '/register' || pathname === '/reset-password') {
    return null;
  }

  const isActive = (path: string) => {
    if (path.includes('?tab=')) {
      const targetTab = path.split('?tab=')[1];
      if (targetTab === 'parents') {
        return pathname === '/admin/dashboard' && (currentTab === 'parents' || currentTab === 'members');
      }
      if (targetTab === 'overview') {
        return pathname === '/admin/dashboard' && (!currentTab || currentTab === 'overview' || currentTab === 'quota');
      }
      return pathname === path.split('?')[0] && currentTab === targetTab;
    }
    if (path === '/schedule') {
      return pathname === '/schedule' || (pathname === '/admin/dashboard' && currentTab === 'schedule');
    }
    if (path === '/audit') {
      return pathname === '/audit' || (pathname === '/admin/dashboard' && currentTab === 'audit');
    }
    return pathname === path;
  };

  const navItemClass = (path: string) => `
    flex items-center gap-3 py-1.5 px-2.5 rounded-xl
    transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-left
    hover:scale-110 hover:translate-x-2 hover:bg-sky-50/80 cursor-pointer
    ${isActive(path) ? 'text-[#001a3a] font-bold bg-slate-100/70 shadow-2xs' : 'text-[#001a3a] hover:text-blue-600 font-normal'}
  `.trim();

  const isAdmin = user?.role === 'admin' || pathname.startsWith('/admin') || pathname === '/audit';

  return (
    <aside className="hidden lg:flex flex-col w-[260px] xl:w-[280px] bg-white border-r border-slate-200 p-6 shrink-0 font-['Anuphan',sans-serif] min-h-[100dvh] shadow-xs relative z-10">

      
      {/* Top Brand & User Info */}
      <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-200/80">
        <img
          src="/images/orca_logo.png"
          alt="ORCA GYMNASTICS"
          style={{ width: '42px', height: 'auto' }}
          className="object-contain drop-shadow-xs shrink-0"
        />
        <div className="flex flex-col justify-center">
          <span className="text-[16px] font-extrabold text-[#001a3a] leading-tight font-sans tracking-wide">
            ORCA GYMNASTICS
          </span>
          <span className="text-xs font-normal text-[#0284c7] font-['Anuphan',sans-serif] tracking-wide mt-0.5 flex items-center gap-1">
            <span>🛡️</span>
            <span>{user?.name || 'แอดมิน Orca'}</span>
          </span>
        </div>
      </div>

      {/* Top Banner Card */}
      <div className="bg-[#001a3a] text-white p-3.5 px-5 rounded-2xl font-bold text-xl mb-6 flex items-center justify-center gap-3 shadow-md">
        <span className="text-2xl">🏠</span>
        <span className="tracking-wider uppercase font-['Anuphan',sans-serif]">MENU</span>
      </div>

      {/* Navigation List */}
      <nav className="flex flex-col gap-4 text-lg font-medium">
        {isAdmin ? (
          <>
            <Link href="/admin/dashboard?tab=overview" className={navItemClass('/admin/dashboard?tab=overview')}>
              <span className="text-xl">🏠</span>
              <span>HOME</span>
            </Link>

            <Link href="/admin/dashboard?tab=parents" className={navItemClass('/admin/dashboard?tab=parents')}>
              <span className="text-xl">👥</span>
              <span>MEMBER</span>
            </Link>

            <Link href="/pricing" className={navItemClass('/pricing')}>
              <span className="text-xl">🏷️</span>
              <span>Orca Classes & Pricing</span>
            </Link>

            <Link href="/schedule" className={navItemClass('/schedule')}>
              <span className="text-xl">📅</span>
              <span>SCHEDULE</span>
            </Link>

            <Link href="/gallery" className={navItemClass('/gallery')}>
              <span className="text-xl">📸</span>
              <span>Gallery</span>
            </Link>

            <Link href="/audit" className={navItemClass('/audit')}>
              <span className="text-xl">🛡️</span>
              <span>AUDIT</span>
            </Link>

            <Link href="/coaches" className={navItemClass('/coaches')}>
              <span className="text-xl">🏃</span>
              <span>ทีมโค้ช</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-red-600 hover:text-red-700 text-left bg-transparent border-none cursor-pointer pt-4 font-normal text-lg transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-left hover:scale-110 hover:translate-x-2 py-1.5 px-2.5 rounded-xl hover:bg-rose-50/80"
            >
              <span className="text-xl">🚪</span>
              <span>Log Out</span>
            </button>
          </>
        ) : !user ? (
          <>
            <Link href="/" className={navItemClass('/')}>
              <span className="text-xl">🔑</span>
              <span>Sign In</span>
            </Link>

            <Link href="/register" className={navItemClass('/register')}>
              <span className="text-xl">📝</span>
              <span>Register</span>
            </Link>

            <Link href="/pricing" className={navItemClass('/pricing')}>
              <span className="text-xl">🏷️</span>
              <span>Orca Classes & Pricing</span>
            </Link>
          </>
        ) : (
          <>
            <Link href="/home" className={navItemClass('/home')}>
              <span className="text-xl">🏠</span>
              <span>HOME</span>
            </Link>

            <Link href="/pricing" className={navItemClass('/pricing')}>
              <span className="text-xl">🏷️</span>
              <span>Orca Classes & Pricing</span>
            </Link>

            <Link href="/schedule" className={navItemClass('/schedule')}>
              <span className="text-xl">📅</span>
              <span>Schedule</span>
            </Link>

            <Link href="/coaches" className={navItemClass('/coaches')}>
              <span className="text-xl">🏃</span>
              <span>ทีมโค้ช</span>
            </Link>

            <Link href="/terms" className={navItemClass('/terms')}>
              <span className="text-xl">📜</span>
              <span>ข้อตกลง</span>
            </Link>

            <Link href="/about" className={navItemClass('/about')}>
              <span className="text-xl">ℹ️</span>
              <span>About Us</span>
            </Link>

            <Link href="/gallery" className={navItemClass('/gallery')}>
              <span className="text-xl">📸</span>
              <span>Gallery</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-3 text-red-600 hover:text-red-700 text-left bg-transparent border-none cursor-pointer pt-4 font-normal text-lg transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-left hover:scale-110 hover:translate-x-2 py-1.5 px-2.5 rounded-xl hover:bg-rose-50/80"
            >
              <span className="text-xl">🚪</span>
              <span>Log Out</span>
            </button>
          </>
        )}
      </nav>

    </aside>
  );
}


