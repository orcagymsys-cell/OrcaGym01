'use client';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import Toast from '@/components/Toast';

export default function AppLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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
