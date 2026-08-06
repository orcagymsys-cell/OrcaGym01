import AddChildForm from '@/components/AddChildForm';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export const runtime = 'edge';


export const metadata: Metadata = {
  title: 'Add Family Member - ORCA GYMNASTICS',
};

export default function AddFamilyMemberPage() {
  return (
    <div className="relative pt-4 sm:pt-6">
      <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
        <Link 
          href="/dashboard" 
          className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#1a2d5c] rounded-xl font-bold text-xs transition-colors border border-slate-300"
        >
          <ChevronLeft size={18} />
          <span>Back</span>
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-[#1a2d5c] flex items-center space-x-2">
          <span className="text-2xl" role="img" aria-label="family">👥</span>
          <span className="underline decoration-2 underline-offset-4">Add Family Member</span>
        </h1>
        <div className="w-20 hidden sm:block" />
      </div>
      
      <AddChildForm />
    </div>
  );
}
