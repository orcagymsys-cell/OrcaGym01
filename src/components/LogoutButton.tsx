'use client';

import { logout } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <button onClick={handleLogout} className={className}>
      LOG OUT
    </button>
  );
}
