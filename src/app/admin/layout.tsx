import Link from 'next/link';
import { getUser } from '@/app/actions/user';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // /admin/login handles its own auth check, we don't protect it here if we want /admin/login to render within this layout.
  // Actually, we should probably not wrap /admin/login in this layout.
  // Wait, Next.js app router applies layout to all children. 
  // If we want a separate layout for login, we should move login to /admin-login or check pathname.
  // But let's just make it a client side check or wrap the authenticated parts in a client component.
  // We can just use an (authenticated) group for admin dashboard.
  return <>{children}</>;
}
