import { getChildren } from '@/app/actions/children';
import { getUser } from '@/app/actions/user';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import DashboardClient from '@/components/DashboardClient';
import ParentMenu from '@/components/ParentMenu';
import Image from 'next/image';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default async function DashboardPage() {

  const user = await getUser();
  const children = await getChildren();

  const { data: classesData } = await supabase.from('classes').select('*');
  const classes = classesData || [];
  const { data: schedulesData } = await supabase.from('schedules').select('*');
  const schedules = schedulesData || [];
  const childIds = children.map(c => c.id);
  const { data: bookingsData } = await supabase.from('bookings').select('*');
  const allBookings = bookingsData || [];
  const bookings = allBookings.filter((b: any) => childIds.includes(b.child_id));

  // If no children, redirect to Add Family Member
  if (children.length === 0) {
    redirect('/family/add');
  }

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto px-4 sm:px-0">
      {/* Header with Logo on Left and Add Family Member Clickable Link Inline in Middle */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-2 relative">
        <div className="shrink-0">
          <Image 
            src="/images/logo.png" 
            alt="ORCA" 
            width={160} 
            height={160} 
            className="object-contain" 
          />
        </div>

        <Link 
          href="/family/add"
          className="flex items-center space-x-3 sm:absolute sm:left-1/2 sm:-translate-x-1/2 my-2 sm:my-0 group hover:scale-105 transition-all cursor-pointer"
          title="คลิกที่นี่เพื่อเพิ่มข้อมูลเด็ก / นักเรียนใหม่ (Add Family Member)"
        >
          <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform" role="img" aria-label="family">👩‍👧‍👦</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#183363] border-b-4 border-[#183363] group-hover:border-sky-600 group-hover:text-sky-700 pb-1 whitespace-nowrap transition-colors flex items-center gap-1">
            <span>Add Family Member</span>
            <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 ml-1 shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all">+ เพิ่มเด็ก</span>
          </h1>
        </Link>

        <div className="shrink-0 z-50">
          <ParentMenu />
        </div>
      </div>
      
      <div className="w-full max-w-5xl h-[4px] bg-slate-300 mb-6 rounded-full"></div>

      <div className="w-full max-w-5xl">
            <DashboardClient 
              childrenData={children} 
              parentUser={user} 
              classes={classes}
              schedules={schedules}
              bookings={bookings}
            />
          </div>
    </div>
  );
}
