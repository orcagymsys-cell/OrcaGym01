import { getChildren } from '@/app/actions/children';
import Image from 'next/image';
import DashboardClient from '@/components/DashboardClient';

export default async function DashboardPage() {
  const children = await getChildren();

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
      <div className="w-full flex justify-start mb-2">
        <Image 
          src="/images/LOGOORCA01.png" 
          alt="ORCA" 
          width={180} 
          height={180} 
          className="object-contain" 
        />
      </div>

      <div className="flex items-center justify-center space-x-3 w-full mb-6 relative">
        <span className="text-5xl" role="img" aria-label="family">👩‍👧‍👦</span>
        <h1 className="text-3xl font-bold text-[#183363] border-b-4 border-[#183363] pb-1">
          Add Family Member
        </h1>
      </div>
      
      <div className="w-full max-w-lg h-[4px] bg-gray-400 mb-8 rounded-full"></div>

      <DashboardClient childrenData={children} />
    </div>
  );
}
