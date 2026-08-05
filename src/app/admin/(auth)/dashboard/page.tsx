import Link from 'next/link';
import { UserPlus, Users, Calendar, Settings } from 'lucide-react';

export const runtime = 'edge';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-[#183363]">Admin Dashboard</h1>
          <p className="text-slate-600 text-sm mt-1">ยินดีต้อนรับสู่ระบบผู้ดูแลระบบ ORCA GYM</p>
        </div>
        
        <Link 
          href="/admin/members"
          className="flex items-center space-x-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 shrink-0"
        >
          <UserPlus size={20} />
          <span>สร้างบัญชีผู้ปกครองใหม่ (Create Parent Account)</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/members" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all block">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#183363]">บัญชีผู้ปกครอง & นักเรียน</h2>
            <Users className="text-blue-600" size={24} />
          </div>
          <p className="text-xs text-slate-500 mt-1">คลิกที่นี่เพื่อสร้าง Username/Password และดูรายชื่อนักเรียน</p>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-600">
            <span>+ สร้างบัญชีผู้ปกครองใหม่ →</span>
          </div>
        </Link>

        <Link href="/admin/schedule" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all block">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#183363]">Schedule Matrix</h2>
            <Calendar className="text-[#183363]" size={24} />
          </div>
          <p className="text-xs text-slate-500 mt-1">ดูตารางเรียนและรายชื่อเด็กที่จองในแต่ละรอบ</p>
        </Link>

        <Link href="/admin/classes" className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 transition-all block">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-[#183363]">Classes & Pricing</h2>
            <Settings className="text-purple-600" size={24} />
          </div>
          <p className="text-xs text-slate-500 mt-1">จัดการรอบคลาสเรียน รายละเอียด และราคาคลาส</p>
        </Link>
      </div>
    </div>
  );
}
