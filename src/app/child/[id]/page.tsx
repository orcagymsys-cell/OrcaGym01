import { supabase } from '@/lib/supabase';
import { getUser } from '@/app/actions/user';
import ChildBooking from '@/components/ChildBooking';

export const runtime = 'edge';

export default async function ChildProfilePage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getUser();

  if (!user) {
    return <div className="text-center p-10">Please login to view this page</div>;
  }

  const { data: childrenData } = await supabase.from('children').select('*');
  const children = childrenData || [];
  const child = children.find((c: any) => c.id === params.id && c.parent_id === user.id);
  
  if (!child) {
    return <div className="text-center p-10">Child not found</div>;
  }

  // Fetch related data
  const { data: schedulesData } = await supabase.from('schedules').select('*');
  const schedules = schedulesData || [];
  
  const { data: classesData } = await supabase.from('classes').select('*');
  const classes = classesData || [];
  
  const { data: bookingsData } = await supabase.from('bookings').select('*');
  const allBookings = bookingsData || [];
  
  const history = allBookings
    .filter((b: any) => b.child_id === child.id)
    .map(b => {
      const gymClass = classes.find(c => c.id === (b as any).class_id || c.id === b.schedule_id) || classes[0];
      const schedule = schedules.find(s => s.id === b.schedule_id) || {
        id: b.schedule_id,
        class_id: gymClass?.id || '',
        day_of_week: 'MON' as const,
        start_time: (b as any).time_slot?.split('-')[0] || (b as any).timeSlot?.split('-')[0] || '',
        end_time: (b as any).time_slot?.split('-')[1] || (b as any).timeSlot?.split('-')[1] || ''
      };
      return { ...b, schedule, gymClass };
    })
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <ChildBooking 
      child={child} 
      schedules={schedules} 
      classes={classes} 
      history={history} 
      allBookings={allBookings}
      parentUser={user}
    />
  );
}
