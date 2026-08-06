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
    <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4">
      <div className="w-full flex flex-col md:flex-row items-start justify-between relative mt-4 gap-8">
        
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-auto shrink-0 flex flex-col items-start pt-4">
          <ParentMenu />
        </div>

        {/* Main Content Area */}
        <div className="w-full flex-1 flex flex-col items-center">
          {/* Header with Logo and Add Family Member */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-between mb-2 relative max-w-5xl">
            <div className="shrink-0 mb-4 sm:mb-0">
              <Image 
                src="/images/logo.png" 
                alt="ORCA" 
                width={140} 
                height={140} 
                className="object-contain hover:scale-105 transition-transform" 
              />
            </div>

            <Link 
              href="/family/add"
              className="flex items-center space-x-3 group hover:scale-105 transition-all cursor-pointer bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100"
              title="คลิกที่นี่เพื่อเพิ่มข้อมูลเด็ก / นักเรียนใหม่ (Add Family Member)"
            >
              <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform" role="img" aria-label="family">👩‍👧‍👦</span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#183363] group-hover:text-sky-700 whitespace-nowrap transition-colors flex items-center gap-2">
                <span>Add Family Member</span>
                <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300 shadow-xs group-hover:bg-emerald-600 group-hover:text-white transition-all">+ เพิ่มเด็ก</span>
              </h1>
            </Link>
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
      </div>
    </div>
  );
}
