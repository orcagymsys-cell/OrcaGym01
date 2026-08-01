import AdminMembersClient from '@/components/AdminMembersClient';
import { getAllChildren } from '@/app/actions/admin';

export default async function AdminMembersPage() {
  const children = await getAllChildren();
  
  return <AdminMembersClient initialChildren={children} />;
}
