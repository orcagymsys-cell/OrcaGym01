'use client';

import { useEffect } from 'react';

export default function AdminDashboardRedirectPage() {
  useEffect(() => {
    window.location.href = '/admin/login';
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">
      กำลังนำท่านเข้าสู่ระบบแอดมิน ORCA GYM...
    </div>
  );
}
