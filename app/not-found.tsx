import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center font-sans">
      <h2 className="text-3xl font-bold text-[#001a3a] mb-2">404 - Not Found</h2>
      <p className="text-slate-500 mb-6 font-medium">ไม่พบหน้าที่คุณกำลังค้นหา</p>
      <Link href="/" className="btn-primary-orca text-lg">
        กลับสู่หน้าหลัก
      </Link>
    </div>
  );
}
