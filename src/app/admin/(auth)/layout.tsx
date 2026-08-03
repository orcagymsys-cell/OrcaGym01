import Link from 'next/link';
import { getUser } from '@/app/actions/user';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import Image from 'next/image';
import { Home, Users, Calendar, HelpCircle, LogOut, Package, ShieldCheck, Info } from 'lucide-react';

export default async function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/admin/login');
  }

  if (user.role !== 'admin') {
    redirect('/login'); // Parents shouldn't access admin
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row w-full">
      {/* Sidebar Navigation (Desktop) & Top Header Bar (Mobile) */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col items-center py-3 md:py-6 md:h-screen md:sticky md:top-0 shrink-0">
        <div className="w-full px-4 flex items-center justify-between md:flex-col md:justify-center">
          <div className="w-auto md:w-48 bg-[#183363] text-white px-4 py-2 md:py-3 rounded-xl flex items-center space-x-2 shadow-md">
            <Home size={18} />
            <span className="font-extrabold text-sm md:text-base tracking-wide">ORCA ADMIN</span>
          </div>

          <div className="md:hidden">
            <LogoutButton className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200" />
          </div>
        </div>

        <nav className="w-full flex md:flex-col overflow-x-auto md:overflow-x-visible space-x-2 md:space-x-0 md:space-y-2 px-3 md:px-4 py-2 md:py-0 mt-2 md:mt-6 flex-1 text-xs md:text-sm font-bold no-scrollbar">
          <Link href="/admin/dashboard" className="flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2 md:py-2.5 text-[#183363] hover:bg-blue-50 rounded-xl">
            <Home size={16} />
            <span>HOME</span>
          </Link>
          <Link href="/admin/members" className="flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2 md:py-2.5 text-[#183363] hover:bg-blue-50 rounded-xl">
            <Users size={16} />
            <span>MEMBERS</span>
          </Link>
          <Link href="/admin/classes" className="flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2 md:py-2.5 text-[#183363] hover:bg-blue-50 rounded-xl">
            <Package size={16} />
            <span>CLASSES</span>
          </Link>
          <Link href="/admin/schedule" className="flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2 md:py-2.5 text-[#183363] hover:bg-blue-50 rounded-xl">
            <Calendar size={16} />
            <span>SCHEDULE</span>
          </Link>
          <Link href="/admin/audit" className="flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2 md:py-2.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200">
            <ShieldCheck size={16} />
            <span>AUDIT</span>
          </Link>
          <Link href="/admin/about" className="flex items-center space-x-2 shrink-0 px-3 md:px-4 py-2 md:py-2.5 text-[#183363] hover:bg-blue-50 rounded-xl">
            <Info size={16} />
            <span>ABOUT US</span>
          </Link>
          <div className="hidden md:block px-4 py-3 text-sm font-bold text-[#183363] hover:bg-blue-50 rounded-xl cursor-pointer">
            <LogoutButton className="w-full text-left" />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
