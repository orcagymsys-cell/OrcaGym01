import AddChildForm from '@/components/AddChildForm';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Add Family Member - ORCA GYMNASTICS',
};

export default function AddFamilyMemberPage() {
  return (
    <div className="relative">
      <Link 
        href="/dashboard" 
        className="absolute left-0 top-0 flex items-center text-gray-500 hover:text-[#183363] transition-colors"
      >
        <ChevronLeft size={24} />
        <span className="font-semibold ml-1">Back</span>
      </Link>
      
      <div className="flex justify-center mb-6 pt-2">
        <h1 className="text-[26px] font-bold text-[#1a2d5c] flex items-center space-x-3">
          <span className="text-4xl grayscale opacity-70" role="img" aria-label="family">👥</span>
          <span>Add Family Member</span>
        </h1>
      </div>
      
      <AddChildForm />
    </div>
  );
}
