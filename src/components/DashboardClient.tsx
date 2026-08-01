'use client';

import { useState } from 'react';
import Link from 'next/link';
import { deleteChild } from '@/app/actions/children';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Child } from '@/lib/types';

export default function DashboardClient({ childrenData }: { childrenData: Child[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this child?')) {
      setLoadingId(id);
      await deleteChild(id);
      router.refresh();
      setLoadingId(null);
    }
  };

  return (
    <div className="w-full" style={{ fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif" }}>
      {childrenData.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No family members added yet.</p>
          <Link 
            href="/family/add" 
            className="px-6 py-2 bg-[#183363] text-white rounded-full font-semibold hover:bg-[#112448]"
          >
            + Add Family Member
          </Link>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-10">
          {childrenData.map(child => {
            const formattedDob = child.dob ? new Date(child.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            return (
              <div key={child.id} className="flex flex-col items-center w-full max-w-lg relative group px-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between w-full space-y-6 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-center sm:space-x-8 w-full">
                    <div className="shrink-0 mb-4 sm:mb-0">
                      <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-full bg-[#95b8d1] flex items-center justify-center overflow-hidden border-[3px] border-transparent relative shadow-sm">
                        {(child as any).photo_url ? (
                           <img src={(child as any).photo_url} alt={child.nickname} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-white font-bold text-5xl">{child.nickname[0]}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-center sm:items-start flex-1 text-[#1a2d5c]">
                      <h3 className="font-semibold text-[20px] sm:text-[22px] mb-1">
                        Name-Surname: <span className="text-[#3b82f6]">{child.full_name}</span>
                      </h3>
                      <p className="font-semibold text-[20px] sm:text-[22px] mb-1">
                        Nickname: <span className="text-[#3b82f6]">น้อง {child.nickname}</span>
                      </p>
                      <p className="font-semibold text-[18px] sm:text-[20px] mb-1">
                        Birthday: <span className="text-[#3b82f6]">{formattedDob}</span>
                      </p>
                      <p className="font-semibold text-[18px] sm:text-[20px]">
                        Gender: <span className="text-[#3b82f6]">{child.gender}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-4 mt-6 w-full justify-center sm:justify-start sm:pl-[172px]">
                  <Link 
                    href={`/child/${child.id}`}
                    className="px-6 py-2 bg-[#1a2d5c] text-white rounded-full font-bold text-lg hover:bg-[#111d3d] transition-all shadow-[0_3px_0_0_#ef4444,0_3px_0_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0_0_0_0_#ef4444] whitespace-nowrap"
                  >
                    Booking Course
                  </Link>
                  <Link 
                    href={`/child/${child.id}`} // They both go to the same page for now, as that page handles both booking and history
                    className="px-6 py-2 bg-white text-[#1a2d5c] rounded-full font-bold text-lg hover:bg-gray-50 transition-all shadow-[0_3px_0_0_#ef4444,0_3px_0_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0_0_0_0_#ef4444] whitespace-nowrap"
                  >
                    My Course
                  </Link>
                </div>
                
                <button 
                  onClick={(e) => handleDelete(e, child.id)}
                  disabled={loadingId === child.id}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 hidden sm:block"
                  title="Delete child"
                >
                  {loadingId === child.id ? <span className="animate-spin text-xl">↻</span> : <Trash2 size={24} />}
                </button>
              </div>
            );
          })}
          
          <div className="flex flex-col items-center mt-12 space-y-8 w-full">
            <Link 
              href="/family/add" 
              className="text-[#1a2d5c] font-bold underline underline-offset-4 decoration-2 hover:text-blue-800 text-lg"
            >
              + Add Another Child
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
