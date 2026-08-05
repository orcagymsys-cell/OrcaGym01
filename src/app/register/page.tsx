import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';

export const runtime = 'edge';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 font-sans">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-200 text-center space-y-6">
        <div className="mx-auto w-32 h-32 relative">
          <Image 
            src="/images/logo.png" 
            alt="ORCA GYMNASTICS" 
            fill
            className="object-contain"
          />
        </div>

        <div>
          <h1 className="text-xl font-black text-[#183363]">ORCA GYMNASTICS</h1>
          <p className="text-xs font-bold text-slate-500 mt-1">ระบบบริหารคลาสเรียนยิมนาสติกเด็ก</p>
        </div>

        <div className="bg-sky-50 border-2 border-sky-300 p-5 rounded-2xl text-left space-y-2">
          <h3 className="font-black text-[#183363] text-sm flex items-center gap-1.5">
            <span>ℹ️ คำแนะนำการสมัครเข้าใช้งาน</span>
          </h3>
          <p className="text-xs font-semibold text-slate-700 leading-relaxed">
            ระบบไม่มีการเปิดสมัครสมาชิกสาธารณะผ่านหน้าเว็บ ผู้ปกครองจะได้รับ <strong>Username</strong> และ <strong>Password</strong> เข้าสู่ระบบโดยตรงจากแอดมิน หลังจากสั่งซื้อคลาสเรียนยิมนาสติกเรียบร้อยแล้ว
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <Link
            href="/login"
            className="w-full py-3 bg-[#183363] text-white font-black rounded-2xl block hover:bg-blue-900 shadow-md transition-all text-sm"
          >
            เข้าสู่ระบบ (Sign in)
          </Link>
        </div>
      </div>
    </div>
  );
}
