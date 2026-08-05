import { getDb } from '@/lib/db';
import { getUser } from '@/app/actions/user';
import ParentScheduleView from '@/components/ParentScheduleView';
import { redirect } from 'next/navigation';


export default async function ParentSchedulePage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const db = getDb();
  const childrenData = db.children.filter(c => c.parent_id === user.id);
  const childIds = childrenData.map(c => c.id);

  const classes = db.classes;
  const schedules = db.schedules;
  const bookings = db.bookings.filter(b => childIds.includes(b.child_id));

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
