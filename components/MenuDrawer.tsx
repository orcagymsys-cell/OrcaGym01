'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/supabase';
import { showToast } from './Toast';

export default function MenuDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const user = store.getCurrentUser();

  const handleLogout = () => {
    store.setCurrentUser(null);
    localStorage.removeItem('ORCA_MY_KIDS');
    localStorage.removeItem('ORCA_MY_BOOKINGS');
    showToast('ลงชื่อออกจากระบบเรียบร้อย');
    onClose();
    router.push('/');
  };

  if (!isOpen) return null;

  const itemClass = `
    flex items-center gap-3 py-1.5 px-2.5 rounded-xl text-[#001a3a] hover:text-blue-600
    transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-left
    hover:scale-105 hover:translate-x-2 hover:bg-sky-50/80 cursor-pointer font-normal
  `.trim();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 transition-opacity font-sans">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="fixed top-0 left-0 w-[290px] h-full bg-white shadow-2xl p-6 flex flex-col z-50 overflow-y-auto">
        
        {/* Top Banner Card */}
        <div className="bg-[#001a3a] text-white p-3.5 px-5 rounded-2xl font-bold text-xl mb-6 flex items-center gap-3 shadow-md shrink-0">
          <span className="text-2xl">🏠</span>
          <span className="tracking-wider uppercase font-['Anuphan',sans-serif]">MENU</span>
        </div>

        <nav className="flex flex-col gap-3.5 text-lg font-medium font-sans">
          {!user ? (
            <>
              <Link href="/" onClick={onClose} className={itemClass}>
                <span className="text-xl">🔑</span>
                <span>Sign In</span>
              </Link>
              <Link href="/register" onClick={onClose} className={itemClass}>
                <span className="text-xl">📝</span>
                <span>Register</span>
              </Link>
              <Link href="/pricing" onClick={onClose} className={itemClass}>
                <span className="text-xl">🏷️</span>
                <span>Orca Classes & Pricing</span>
              </Link>
              
            </>
          ) : user.role === 'admin' ? (
            <>
              <Link href="/admin/dashboard?tab=overview" onClick={onClose} className={itemClass}>
                <span className="text-xl">🏠</span>
                <span>HOME</span>
              </Link>

              <Link href="/admin/dashboard?tab=parents" onClick={onClose} className={itemClass}>
                <span className="text-xl">👥</span>
                <span>MEMBER</span>
              </Link>

              <Link href="/pricing" onClick={onClose} className={itemClass}>
                <span className="text-xl">🏷️</span>
                <span>Orca Classes & Pricing</span>
              </Link>

              <Link href="/schedule" onClick={onClose} className={itemClass}>
                <span className="text-xl">📅</span>
                <span>SCHEDULE</span>
              </Link>

              <Link href="/audit" onClick={onClose} className={itemClass}>
                <span className="text-xl">🛡️</span>
                <span>AUDIT</span>
              </Link>

              <Link href="/coaches" onClick={onClose} className={itemClass}>
                <span className="text-xl">🏃</span>
                <span className="font-['Anuphan',sans-serif] font-normal">ทีมโค้ช</span>
              </Link>

              <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 hover:text-red-700 text-left bg-transparent border-none cursor-pointer pt-3 font-normal text-lg font-sans transform transition-all duration-300 ease-out origin-left hover:scale-105 hover:translate-x-1 py-1.5 px-2.5 rounded-xl hover:bg-rose-50/80">
                <span className="text-xl">🚪</span>
                <span>Log Out</span>
              </button>
            </>
          ) : (
            <>
              <Link href="/home" onClick={onClose} className={itemClass}>
                <span className="text-xl">🏠</span>
                <span>HOME</span>
              </Link>
              <Link href="/pricing" onClick={onClose} className={itemClass}>
                <span className="text-xl">🏷️</span>
                <span>Orca Classes & Pricing</span>
              </Link>
              <Link href="/schedule" onClick={onClose} className={itemClass}>
                <span className="text-xl">📅</span>
                <span>Schedule</span>
              </Link>
              <Link href="/coaches" onClick={onClose} className={itemClass}>
                <span className="text-xl">🏃</span>
                <span className="font-['Anuphan',sans-serif] font-normal">ทีมโค้ช</span>
              </Link>
              <Link href="/terms" onClick={onClose} className={itemClass}>
                <span className="text-xl">📜</span>
                <span className="font-['Anuphan',sans-serif] font-normal">ข้อตกลง</span>
              </Link>
              <Link href="/about" onClick={onClose} className={itemClass}>
                <span className="text-xl">ℹ️</span>
                <span>About Us</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-3 text-red-600 hover:text-red-700 text-left bg-transparent border-none cursor-pointer pt-3 font-normal text-lg font-sans transform transition-all duration-300 ease-out origin-left hover:scale-105 hover:translate-x-1 py-1.5 px-2.5 rounded-xl hover:bg-rose-50/80">
                <span className="text-xl">🚪</span>
                <span>Log Out</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
