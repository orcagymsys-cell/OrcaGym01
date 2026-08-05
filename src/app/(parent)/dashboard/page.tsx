import { getChildren } from '@/app/actions/children';
import { getUser } from '@/app/actions/user';
import { getDb } from '@/lib/db';
import Image from 'next/image';
import Link from 'next/link';
import DashboardClient from '@/components/DashboardClient';

export const runtime = 'edge';

export default async function DashboardPage() {
  const user = await getUser();
  const children = await getChildren();
  const db = getDb();

  const classes = db.classes;
  const schedules = db.schedules;
  const childIds = children.map(c => c.id);
  const bookings = db.bookings.filter(b => childIds.includes(b.child_id));

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
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

        <div className="w-[160px] hidden sm:block" />
      </div>
      
      <div className="w-full max-w-lg h-[4px] bg-slate-300 mb-6 rounded-full"></div>

      <DashboardClient 
        childrenData={children} 
        parentUser={user} 
        classes={classes}
        schedules={schedules}
        bookings={bookings}
      />
    </div>
  );
}
