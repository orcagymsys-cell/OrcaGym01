import AdminMembersClient from '@/components/AdminMembersClient';
import { getAdminMembersData } from '@/app/actions/admin';

export const runtime = 'edge';

export default async function AdminMembersPage() {
  const data = await getAdminMembersData();
  
  return (
    <AdminMembersClient 
      initialChildren={data.children} 
      initialParents={data.parents}
      classes={data.classes}
    />
  );
}
