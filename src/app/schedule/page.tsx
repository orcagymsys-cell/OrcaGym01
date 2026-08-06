import { supabase } from '@/lib/supabase';
import { getUser } from '@/app/actions/user';
import ParentScheduleView from '@/components/ParentScheduleView';

export const runtime = 'edge';

export default async function ParentSchedulePage() {
  const user = await getUser();
  if (!user) {
    return <div className="text-center p-10">Please login to view this page</div>;
  }

  const { data: childrenDataRaw } = await supabase.from('children').select('*');
  const childrenData = (childrenDataRaw || []).filter((c: any) => c.parent_id === user.id);
  const childIds = childrenData.map((c: any) => c.id);

  const { data: classesData } = await supabase.from('classes').select('*');
  const classes = classesData || [];
  const { data: schedulesData } = await supabase.from('schedules').select('*');
  const schedules = schedulesData || [];
  const { data: bookingsData } = await supabase.from('bookings').select('*');
  const allBookings = bookingsData || [];
  const bookings = allBookings.filter((b: any) => childIds.includes(b.child_id));

  return (
    <ParentScheduleView 
      childrenData={childrenData}
      classes={classes}
      schedules={schedules}
      bookings={bookings}
      parentUser={user}
    />
  );
}
