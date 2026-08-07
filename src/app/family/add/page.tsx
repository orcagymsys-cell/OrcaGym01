import AddChildForm from '@/components/AddChildForm';
import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';

export const runtime = 'edge';


export const metadata: Metadata = {
  title: 'Add Family Member - ORCA GYMNASTICS',
};

export default async function AddFamilyMemberPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;
  
  if (!userId || userId === 'parent_1') {
    // Failsafe: if the user is stuck with the old mock cookie, force them to log in again
    redirect('/login');
  }

  return (
    <div className="relative pt-4 sm:pt-6 max-w-5xl mx-auto w-full px-4 sm:px-6">
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
        <div className="w-24 sm:w-28 flex justify-end">
          <LogoutButton className="flex items-center space-x-1 px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold text-xs transition-colors border border-rose-300 shadow-sm" />
        </div>
      </div>
      
      <AddChildForm userId={userId} />
    </div>
  );
}
