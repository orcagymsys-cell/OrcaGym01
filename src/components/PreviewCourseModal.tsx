'use client';

import { useState } from 'react';
import { GymClass } from '@/lib/types';
import CourseCard from './CourseCard';
import { Eye, X } from 'lucide-react';

export default function PreviewCourseModal({ course }: { course: GymClass }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-900 transition-colors"
        title="Preview"
      >
        <Eye size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="bg-transparent rounded-3xl w-full max-w-5xl max-h-[92vh] overflow-y-auto relative p-2">
            <div className="sticky top-2 right-2 flex justify-end z-20 mb-2">
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-white/90 text-slate-700 hover:text-rose-500 hover:bg-white rounded-full p-2.5 shadow-lg border border-slate-200 backdrop-blur-sm transition-all hover:scale-110"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>
            <div>
              <CourseCard course={course} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
