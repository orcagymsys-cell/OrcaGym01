'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import BackButton from '@/components/BackButton';
import { store, setupRealtimeSubscriptions, isSupabaseConfigured, getFamilyBaskets, type FamilyBasket } from '@/lib/supabase';
import { Child, Booking } from '@/lib/types';
import { showToast } from '@/components/Toast';
import ServiceTermsModal from '@/components/ServiceTermsModal';



function formatThaiShortDate(dateInput: string | Date | undefined | null, includeTime = false): string {
  if (!dateInput) return '-';
  const str = String(dateInput);
  let d: Date;

  if (str.includes('/') && str.split('/').length === 3) {
    const parts = str.split('/');
    let day = parseInt(parts[0], 10);
    let month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year > 2500) year -= 543;
    d = new Date(year, month, day);
  } else {
    d = new Date(str.includes('T') ? str : str.replace(' ', 'T'));
  }

  if (isNaN(d.getTime())) return str;

  const monthShortNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const day = d.getDate();
  const monthStr = monthShortNames[d.getMonth()];
  const year = d.getFullYear() + (d.getFullYear() < 2500 ? 543 : 0);

  let dateStr = `${day} ${monthStr} ${year}`;
  if (includeTime) {
    const timeMatch = str.match(/(\d{2}:\d{2})/);
    if (timeMatch) {
      dateStr += ` ${timeMatch[1]} น.`;
    }
  }
  return dateStr;
}

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const requestRef = useRef(0);
  const [children, setChildren] = useState<Child[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [coursesFromDB, setCoursesFromDB] = useState<any[]>([]);

  useEffect(() => {
    const user = store.getCurrentUser();
    if (!user) {
      setMounted(true);
      setLoading(false);
      return;
    }
    if (user.role === 'admin') {
      setMounted(true);
      setLoading(false);
      return;
    }
    // Load from cache instantly — always show content, never block on spinner
    const myKids = store.getLocal<Child[]>('ORCA_MY_KIDS', []);
    const myBookings = store.getLocal<Booking[]>('ORCA_MY_BOOKINGS', []);
    setChildren(myKids);
    setBookings(myBookings);
    setLoading(false);   // ← Always false after mount, regardless of cache
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      const reqId = ++requestRef.current;
      try {
        let currentUser = store.getCurrentUser();
        if (!currentUser) {
          localStorage.removeItem('ORCA_MY_KIDS');
          localStorage.removeItem('ORCA_MY_BOOKINGS');
          fetch('/api/auth/logout', { method: 'POST', keepalive: true }).catch(() => {});
          window.location.replace('/');
          return;
        }

        if (currentUser.role === 'admin') {
          window.location.href = '/admin/dashboard';
          return;
        }

        const parentUserId = currentUser.id || currentUser.user_id;
        
        const [allUsers, allKids, allBookingsSys, allCourses] = await Promise.all([
          store.getUsers(),
          store.getChildren(),   // fetch ALL, filter locally to avoid id-field mismatch
          store.getBookings(),
          store.getCourses()
        ]);
        
        setCoursesFromDB(allCourses || []);
        
        if (reqId !== requestRef.current) return;
        
        const freshUser = allUsers.find(u => u.phone === currentUser?.phone) 
          || allUsers.find(u => u.id === parentUserId || u.user_id === currentUser?.user_id);
        if (freshUser && JSON.stringify(freshUser) !== JSON.stringify(currentUser)) {
          currentUser = freshUser;
          store.setCurrentUser(freshUser);
        }

        const resolvedUserId = ((freshUser || currentUser)?.id || (freshUser || currentUser)?.user_id || parentUserId)?.trim();
        const kidsToSave = allKids.filter(k => k.parent_id?.trim() === resolvedUserId);
        setChildren(kidsToSave);
        store.setLocal('ORCA_MY_KIDS', kidsToSave);
        
        if (kidsToSave.length > 0) {
          const myKidIds = kidsToSave.map(k => k.id);
          const allB = allBookingsSys.filter(b => myKidIds.includes(b.child_id));
          const bookingsToSave = allB.filter(b => b.status !== 'Cancelled');
          setBookings(bookingsToSave);
          store.setLocal('ORCA_MY_BOOKINGS', bookingsToSave);
        } else {
          setBookings([]);
          store.setLocal('ORCA_MY_BOOKINGS', []);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error loading home page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Setup Realtime
    const cleanupRealtime = setupRealtimeSubscriptions(() => {
      loadData();
    });

    const pollInterval = setInterval(loadData, 15000);

    return () => {
      if (cleanupRealtime) cleanupRealtime();
      clearInterval(pollInterval);
    };
  }, []);

  const lowHoursChildren = children.filter(c => c.status === 'approved' && (c.total_hours - c.used_hours) <= 2);

  const handleSendSimulatedEmail = (childName: string) => {
    showToast(`📧 ส่งอีเมลแจ้งเตือนไปยังผู้ปกครอง: คอร์สเรียนของ ${childName} ใกล้หมดอายุแล้ว!`);
  };

  const handleDeleteChild = async (id: string, nickname: string) => {
    if (confirm(`คุณต้องการลบข้อมูลของ "น้อง ${nickname}" ออกจากระบบใช่หรือไม่?\n\n⚠️ การลบจะไม่สามารถย้อนกลับได้`)) {
      await store.deleteChild(id);
      showToast(`ลบข้อมูลน้อง ${nickname} เรียบร้อยแล้ว`);
      const currentUser = store.getCurrentUser();
      if (currentUser) {
        const data = await store.getChildren(currentUser.id);
        setChildren(data || []);
      }
    }
  };

  const currentUser = store.getCurrentUser();
  const basePurchased = (currentUser && currentUser.purchased_hours !== undefined && currentUser.purchased_hours > 0)
    ? currentUser.purchased_hours
    : 6;
  const familyBaskets = currentUser ? getFamilyBaskets(currentUser, children, coursesFromDB) : [];
  
  // Backwards compatibility for unused single-basket references (e.g. notifications)
  // We just pick the most prominent basket for the global alert if there's any.
  let showUnbookedNearExpiryBanner = false;
  let alertStartStr = '';
  let formattedPkgExpiryDate = '';
  let fullPkgExpiryDateStr = '';
  let daysUntilPkgExpiry = 0;
  let unbookedClassesCount = 0;
  let pkgDurationText = '';
  let totalPurchased = 0;
  let activeBookingsCount = bookings.filter(b => b.status !== 'Cancelled' && b.status !== 'cancelled').length;

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const monthShortNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  // Check if ANY basket is near expiry and has remaining allocation
  for (const basket of familyBaskets) {
    const pkgExpiryDate = new Date(basket.created_at);
    pkgExpiryDate.setMonth(pkgExpiryDate.getMonth() + basket.duration_months);
    const expiryDay = new Date(pkgExpiryDate);
    expiryDay.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil((expiryDay.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil <= 5 && basket.remaining_hours > 0) {
      showUnbookedNearExpiryBanner = true;
      daysUntilPkgExpiry = daysUntil;
      unbookedClassesCount = basket.remaining_hours;
      pkgDurationText = basket.duration_text;
      totalPurchased = basket.original_hours;
      
      const expYearStr = pkgExpiryDate.getFullYear() + 543;
      formattedPkgExpiryDate = `${pkgExpiryDate.getDate()} ${monthShortNames[pkgExpiryDate.getMonth()]} ${expYearStr.toString().substring(2)}`;
      fullPkgExpiryDateStr = `${pkgExpiryDate.getDate()} ${monthNames[pkgExpiryDate.getMonth()]} ${expYearStr}`;
      
      const alertStart = new Date(pkgExpiryDate);
      alertStart.setDate(alertStart.getDate() - 5);
      alertStartStr = `${alertStart.getDate()} ${monthShortNames[alertStart.getMonth()]} ${String(alertStart.getFullYear() + 543).substring(2)}`;
      break; // Just show one alert
    }
  }

  // Remove the old totalAllocated etc since we loop over baskets
  const totalRemaining = familyBaskets.reduce((sum, b) => sum + b.remaining_hours, 0);
  const isBasketLow = totalRemaining <= 2;

  // Check if ANY basket is low
  const showLowHoursAlert = showUnbookedNearExpiryBanner || isBasketLow;


  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-sans animate-pulse">
        <div className="w-16 h-16 border-4 border-[#001a3a] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-bold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="font-['Anuphan',sans-serif]">
      <ServiceTermsModal />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        {/* Parent Profile Info */}
        <div className="bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <span className="text-sm font-black text-[#001a3a]">
              ผู้ปกครอง: <span className="text-blue-700">{currentUser?.name}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px]">
            {currentUser?.pdpa_accepted ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                ✅ ยอมรับกฎระเบียบ
              </span>
            ) : (
              <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                ⏳ รอยอมรับกฎระเบียบ
              </span>
            )}
            {currentUser?.media_consent !== undefined && (
              currentUser.media_consent ? (
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
                  📷 ยินยอมใช้สื่อ PR
                </span>
              ) : (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
                  🚫 ไม่ยินยอมใช้สื่อ PR
                </span>
              )
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {showLowHoursAlert && (
            <button
              type="button"
              onClick={() => setShowNotificationModal(true)}
              className="relative p-2.5 bg-amber-100 border border-amber-300 rounded-full text-amber-900 font-bold hover:bg-amber-200 cursor-pointer transition-all shadow-2xs"
              title="การแจ้งเตือนคอร์สใกล้ครบกำหนด"
            >
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center animate-bounce">
                1
              </span>
            </button>
          )}
          <div className="home-badge-header">HOME</div>
        </div>
      </div>

      {/* Multiple Family Baskets Render */}
      {familyBaskets.length === 0 ? (
        <div className="my-4 bg-white border-2 border-slate-200 p-4 rounded-3xl text-center text-slate-500 font-bold shadow-xs">
          ยังไม่มีแพ็กเกจคอร์สเรียน
        </div>
      ) : (
        familyBaskets.map((basket, idx) => {
          const pkgExpiryDate = new Date(basket.created_at);
          pkgExpiryDate.setMonth(pkgExpiryDate.getMonth() + basket.duration_months);
          const expYearStr = pkgExpiryDate.getFullYear() + 543;
          const fmtExp = `${pkgExpiryDate.getDate()} ${monthShortNames[pkgExpiryDate.getMonth()]} ${expYearStr.toString().substring(2)}`;
          const pDate = new Date(basket.created_at);
          const pYearStr = pDate.getFullYear() + 543;
          const fmtPur = `${pDate.getDate()} ${monthShortNames[pDate.getMonth()]} ${pYearStr.toString().substring(2)}`;
          return (
            <div key={basket.id || idx} className="my-4 bg-white border-2 border-slate-200 p-4 rounded-3xl text-xs space-y-3 font-['Anuphan',sans-serif] shadow-xs">
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0 pt-1">
                    <svg className="w-10 h-10 fill-[#1d2a44]" viewBox="0 0 24 24">
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    <span className="absolute -top-1.5 -right-3.5 bg-[#ff3b69] text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-md border-2 border-white leading-none tracking-tight">
                      {basket.used_hours}/{basket.original_hours}
                    </span>
                  </div>
                  <div className="flex flex-col pl-2">
                    <span className="text-base font-black text-[#001a3a] leading-tight">
                      ตะกร้า: <span className="text-[#0088ff]">{basket.course_name}</span>
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      (อายุคอร์ส {basket.duration_text})
                    </span>
                  </div>
                </div>
                <span className="text-blue-900 bg-sky-100 px-3 py-1.5 rounded-full text-[11px] font-extrabold border border-sky-300 shrink-0">
                  คงเหลือ: <strong className="text-blue-700 text-sm">{basket.remaining_hours}</strong> ครั้ง
                </span>
              </div>
              <div className="grid grid-cols-3 text-center gap-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 font-bold shadow-2xs">
                <div>
                  <div className="text-[10px] text-slate-500 font-normal">ซื้อจำนวน</div>
                  <div className="text-slate-800 text-xs sm:text-sm font-extrabold">{basket.original_hours} ครั้ง</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-normal">จัดสรรแล้ว</div>
                  <div className="text-rose-600 text-xs sm:text-sm font-extrabold">{basket.original_hours - basket.remaining_hours} ครั้ง</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-normal">คงเหลือในตะกร้า</div>
                  <div className="text-blue-700 text-xs sm:text-sm font-black">{basket.remaining_hours} ครั้ง</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-sky-50/70 p-2.5 rounded-2xl border border-sky-100 text-[11px] font-semibold text-slate-700">
                <div>📅 <strong>วันที่ซื้อ:</strong> <span className="text-slate-900 font-bold">{fmtPur}</span></div>
                <div>⏳ <strong>วันหมดอายุ:</strong> <span className="text-blue-900 font-extrabold">{fmtExp}</span></div>
              </div>
            </div>
          );
        })
      )}

      {/* 🚨 Prominent Unbooked Course Package Near-Expiry Persistent Banner */}
      {showUnbookedNearExpiryBanner && (
        <div className="mb-5 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 text-white p-4 sm:p-5 rounded-3xl shadow-xl border-2 border-amber-300 font-['Anuphan',sans-serif] animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">🚨</span>
              <div>
                <h4 className="font-black text-sm sm:text-base leading-tight">
                  แจ้งเตือน: คอร์สเรียนใกล้ครบกำหนดระยะเวลา {pkgDurationText}!
                </h4>
                <p className="text-xs text-amber-200 font-bold mt-0.5">
                  {daysUntilPkgExpiry <= 0
                    ? '⚠️ ครบกำหนดเวลาแพ็กแล้ว'
                    : `⏰ เหลือเวลาอีก ${daysUntilPkgExpiry} วันก่อนครบกำหนดวันที่ ${formattedPkgExpiryDate} (${fullPkgExpiryDateStr}) — เริ่มแจ้งเตือนล่วงหน้า 5 วัน ตั้งแต่วันที่ ${alertStartStr}`}
                </p>
              </div>
            </div>
            <span className="bg-white text-rose-800 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md shrink-0">
              ยังไม่ได้จองอีก {unbookedClassesCount} ครั้ง
            </span>
          </div>
          <p className="text-xs font-semibold leading-relaxed text-slate-100 bg-black/20 p-3 rounded-2xl border border-white/20 mt-2">
            📢 คุณซื้อแพ็กคอร์สเรียนไว้แล้ว ({totalPurchased} ครั้ง) แต่ยังไม่ได้จองคลาสเรียนให้ครบ (จองแล้ว {activeBookingsCount}/{totalPurchased} ครั้ง - ยังเหลืออีก {unbookedClassesCount} ครั้ง) ระบบเริ่มแจ้งเตือนล่วงหน้า 5 วัน ตั้งแต่วันที่ {alertStartStr} ก่อนวันครบกำหนดในวันที่ {formattedPkgExpiryDate} ({fullPkgExpiryDateStr})
          </p>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setShowNotificationModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-[#001a3a] px-4 py-2 rounded-2xl font-black text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5 border border-white/80"
            >
              <span>📋</span>
              <span>ดูรายละเอียดการแจ้งเตือน &gt;</span>
            </button>
          </div>
        </div>
      )}

      {/* Notification Detail Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl font-['Anuphan',sans-serif]">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-[#001a3a] flex items-center gap-2">
                <span>🔔</span>
                <span>รายละเอียดการแจ้งเตือนแพ็ก</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowNotificationModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {familyBaskets.map((basket, bIdx) => {
                const bExpiry = new Date(basket.created_at);
                bExpiry.setMonth(bExpiry.getMonth() + basket.duration_months);
                
                const bFormattedPurchase = formatThaiShortDate(new Date(basket.created_at));
                const bFormattedExpiry = formatThaiShortDate(bExpiry);
                
                const alertStart = new Date(bExpiry);
                alertStart.setDate(alertStart.getDate() - 5);
                const bAlertStart = formatThaiShortDate(alertStart);
                
                const today = new Date();
                today.setHours(0,0,0,0);
                const exp = new Date(bExpiry);
                exp.setHours(0,0,0,0);
                const bDaysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={bIdx} className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2">
                    <div className="font-extrabold text-amber-950 text-sm">
                      📅 แพ็กเกจ {basket.course_name} ({basket.original_hours} ครั้ง)
                    </div>
                    <div className="text-xs text-amber-900 font-medium space-y-1">
                      <div>• วันที่เริ่มซื้อคอร์ส: <strong>{bFormattedPurchase}</strong></div>
                      <div>• วันที่ครบกำหนด (หมดอายุ): <strong className="text-blue-900">{bFormattedExpiry}</strong></div>
                      <div>• เริ่มแจ้งเตือนล่วงหน้า 5 วัน: <strong className="text-rose-800">{bAlertStart}</strong></div>
                      <div>• สถานะ: <strong className="text-rose-700">{bDaysLeft > 0 ? `เหลือเวลาอีก ${bDaysLeft} วัน` : 'ครบกำหนดแล้ว'}</strong></div>
                    </div>
                  </div>
                );
              })}

              <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl space-y-1 text-xs">
                <div className="font-bold text-[#001a3a]">🛒 สรุปโควต้าตะกร้าครอบครัว</div>
                <div>ซื้อรวม: <strong>{familyBaskets.reduce((acc, b) => acc + b.original_hours, 0)} ครั้ง</strong></div>
                <div>จัดสรรให้เด็กแล้ว: <strong>{familyBaskets.reduce((acc, b) => acc + (b.original_hours - b.remaining_hours), 0)} ครั้ง</strong></div>
                <div>คงเหลือครอบครัว: <strong className="text-blue-700">{familyBaskets.reduce((acc, b) => acc + b.remaining_hours, 0)} ครั้ง</strong></div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNotificationModal(false)}
                  className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-full cursor-pointer"
                >
                  ปิดหน้าต่าง
                </button>
                <a
                  href="https://line.me"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-[#06C755] hover:bg-[#05b34c] text-white text-center font-bold text-xs rounded-full shadow-md cursor-pointer flex items-center justify-center gap-1"
                >
                  💬 ติดต่อแอดมินทาง LINE
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Family Member Button Block */}
      <Link href="/add-child" className="flex items-center gap-4 mb-4 group cursor-pointer">
        <svg className="w-14 h-14 shrink-0" viewBox="0 0 100 100">
          <circle cx="36" cy="38" r="16" fill="#fde047" />
          <path d="M 20 70 C 20 52, 52 52, 52 70 Z" fill="#ec4899" />
          <circle cx="64" cy="40" r="16" fill="#fde047" />
          <path d="M 48 72 C 48 56, 80 56, 80 72 Z" fill="#eab308" />
          <circle cx="68" cy="68" r="12" fill="#10b981" stroke="white" strokeWidth="2" />
          <path d="M 68 62 L 68 74 M 62 68 L 74 68" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="text-2xl font-bold text-[#003366] underline">
          Add Family Member
        </span>
      </Link>

      <hr className="border-t-4 border-slate-400 my-5 rounded" />

      {/* Children List Rendered in Family Member Format */}
      <div className="space-y-5">
        {children.length === 0 ? (
          <div className="text-center py-8 text-slate-500 font-normal">
            ยังไม่มีข้อมูลเด็กในระบบ กรุณากด "Add Family Member" ด้านบนเพื่อเพิ่มข้อมูล
          </div>
        ) : (
          children.map((child) => {
            const avatarSrc = child.photo_url || (child.avatar === 'boy' ? '🧒🏼' : '👧🏻');
            const remaining = child.total_hours - child.used_hours;
            const isApproved = child.status === 'approved';

            let formattedDob = child.dob;
            if (child.dob && child.dob.includes('-')) {
              const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const parts = child.dob.split('-');
              const monthIdx = parseInt(parts[1], 10) - 1;
              formattedDob = `${parts[2]} ${monthNames[monthIdx]} ${parts[0]}`;
            }

            return (
              <div
                key={child.id}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href={`/student/${child.id}`}
                    className="flex items-center gap-4 flex-1 cursor-pointer"
                  >
                    <div className="w-20 h-20 rounded-full overflow-hidden shrink-0 border-[3.5px] border-slate-300 bg-sky-100 flex items-center justify-center text-3xl shadow-inner">
                      {typeof avatarSrc === 'string' && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:image')) ? (
                        <img src={avatarSrc} alt={child.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <span>{avatarSrc}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 font-sans">
                      <div className="text-lg font-black text-[#003366]">{child.full_name}</div>
                      <div className="text-base font-extrabold text-[#003366]">น้อง {child.nickname}</div>
                      <div className="text-xs font-semibold text-slate-600 mb-1">เกิด {formattedDob} | {child.gender}</div>
                      <div className="text-[11px] font-bold text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded-lg w-max flex items-center gap-1 shadow-sm">
                        <span>🏷️</span> ตะกร้า: {child.course_name || 'ORCA CUBS'}
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-1.5 shrink-0 font-sans">
                    <Link
                      href={`/student/${child.id}/book`}
                      className="bg-[#2563eb] text-white border border-[#1d4ed8] px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-[#1d4ed8] transition-all flex items-center gap-1 shadow-sm"
                    >
                      📅 Booking
                    </Link>
                    <Link
                      href={`/student/${child.id}/edit`}
                      className="bg-slate-100 text-[#001a3a] border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                    >
                      ✏️ แก้ไข
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChild(child.id, child.nickname);
                      }}
                      className="bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-rose-100 hover:text-rose-800 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      title="ลบข้อมูลเด็ก"
                    >
                      <span>🗑️</span>
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>

                {/* Child Individual Quota Summary */}
                <div className="bg-sky-50/70 border border-sky-200 p-3 rounded-2xl text-xs space-y-1 font-['Anuphan',sans-serif]">
                  <div className="flex items-center justify-between font-bold text-[#001a3a]">
                    <span className="font-extrabold text-xs text-sky-950 flex items-center gap-1">
                      👶 สิทธิ์ชั่วโมงเรียนของ {child.nickname}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-900 bg-white px-2.5 py-0.5 rounded-xl text-xs font-black border border-sky-200 shadow-2xs">
                        ใช้ไป {child.used_hours}/{child.total_hours} ครั้ง
                      </span>
                      {isApproved ? (
                        <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px] font-extrabold border border-emerald-300">
                          ✅ อนุมัติแล้ว
                        </span>
                      ) : (
                        <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full text-[11px] font-extrabold border border-amber-300">
                          ⏳ รออนุมัติ
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
      
      {/* DIAGNOSTIC */}
      <div className="text-center text-xs text-gray-400 mt-8 mb-4">
        {typeof window !== 'undefined' ? `MyKidsCache: ${store.getLocal('ORCA_MY_KIDS', []).length}, IsAdmin: ${store.getCurrentUser()?.role === 'admin'}` : 'SSR'}
      </div>

    </div>
  );
}

