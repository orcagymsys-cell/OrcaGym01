import AdminScheduleMatrix from '@/components/AdminScheduleMatrix';
import { getScheduleMatrix, getAdminMembersData } from '@/app/actions/admin';

export const runtime = 'edge';

export default async function AdminSchedulePage() {
  const data = await getScheduleMatrix();
  const membersData = await getAdminMembersData();
  
  return (
    <AdminScheduleMatrix 
      classes={data.classes} 
      schedules={data.schedules} 
      bookings={data.bookings} 
      childrenData={membersData.children}
      parents={membersData.parents}
    />
  );
}
