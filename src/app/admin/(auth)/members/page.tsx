import AdminMembersClient from '@/components/AdminMembersClient';
import { getAdminMembersData } from '@/app/actions/admin';


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
