import Link from 'next/link';
import { getUser } from '@/app/actions/user';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import Image from 'next/image';
import { Home, Users, Calendar, HelpCircle, LogOut, Package } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col items-center py-6 h-screen sticky top-0">
        <div className="w-48 bg-[#183363] text-white py-3 rounded-lg flex items-center justify-center space-x-2 mb-8 shadow-md">
           <Home size={20} />
           <span className="font-bold tracking-wide">MENU</span>
        </div>

        <nav className="w-full flex flex-col space-y-2 px-4 flex-1">
          <Link href="/admin/dashboard" className="flex items-center space-x-3 px-4 py-3 text-sm font-bold text-[#183363] hover:bg-blue-50 rounded-lg">
            <span>HOME</span>
          </Link>
          <Link href="/admin/members" className="flex items-center space-x-3 px-4 py-3 text-sm font-bold text-[#183363] hover:bg-blue-50 rounded-lg">
            <span>MEMBERS</span>
          </Link>
          <Link href="/admin/classes" className="flex items-center space-x-3 px-4 py-3 text-sm font-bold text-[#183363] hover:bg-blue-50 rounded-lg">
            <span>ORCA CLASSES & PRICING</span>
          </Link>
          <Link href="/admin/schedule" className="flex items-center space-x-3 px-4 py-3 text-sm font-bold text-[#183363] hover:bg-blue-50 rounded-lg">
            <span>SCHEDULE</span>
          </Link>
          <Link href="/admin/about" className="flex items-center space-x-3 px-4 py-3 text-sm font-bold text-[#183363] hover:bg-blue-50 rounded-lg">
            <span>ABOUT US</span>
          </Link>
          <div className="px-4 py-3 text-sm font-bold text-[#183363] hover:bg-blue-50 rounded-lg cursor-pointer">
            <LogoutButton className="w-full text-left" />
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
