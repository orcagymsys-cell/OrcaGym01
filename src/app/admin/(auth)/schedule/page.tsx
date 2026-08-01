import AdminScheduleMatrix from '@/components/AdminScheduleMatrix';
import { getScheduleMatrix, getAllChildren } from '@/app/actions/admin';

export default async function AdminSchedulePage() {
  const data = await getScheduleMatrix();
  const childrenData = await getAllChildren();
  
  return (
    <AdminScheduleMatrix 
      classes={data.classes} 
      schedules={data.schedules} 
      bookings={data.bookings} 
      childrenData={childrenData}
    />
  );
}
