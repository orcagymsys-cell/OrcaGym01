import React from 'react';
import { supabase } from '@/lib/supabase';
import CourseCard from '@/components/CourseCard';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const runtime = 'edge';

export default async function ClassesPage() {
  const { data: classesData } = await supabase.from('classes').select('*');
  const classes = classesData || [];

  return (
    <div className="flex flex-col items-center space-y-12 py-4 px-4 sm:px-8">
      <div className="w-full max-w-5xl flex items-center mb-2">
        <Link href="/dashboard" className="flex items-center space-x-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#1a2d5c] rounded-xl font-bold text-sm transition-colors border border-slate-300 shadow-sm">
          <ChevronLeft size={18} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#183363] mb-2">
          ORCA CLASSES & PRICING
        </h1>
        <p className="text-gray-600 font-medium">
          หลักสูตรและอัตราค่าเรียน ยิมนาสติกเด็ก ออก้ายิม
        </p>
      </div>

      <div className="w-full space-y-12">
        {classes.map((cls) => (
          <CourseCard key={cls.id} course={cls} />
        ))}
      </div>
    </div>
  );
}
