import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8">
      {/* Navigation Header */}
      <header className="w-full max-w-5xl bg-[#183363] text-white rounded-t-xl overflow-hidden shadow-lg mb-8">
        <nav className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-2">
            <Link href="/dashboard" className="flex items-center space-x-2">
               <span className="font-bold text-lg">MENU</span>
            </Link>
          </div>
          <div className="flex items-center space-x-6 text-sm font-semibold">
            <Link href="/dashboard" className="hover:text-blue-200">HOME</Link>
            <Link href="/classes" className="hover:text-blue-200">ORCA CLASSES & PRICING</Link>
            <Link href="/schedule" className="hover:text-blue-200">SCHEDULE</Link>
            <Link href="/about" className="hover:text-blue-200">ABOUT US</Link>
            <LogoutButton className="hover:text-blue-200 uppercase font-semibold" />
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl bg-white rounded-xl shadow-md p-8 min-h-[500px]">
        {children}
      </main>
    </div>
  );
}
