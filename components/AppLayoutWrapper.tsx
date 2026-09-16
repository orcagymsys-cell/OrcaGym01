'use client';
import { Suspense, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';

// Keys that are safe to clear — old cache format, diagnostic keys, oversized data
const STALE_KEYS = [
  'CHILDREN_CACHE', 'BOOKINGS_CACHE', 'USERS_CACHE',
  'ORCA_KIDS_ERR', 'ORCA_KIDS_DATA_LEN', 'ORCA_KIDS_DUMP',
  'ORCA_FILTER_DEBUG', 'CHILDREN_ERROR',
];
const CLEANUP_VERSION = 'orca_cleanup_v3';

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Run cleanup only once per browser (version key prevents repeat)
    if (localStorage.getItem(CLEANUP_VERSION)) return;
    try {
      // Remove stale cache keys that bloat localStorage
      STALE_KEYS.forEach(k => localStorage.removeItem(k));
      // Remove stale Supabase auth tokens
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('sb-') && k.endsWith('-auth-token')) localStorage.removeItem(k);
      });
      // Strip base64 payment slips from users cache (major space hog)
      const usersRaw = localStorage.getItem('ORCA_USERS');
      if (usersRaw) {
        const users = JSON.parse(usersRaw);
        const cleaned = users.map((u: any) => { const {payment_slip, ...rest} = u; return rest; });
        localStorage.setItem('ORCA_USERS', JSON.stringify(cleaned));
      }
      localStorage.setItem(CLEANUP_VERSION, '1');
    } catch (_) {}
  }, []);

  const isAuthPage = pathname === '/' || pathname === '/register' || pathname === '/reset-password';

  if (isAuthPage) {
    return (
      <div className="min-h-[100dvh] flex flex-col justify-center items-center bg-slate-200 p-0 sm:p-4">
        <div className="flex flex-col w-full max-w-[440px] min-h-[100dvh] sm:min-h-[720px] sm:rounded-[32px] overflow-hidden border border-slate-300 bg-white shadow-xl relative">
          <main className="flex-1 relative bg-white overflow-x-hidden p-0">
            {children}
          </main>
          <Toast />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex bg-slate-50">
      <Suspense fallback={<div className="hidden lg:block w-[260px] shrink-0 bg-white border-r border-slate-200"></div>}>
        <Sidebar />
      </Suspense>
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden w-full">
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}
