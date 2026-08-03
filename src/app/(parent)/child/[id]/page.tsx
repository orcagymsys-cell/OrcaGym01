import { getDb } from '@/lib/db';
import { getUser } from '@/app/actions/user';
import ChildBooking from '@/components/ChildBooking';
import { redirect } from 'next/navigation';

export default async function ChildProfilePage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const user = await getUser();
  if (!user) redirect('/login');

  const db = getDb();
  const child = db.children.find(c => c.id === params.id && c.parent_id === user.id);
  
  if (!child) {
    return <div className="text-center p-10">Child not found</div>;
  }

  // Fetch related data
  const schedules = db.schedules;
  const classes = db.classes;
  
  const history = db.bookings
    .filter(b => b.child_id === child.id)
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
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const allBookings = db.bookings;

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
