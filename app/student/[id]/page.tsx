'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { Child, Booking } from '@/lib/types';

export const runtime = 'edge';

export default function StudentDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const childId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [mounted, setMounted] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [parentPurchased, setParentPurchased] = useState<number>(6);
  const [familyChildren, setFamilyChildren] = useState<Child[]>([]);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showMyCourseModal, setShowMyCourseModal] = useState<boolean>(false);
  const [topUpHours, setTopUpHours] = useState<number>(2);

  const formatThaiBookingDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const dayName = dayNames[d.getDay()];
    const day = d.getDate();
    const monthName = monthNames[d.getMonth()];
    const yearBE = d.getFullYear() + 543;
    return `${dayName}ที่ ${day} ${monthName} ${yearBE}`;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    async function loadData() {
      try {
        const targetId = childId || 'c_demo_1';
        let c = await store.getChildById(targetId);

        if (!c) {
          const allChildren = await store.getChildren();
          if (allChildren.length > 0) {
            c = allChildren[0];
          } else {
            c = {
              id: targetId,
              parent_id: 'u_parent',
              full_name: 'สบายตา สบายใจ',
              nickname: 'น้องเย็นสบาย',
              dob: '2020-05-05',
              gender: 'Girl',
              avatar: 'girl',
              status: 'approved',
              course_name: 'Orca Cubs',
              total_hours: 12,
              used_hours: 2,
              expiry_date: '02/02/2070'
            };
          }
        }
        setChild(c);

        const u = store.getCurrentUser();\n        if (u) { store.getUsers().then(users => { const fresh = users.find(x => x.id === u.id); if (fresh && JSON.stringify(fresh) !== JSON.stringify(u)) { store.setCurrentUser(fresh); setParentPurchased(fresh.purchased_hours || 6); } }); }
        const purchased = u?.purchased_hours || 6;
        setParentPurchased(purchased);

        const famC = await store.getChildren(c.parent_id);
        setFamilyChildren(famC || []);

        const b = await store.getBookings(targetId);
        setBookings(b || []);
      } catch (err) {
        console.error('Error loading student dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Auto refresh child status in real-time every 2s or when store changes
    // removed polling
    const handleStoreChange = (e: any) => {
      if (e && e.detail && e.detail.key === 'orca_current_user') return;
      loadData();
    };
    window.addEventListener('storage', handleStoreChange);
    window.addEventListener('orca_store_updated', handleStoreChange);

    return () => {
      // removed polling
      window.removeEventListener('storage', handleStoreChange);
      window.removeEventListener('orca_store_updated', handleStoreChange);
    };
  }, [mounted, childId]);

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('คุณต้องการยกเลิกการจองเรียนในรอบนี้ใช่หรือไม่? (ระบบจะคืน 1 ชั่วโมง)')) {
      await store.cancelBooking(bookingId);
      if (child) {
        const newUsed = Math.max(0, child.used_hours - 1);
        await store.updateChild(child.id, { used_hours: newUsed });
        setChild({ ...child, used_hours: newUsed });
      }
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      showToast('ยกเลิกการจองคลาสเรียนเรียบร้อย');
    }
  };

  const handleTopUpFromFamilyBasket = async (hoursToTopUp: number) => {
    if (!child) return;
    const totalAllocatedInFamily = familyChildren.reduce((sum, c) => sum + (c.total_hours || 0), 0);
    const familyRemaining = Math.max(0, parentPurchased - totalAllocatedInFamily);

    if (hoursToTopUp <= 0 || hoursToTopUp > familyRemaining) {
      showToast(`⚠️ จำนวนโควต้าที่เลือกเกินโควต้าคงเหลือในตะกร้าครอบครัว (${familyRemaining} ครั้ง)`);
      return;
    }

    const newTotal = (child.total_hours || 0) + hoursToTopUp;
    await store.updateChild(child.id, { total_hours: newTotal });
    setChild({ ...child, total_hours: newTotal });

    const updatedChildren = await store.getChildren(child.parent_id);
    setFamilyChildren(updatedChildren || []);

    setShowTopUpModal(false);
    showToast(`✅ เติมชั่วโมงเรียนให้น้อง ${child.nickname} เพิ่มอีก ${hoursToTopUp} ครั้ง จากตะกร้าครอบครัวเรียบร้อยแล้ว!`);
  };

  const handleBookClick = () => {
    if (child?.status === 'pending') {
      showToast('⏳ คอร์สเรียนนี้กำลังรอ Admin อนุมัติการลงทะเบียน กรุณารอแอดมินอนุมัติก่อนจองคลาส');
      return;
    }
    if (!child || (child.total_hours - child.used_hours) <= 0) {
      showToast('⚠️ จำนวนชั่วโมงเรียนหมดแล้ว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง');
      return;
    }
    router.push(`/student/${child.id}/book`);
  };

  const handleDeleteChild = async () => {
    if (!child) return;
    if (confirm(`คุณต้องการลบข้อมูลของ "น้อง ${child.nickname}" ออกจากระบบใช่หรือไม่?\n\n⚠️ การลบจะไม่สามารถย้อนกลับได้`)) {
      await store.deleteChild(child.id);
      showToast(`ลบข้อมูลน้อง ${child.nickname} เรียบร้อยแล้ว`);
      router.push('/home');
    }
  };

  if (!mounted || loading || !child) {
    return (
    <div className="font-sans animate-pulse p-4 max-w-[1200px] mx-auto space-y-6">
      <div className="bg-slate-200 h-12 w-64 rounded-xl"></div>
      <div className="bg-slate-200 h-48 w-full rounded-3xl"></div>
      <div className="bg-slate-200 h-[400px] w-full rounded-3xl"></div>
    </div>
  );
  }

  const remaining = child.total_hours - child.used_hours;
  const isCourseApproved = child.status === 'approved';
  const avatarSrc = child.photo_url || (child.avatar === 'boy' ? '🧒🏼' : '👧🏻');

  // Family basket calculations
  const totalAllocatedInFamily = familyChildren.reduce((sum, c) => sum + (c.total_hours || 0), 0);
  const familyRemaining = Math.max(0, parentPurchased - totalAllocatedInFamily);
  const totalFamilyRemaining = familyChildren.reduce((sum, c) => sum + Math.max(0, c.total_hours - c.used_hours), 0) + familyRemaining;

  // Profile warning alert displays ONLY when family remaining <= 2
  const isQuotaLow = totalFamilyRemaining <= 2 && isCourseApproved;

  // Active bookings calculation
  const activeBookings = bookings.filter(b => b.status !== 'Cancelled');
  let isWithin5DaysOfLastClass = false;

  if (activeBookings.length > 0) {
    const sortedDates = activeBookings
      .map(b => b.booking_date)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (sortedDates.length > 0) {
      const lastBookingDateStr = sortedDates[0];
      const lastDate = new Date(lastBookingDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastDate.setHours(0, 0, 0, 0);

      const diffDays = Math.ceil((lastDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 5) {
        isWithin5DaysOfLastClass = true;
      }
    }
  }

  const showProfileLowHoursAlert = isQuotaLow && activeBookings.length > 0 && isWithin5DaysOfLastClass;

  // ⏳ Unbooked Course Package Near-Expiry Alert Banner (5 days pre-expiry notification, stays displayed until ALL classes are booked!)
  const totalPurchasedHours = parentPurchased || 6;
  let pkgDurationMonths = 2;
  if (totalPurchasedHours === 12) pkgDurationMonths = 4;
  else if (totalPurchasedHours === 24) pkgDurationMonths = 6;
  else if (totalPurchasedHours === 48) pkgDurationMonths = 12;

  const u = store.getCurrentUser();
  const pkgStartDateStr = u?.payment_datetime || u?.created_at || new Date().toISOString();
  const pkgStartDate = new Date(pkgStartDateStr.includes('T') ? pkgStartDateStr : pkgStartDateStr.replace(' ', 'T'));
  const validPkgStartDate = isNaN(pkgStartDate.getTime()) ? new Date() : pkgStartDate;

  const pkgExpiryDate = new Date(validPkgStartDate);
  pkgExpiryDate.setMonth(pkgExpiryDate.getMonth() + pkgDurationMonths);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const expiryDayDate = new Date(pkgExpiryDate);
  expiryDayDate.setHours(0, 0, 0, 0);

  const daysUntilPkgExpiry = Math.ceil((expiryDayDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  const isNearPkgExpiry = daysUntilPkgExpiry <= 5;

  const totalBookedCount = activeBookings.length;
  const unbookedClassesCount = Math.max(0, totalPurchasedHours - totalBookedCount);
  const hasUnbookedClasses = unbookedClassesCount > 0;

  // Persistent Alert Banner: Stays shown continuously as long as package is near expiry AND classes remain unbooked!
  const showUnbookedNearExpiryBanner = isNearPkgExpiry && hasUnbookedClasses;

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const monthShortNames = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];

  const expYearStr = pkgExpiryDate.getFullYear() + 543;
  const pYearStr = validPkgStartDate.getFullYear() + 543;

  const formattedPkgExpiryDate = `${pkgExpiryDate.getDate()} ${monthShortNames[pkgExpiryDate.getMonth()]} ${expYearStr}`;
  const fullPkgExpiryDateStr = `${pkgExpiryDate.getDate()} ${monthNames[pkgExpiryDate.getMonth()]} ${expYearStr}`;

  const formattedPurchaseDate = `${validPkgStartDate.getDate()} ${monthShortNames[validPkgStartDate.getMonth()]} ${pYearStr}`;
  const fullPurchaseDateStr = `${validPkgStartDate.getDate()} ${monthNames[validPkgStartDate.getMonth()]} ${pYearStr}`;

  const alertStartDate = new Date(pkgExpiryDate);
  alertStartDate.setDate(alertStartDate.getDate() - 5);
  const alertStartStr = `${alertStartDate.getDate()} ${monthShortNames[alertStartDate.getMonth()]} ${alertStartDate.getFullYear() + 543}`;

  return (
    <div className="font-sans">
      <div className="mb-4 flex items-center justify-between">
        <BackButton />
        <Link
          href={`/student/${child.id}/edit`}
          className="bg-slate-100 text-[#001a3a] border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-slate-200 font-sans cursor-pointer"
        >
          ✏️ Edit Profile (แก้ไขข้อมูล)
        </Link>
      </div>

      {/* 🚨 Unbooked Course Package Near-Expiry Persistent Banner */}
      {showUnbookedNearExpiryBanner && (
        <div className="mb-5 bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 text-white p-4 sm:p-5 rounded-3xl shadow-xl border-2 border-amber-300 font-['Anuphan',sans-serif] animate-pulse">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl">🚨</span>
              <div>
                <h4 className="font-black text-sm sm:text-base leading-tight">
                  แจ้งเตือน: แพ็กเกจคอร์สเรียนใกล้ครบกำหนดระยะเวลา ({pkgDurationMonths} เดือน)
                </h4>
                <p className="text-xs text-amber-200 font-bold mt-0.5">
                  {daysUntilPkgExpiry <= 0 ? '⚠️ ครบกำหนดเวลาแพ็กเกจแล้ว' : `⏰ เหลือเวลาอีกเพียง ${daysUntilPkgExpiry} วันก่อนครบกำหนดวันที่ ${formattedPkgExpiryDate} (${fullPkgExpiryDateStr}) — เริ่มแจ้งเตือนล่วงหน้า 5 วัน ตั้งแต่วันที่ ${alertStartStr}`}
                </p>
              </div>
            </div>
            <span className="bg-white text-rose-800 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md shrink-0">
              ยังไม่ได้จองอีก {unbookedClassesCount} ครั้ง
            </span>
          </div>

          <p className="text-xs font-semibold leading-relaxed text-slate-100 bg-black/20 p-3 rounded-2xl border border-white/20 mt-2">
            📢 คุณได้ซื้อแพ็กเกจคอร์สเรียนไว้แล้วแต่ยังไม่ได้เลือกจองรอบเรียนให้ครบ (จองแล้ว {totalBookedCount}/{totalPurchasedHours} ครั้ง - คงเหลืออีก {unbookedClassesCount} ครั้งที่ยังไม่ได้จอง) ระบบเริ่มแจ้งเตือนล่วงหน้า 5 วัน ตั้งแต่วันที่ {alertStartStr} ก่อนครบกำหนดในวันที่ {formattedPkgExpiryDate} ({fullPkgExpiryDateStr})
          </p>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleBookClick}
              className="bg-amber-400 hover:bg-amber-300 text-[#001a3a] px-5 py-2 rounded-2xl font-black text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5 border border-white/80"
            >
              <span>📅</span>
              <span>จองคลาสเรียนทันที &gt;</span>
            </button>
          </div>
        </div>
      )}

      {/* Child Profile Card */}
      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm text-center mb-5 relative overflow-hidden">
        
        {/* Shopping Cart Quota Badge */}
        <div className="inline-flex items-center gap-2 bg-sky-100 border border-sky-300 text-sky-900 px-3.5 py-1.5 rounded-full text-xs font-extrabold mb-4 shadow-2xs">
          <span className="bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">
            {remaining}
          </span>
          <span>ตะกร้าของน้อง{child.nickname} ({child.course_name || 'Orca Cubs'})</span>
        </div>

        {/* Student Avatar Picture */}
        <div className="w-24 h-24 rounded-full mx-auto mb-3 overflow-hidden border-[3.5px] border-slate-300 bg-sky-100 flex items-center justify-center text-4xl shadow-inner">
          {typeof avatarSrc === 'string' && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:image')) ? (
            <img src={avatarSrc} alt={child.nickname} className="w-full h-full object-cover" />
          ) : (
            <span>{avatarSrc}</span>
          )}
        </div>

        {/* Student Details */}
        <div className="space-y-0.5 mb-4">
          <div className="text-xl font-black text-[#001a3a]">Name-Surname: <span className="text-blue-700">{child.full_name}</span></div>
          <div className="text-lg font-extrabold text-[#001a3a]">Nickname: <span className="text-blue-700">น้อง {child.nickname}</span></div>
          <div className="text-sm font-semibold text-slate-600">Birthday: {child.dob} | Gender: {child.gender}</div>
        </div>

        {/* Course Status Badge */}
        <div className="mb-3">
          {child.status === 'pending' ? (
            <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-2xs animate-pulse">
              ⏳ {child.course_name || 'Orca Cubs'} - รอ Admin อนุมัติคอร์สเรียน
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold px-3.5 py-1.5 rounded-full shadow-2xs">
              ✅ {child.course_name || 'Orca Cubs'} - คอร์สเรียนพร้อมใช้งาน
            </span>
          )}
        </div>

        {/* Purchase Date & Expiry Date Box */}
        <div className="mb-4 bg-sky-50/80 border border-sky-200 rounded-2xl p-2.5 text-xs text-slate-700 font-semibold flex flex-wrap items-center justify-center gap-x-4 gap-y-1 font-['Anuphan',sans-serif]">
          <div>📅 <strong>วันที่ซื้อคอร์ส:</strong> <span className="text-slate-900 font-bold">{formattedPurchaseDate}</span></div>
          <div>⏳ <strong>วันที่หมดอายุ ({pkgDurationMonths} เดือน):</strong> <span className="text-blue-900 font-extrabold">{formattedPkgExpiryDate}</span></div>
        </div>

        {/* Low Hours Warning Alert (Appears ONLY after bookings exist + within 5 days before last class date) */}
        {showProfileLowHoursAlert && (
          <div className="mb-4 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold p-2.5 rounded-2xl flex items-center justify-center gap-2 animate-pulse font-['Anuphan',sans-serif]">
            <span>⚠️</span>
            <span>ชั่วโมงเรียนในตะกร้าคลาสนี้ใกล้หมดแล้ว</span>
          </div>
        )}

        {/* Action Buttons Row: Booking Course, My Course, Edit Profile */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleBookClick}
            disabled={child.status === 'pending'}
            className={`bg-[#003366] hover:bg-[#002244] text-white px-5 py-2.5 rounded-2xl font-extrabold text-sm shadow-md transition-all border border-blue-900 cursor-pointer flex items-center gap-1.5 ${child.status === 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>📅</span>
            <span>Booking Course</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMyCourseModal(true);
              const el = document.getElementById('my-course-schedule');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="bg-[#003366] hover:bg-[#002244] text-white px-5 py-2.5 rounded-2xl font-extrabold text-sm shadow-md transition-all border border-blue-900 cursor-pointer flex items-center gap-1.5"
          >
            <span>📊</span>
            <span>My Course</span>
          </button>

          <Link
            href={`/student/${child.id}/edit`}
            className="bg-white hover:bg-slate-100 text-[#001a3a] border-2 border-slate-300 px-4 py-2.5 rounded-2xl font-extrabold text-sm shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>✏️</span>
            <span>Edit Profile</span>
          </Link>

          <button
            type="button"
            onClick={handleDeleteChild}
            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-200 px-4 py-2.5 rounded-2xl font-extrabold text-sm shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 font-sans"
            title="ลบข้อมูลเด็ก"
          >
            <span>🗑️</span>
            <span>Delete Member</span>
          </button>
        </div>

      </div>

      {/* Family Cart Breakdown Summary Box */}
      <div className="bg-sky-50 border-2 border-sky-200 rounded-3xl p-5 mb-6 shadow-xs font-['Anuphan',sans-serif]">
        <div className="text-sm font-extrabold text-sky-950 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">🛒 ตะกร้าของน้อง{child.nickname}</span>
          <span className="text-xs bg-white text-sky-900 border border-sky-300 px-3 py-1 rounded-full font-bold">
            วันหมดอายุ: {formattedPkgExpiryDate}
          </span>
        </div>

        <div className="grid grid-cols-4 text-center gap-2 bg-white p-3.5 rounded-2xl border border-sky-200 font-bold shadow-2xs">
          <div className="border-r border-slate-100 pr-1">
            <div className="text-xs text-slate-500 font-normal mb-0.5">จำนวนครั้งที่ซื้อ</div>
            <div className="text-slate-800 text-sm sm:text-base font-extrabold">{child.total_hours} ครั้ง</div>
          </div>
          <div className="border-r border-slate-100 pr-1">
            <div className="text-xs text-slate-500 font-normal mb-0.5">ใช้ไปแล้ว</div>
            <div className="text-rose-600 text-sm sm:text-base font-extrabold">{child.used_hours} ครั้ง</div>
          </div>
          <div className="border-r border-slate-100 pr-1">
            <div className="text-xs text-slate-500 font-normal mb-0.5">แถมฟรี</div>
            <div className="text-emerald-600 text-sm sm:text-base font-extrabold">+{child.bonus_hours || 0} ครั้ง</div>
          </div>
          <div>
            <div className="text-xs text-slate-500 font-normal mb-0.5">คงเหลือ</div>
            <div className="text-blue-700 text-base sm:text-lg font-black">{remaining} ครั้ง</div>
          </div>
        </div>

        {/* Top Up Hours CTA Row - Premium Dynamic Banner */}
        {(() => {
          return familyRemaining > 0 ? (
            <div className="mt-4 p-4 rounded-3xl bg-gradient-to-r from-[#001a3a] via-[#002b55] to-[#004080] text-white shadow-xl border-2 border-amber-400/50 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden">
              {/* Background Glow Orb */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center gap-3 text-center sm:text-left z-10">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
                  ⚡
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-300 tracking-wider uppercase flex items-center justify-center sm:justify-start gap-1">
                    <span>✨ โควต้าตะกร้าครอบครัวคงเหลือ</span>
                    <span className="bg-amber-400 text-[#001a3a] px-2 py-0.5 rounded-full text-[10px] font-black">{familyRemaining} ครั้ง</span>
                  </div>
                  <div className="text-sm font-black text-white mt-0.5">
                    ดึงโควต้ามาเติมให้ <span className="text-sky-300">น้อง{child.nickname}</span> ได้ทันที
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTopUpHours(Math.min(2, familyRemaining));
                  setShowTopUpModal(true);
                }}
                className="w-full sm:w-auto bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-[#001a3a] px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-amber-400/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 border-2 border-white/90 z-10"
              >
                <span>⚡</span>
                <span>เติมชั่วโมงเรียนให้น้อง{child.nickname}</span>
              </button>
            </div>
          ) : (
            <div className="mt-3 pt-2.5 border-t border-sky-200 text-center text-[11px] text-slate-500 font-medium">
              💡 โควต้าในตะกร้าครอบครัวถูกใช้งานครบแล้ว ({totalAllocatedInFamily}/{parentPurchased} ครั้ง)
            </div>
          );
        })()}
      </div>

      {/* History & Usage Timeline Section (My Course Schedule Matrix) */}
      <div id="my-course-schedule" className="mb-6 font-['Anuphan',sans-serif] scroll-mt-6">
        <MyCourseWeeklyMatrix
          child={child}
          bookings={bookings}
          remaining={remaining}
          onBookMore={handleBookClick}
          onCancelBooking={handleCancelBooking}
        />
      </div>

      {/* Book Class Button */}
      {child.status === 'pending' ? (
        <button
          disabled
          className="btn-primary-orca opacity-65 cursor-not-allowed bg-slate-500 hover:bg-slate-500 border-slate-600"
        >
          🔒 รอ Admin อนุมัติคอร์ส
        </button>
      ) : remaining > 0 ? (
        <button
          onClick={handleBookClick}
          className="btn-primary-orca"
        >
          <div className="flex flex-col items-center justify-center leading-tight py-0.5">
            <span className="text-xl sm:text-2xl font-bold tracking-wide">Book Class</span>
            <span className="text-sm sm:text-base font-semibold opacity-95">(จองคลาสเรียน)</span>
          </div>
        </button>
      ) : familyRemaining > 0 ? (
        <button
          onClick={() => {
            setTopUpHours(Math.min(2, familyRemaining));
            setShowTopUpModal(true);
          }}
          className="btn-primary-orca bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-[#001a3a] border-2 border-white shadow-lg cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center leading-tight py-0.5">
            <span className="text-lg sm:text-xl font-black flex items-center gap-1.5">
              <span>⚡</span>
              <span>เติมชั่วโมงเรียนจากตะกร้าครอบครัว</span>
            </span>
            <span className="text-xs sm:text-sm font-bold opacity-90">
              (ตะกร้าครอบครัวมีโควต้าคงเหลือ {familyRemaining} ครั้ง - กดเพื่อเติมให้น้อง)
            </span>
          </div>
        </button>
      ) : (
        <button
          disabled
          className="btn-primary-orca opacity-65 cursor-not-allowed bg-slate-500 hover:bg-slate-500 border-slate-600"
        >
          ⚠️ จำนวนชั่วโมงเรียนหมดแล้ว (ติดต่อ Admin เพื่อเติมชั่วโมง)
        </button>
      )}

      {/* Top Up Hours Interactive Modal - Ultra Premium Glass Design */}
      {showTopUpModal && (() => {
        const totalAllocatedInFamily = familyChildren.reduce((sum, c) => sum + (c.total_hours || 0), 0);
        const familyRemaining = Math.max(0, parentPurchased - totalAllocatedInFamily);

        return (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn font-['Anuphan',sans-serif]">
            <div className="bg-white max-w-md w-full rounded-[32px] p-6 sm:p-7 shadow-2xl border-2 border-sky-300 relative overflow-hidden">
              {/* Header Gradient Stripe */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#001a3a] via-sky-600 to-emerald-500" />

              <div className="text-center mb-5 pt-2">
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-3 py-1 rounded-full shadow-2xs mb-2">
                  ✨ FAMILY BASKET TOP-UP
                </span>
                <h3 className="text-xl font-black text-[#001a3a] flex items-center justify-center gap-2">
                  <span>⚡ เติมชั่วโมงเรียนให้น้อง</span>
                  <span className="text-blue-700">{child.nickname}</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1">
                  เลือกจำนวนชั่วโมงที่ต้องการโอนจากตะกร้าครอบครัวมาเติมให้น้อง
                </p>
              </div>

              {/* Status Comparison Card */}
              <div className="bg-gradient-to-r from-sky-50 to-blue-50/80 p-4 rounded-2xl border border-sky-200 mb-5 shadow-2xs">
                <div className="grid grid-cols-2 gap-2 text-center text-xs font-extrabold">
                  <div className="bg-white p-2.5 rounded-xl border border-sky-100 shadow-2xs">
                    <div className="text-[10px] text-slate-500 font-normal mb-0.5">ชั่วโมงเดิมของน้อง</div>
                    <div className="text-slate-800 text-base font-black">{child.total_hours} ครั้ง</div>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl shadow-2xs">
                    <div className="text-[10px] text-emerald-800 font-normal mb-0.5">ตะกร้าครอบครัวคงเหลือ</div>
                    <div className="text-emerald-700 text-base font-black">{familyRemaining} ครั้ง</div>
                  </div>
                </div>
              </div>

              {/* Interactive Hour Selection Chips */}
              <div className="mb-6">
                <label className="block text-xs font-black text-[#001a3a] mb-2 flex items-center justify-between">
                  <span>เลือกจำนวนชั่วโมงที่ต้องการเติม:</span>
                  <span className="text-sky-700 font-bold text-[11px]">เลือกได้สูงสุด {familyRemaining} ครั้ง</span>
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: Math.min(6, familyRemaining) }).map((_, idx) => {
                    const val = idx + 1;
                    const isSelected = topUpHours === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setTopUpHours(val)}
                        className={`py-3 px-2 rounded-2xl font-black text-sm border-2 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? 'bg-[#001a3a] text-white border-[#001a3a] shadow-md scale-105'
                            : 'bg-slate-50 hover:bg-sky-50 text-slate-700 border-slate-200 hover:border-sky-300'
                        }`}
                      >
                        <span className="text-base font-black">+{val} ครั้ง</span>
                        <span className={`text-[10px] font-normal ${isSelected ? 'text-sky-200' : 'text-slate-500'}`}>
                          (รวมเป็น {child.total_hours + val} ครั้ง)
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary Result Banner */}
              <div className="mb-6 bg-sky-100/70 border border-sky-300 p-3 rounded-2xl text-center text-xs font-extrabold text-[#001a3a]">
                💡 หลังเติม: น้องจะมีชั่วโมงเรียนรวม <span className="text-blue-700 text-sm font-black">{child.total_hours + topUpHours} ครั้ง</span> (โควต้าครอบครัวเหลือ <span className="text-slate-700 font-bold">{familyRemaining - topUpHours} ครั้ง</span>)
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-2xl text-xs cursor-pointer border border-slate-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => handleTopUpFromFamilyBasket(topUpHours)}
                  className="w-2/3 py-3 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black rounded-2xl text-sm cursor-pointer shadow-lg shadow-emerald-500/25 border border-emerald-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>⚡</span>
                  <span>ยืนยันเติมชั่วโมงเรียน</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* My Course Schedule Modal */}
      {showMyCourseModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn font-['Anuphan',sans-serif]">
          <div className="bg-white max-w-4xl w-full rounded-3xl p-6 shadow-2xl border-2 border-sky-300 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <div>
                  <h3 className="text-lg font-black text-[#001a3a]">
                    My Course - ตารางเรียนน้อง{child.nickname}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal">
                    ตารางคลาสเรียนทั้งหมดที่จองไว้สำหรับ {child.full_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMyCourseModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold border-none bg-transparent cursor-pointer w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Timetable Matrix */}
            <MyCourseWeeklyMatrix
              child={child}
              bookings={bookings}
              remaining={remaining}
              onBookMore={() => {
                setShowMyCourseModal(false);
                handleBookClick();
              }}
              onCancelBooking={handleCancelBooking}
            />

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowMyCourseModal(false)}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-full cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MyCourseWeeklyMatrix({
  child,
  bookings,
  remaining,
  onBookMore,
  onClose,
  onCancelBooking
}: {
  child: Child;
  bookings: Booking[];
  remaining: number;
  onBookMore?: () => void;
  onClose?: () => void;
  onCancelBooking?: (id: string) => void;
}) {
  const days = [
    { key: 1, nameEn: 'Mon', nameTh: 'จันทร์' },
    { key: 2, nameEn: 'Tue', nameTh: 'อังคาร' },
    { key: 3, nameEn: 'Wed', nameTh: 'พุธ' },
    { key: 4, nameEn: 'Thu', nameTh: 'พฤหัส' },
    { key: 5, nameEn: 'Fri', nameTh: 'ศุกร์' },
    { key: 6, nameEn: 'Sat', nameTh: 'เสาร์' },
    { key: 0, nameEn: 'Sun', nameTh: 'อาทิตย์' },
  ];

  const timeSlots = [
    { label: '09:00\n10:30', slots: ['09:00-10:30', '09:00 10:30'] },
    { label: '10:30\n12:00', slots: ['10:30-12:00', '10:30 12:00'] },
    { label: '12:00\n13:30', slots: ['12:00-13:30', '12:00 13:00', '12:00 13:30'] },
    { label: '13:00\n14:30', slots: ['13:00-14:30', '13:00 14:30'] },
    { label: '14:30\n16:00', slots: ['14:30-16:00', '14:30 16:00'] },
    { label: '16:00\n17:00', slots: ['16:00-17:30', '16:00-17:00', '16:00 17:00'] },
    { label: '17:30\n19:30', slots: ['17:30-19:30', '17:30 19:30'] },
  ];

  const activeBookings = bookings.filter(b => b.status !== 'Cancelled');
  const avatarSrc = child.photo_url || (child.avatar === 'boy' ? '🧒🏼' : '👧🏻');

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = daysEn[d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, '0');
    const monthName = months[d.getMonth()];
    const year = d.getFullYear();
    return `${dayName}-${dayNum}-${monthName}-${year}`;
  };

  return (
    <div className="space-y-4 font-['Anuphan',sans-serif]">
      {/* Top Header Card */}
      <div className="bg-sky-50/90 border-2 border-sky-200 p-4 sm:p-5 rounded-3xl flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-sky-400 bg-white flex items-center justify-center text-3xl shadow-inner shrink-0">
            {typeof avatarSrc === 'string' && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:image')) ? (
              <img src={avatarSrc} alt={child.nickname} className="w-full h-full object-cover" />
            ) : (
              <span>{avatarSrc}</span>
            )}
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-[#001a3a]">
              น้อง {child.nickname} ({child.full_name})
            </div>
            <div className="mt-1 inline-flex items-center gap-1.5 bg-white border border-sky-300 text-sky-900 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
              <span>🛒</span>
              <span>
                <strong>{child.course_name || 'Orca Cubs'}</strong>: จองแล้ว{' '}
                <strong className="text-blue-700">{activeBookings.length}/{child.total_hours} ครั้ง</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onBookMore && (
            <button
              type="button"
              onClick={onBookMore}
              className="bg-[#001a3a] hover:bg-[#002244] text-white px-4 py-2 rounded-2xl font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-1.5 border border-blue-900"
            >
              <span>+</span>
              <span>จองคลาสเรียนเพิ่ม &gt;</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-100 text-[#001a3a] border border-slate-300 px-4 py-2 rounded-2xl font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>← ←</span>
              <span>ย้อนกลับ</span>
            </button>
          )}
        </div>
      </div>

      {/* Weekly Schedule Matrix Table */}
      <div className="bg-white border-2 border-[#001a3a] rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-xs text-center border-collapse">
            <thead>
              <tr className="bg-[#001a3a] text-white font-extrabold text-xs tracking-wide">
                <th className="p-3 border-b border-r border-[#002b55] w-28 bg-[#001a3a] text-center">
                  Day / Time
                </th>
                {timeSlots.map((col, idx) => (
                  <th key={idx} className="p-3 border-b border-r border-[#002b55] text-center whitespace-pre-line font-black">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.key} className="border-b border-[#001a3a]/30 hover:bg-sky-50/30 transition-colors">
                  {/* Day Label Column */}
                  <td className="p-3 border-r border-[#001a3a]/30 font-extrabold text-[#001a3a] bg-slate-50 text-center whitespace-nowrap">
                    {d.nameEn} ({d.nameTh})
                  </td>

                  {/* Time Slot Columns */}
                  {timeSlots.map((col, idx) => {
                    const cellBookings = activeBookings.filter((b) => {
                      if (!b.booking_date) return false;
                      const dateObj = new Date(b.booking_date);
                      if (isNaN(dateObj.getTime())) return false;
                      if (dateObj.getDay() !== d.key) return false;

                      const slotClean = (b.time_slot || '').replace(/\s+/g, '');
                      return col.slots.some(s => slotClean.includes(s.replace(/\s+/g, '')) || s.replace(/\s+/g, '').includes(slotClean));
                    });

                    return (
                      <td key={idx} className="p-2 border-r border-[#001a3a]/30 align-middle min-w-[95px] max-w-[125px] h-16">
                        {cellBookings.length === 0 ? (
                          <span className="text-slate-300 font-normal text-xs">-</span>
                        ) : (
                          <div className="space-y-1">
                            {cellBookings.map((b) => (
                              <div
                                key={b.id}
                                className="bg-sky-100/90 border border-sky-300 rounded-xl p-1.5 text-center text-xs relative shadow-2xs hover:shadow-xs transition-all"
                              >
                                <div className="flex items-center justify-between font-extrabold text-[#001a3a] text-[11px] leading-tight">
                                  <span className="truncate pr-1">{b.course_name || child.course_name}</span>
                                  {onCancelBooking && (
                                    <button
                                      type="button"
                                      onClick={() => onCancelBooking(b.id)}
                                      title="ยกเลิกการจอง"
                                      className="text-rose-600 hover:text-rose-800 font-black text-[11px] border-none bg-transparent cursor-pointer shrink-0 leading-none px-0.5"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-600 font-bold mt-1 flex items-center justify-center gap-0.5">
                                  <span>🗓️</span>
                                  <span className="truncate">{formatDateLabel(b.booking_date)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
