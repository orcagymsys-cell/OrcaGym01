import React from 'react';
import { supabase } from '@/lib/supabase';
import CourseCard from '@/components/CourseCard';

export const runtime = 'edge';

export default async function ClassesPage() {
  const { data: classesData } = await supabase.from('classes').select('*');
  const classes = classesData || [];

  return (
    <div className="flex flex-col items-center space-y-12 py-4">
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
