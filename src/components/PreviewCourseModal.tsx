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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto relative">
            <div className="sticky top-0 right-0 p-4 flex justify-end z-10">
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-white text-gray-500 hover:text-red-500 hover:bg-gray-100 rounded-full p-2 shadow-sm border"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-4 md:p-8 pt-0">
              <CourseCard course={course} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
