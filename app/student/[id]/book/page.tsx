'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { store, setupRealtimeSubscriptions } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { Child, Booking } from '@/lib/types';

const COURSE_SCHEDULES: Record<string, { weekday: string[]; weekend: string[] }> = {
  'Orca Cubs': {
    weekday: ['10.30-12.00', '14.30-16.00', '16.00-17.30', '17.30-19.30'],
    weekend: ['09.00-10.30', '10.30-12.00', '13.00-14.30', '14.30-16.00']
  },
  'Mega Orca': {
    weekday: ['10:00-12:00', '17.30-19.30'],
    weekend: ['10:00-12:00', '14:00-16:00']
  }
};

const DEFAULT_SLOTS = ['10:00-12:00', '10.30-12.00', '14.30-16.00', '16.00-17.30', '17.30-19.30'];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// Get Minimum Allowed Booking Date (Tomorrow = 1 day advance requirement)
function getMinParentBookingDate(): string {
  const target = new Date();
  target.setDate(target.getDate() + 1); // Cannot book today (at least 1 day in advance)
  return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
}

export const runtime = 'edge';

export default function BookingCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const childId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const requestRef = useRef(0);
  const minParentDate = getMinParentBookingDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const resolvedChildId = decodeURIComponent(childId || '').trim();
  const isAdmin = typeof window !== 'undefined' ? store.getCurrentUser()?.role === 'admin' : false;

  const [child, setChild] = useState<Child | null>(() => {
    if (typeof window === 'undefined') return null;
    const all = store.getChildrenSync();
    return all.find(c => c.id === resolvedChildId) || null;
  });
  const [selectedDate, setSelectedDate] = useState<string>(minParentDate);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date(minParentDate).getMonth());
  const [year, setYear] = useState<number>(new Date(minParentDate).getFullYear());
  const [dateBookings, setDateBookings] = useState<Booking[]>([]);
  const [quotas, setQuotas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [alertModalText, setAlertModalText] = useState<string | null>(null);
  const [successModalText, setSuccessModalText] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coursesListGlobal, setCoursesListGlobal] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!resolvedChildId) return;
      const reqId = ++requestRef.current;
      
      // 1. SWR Instant Load
      const allChildrenSync = store.getChildrenSync();
      let cSync = allChildrenSync.find(x => x.id === resolvedChildId);
      if (cSync) {
        if ((cSync.total_hours - cSync.used_hours) <= 0) {
          showToast('⚠️ จำนวนชั่วโมงเรียนหมดแล้ว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง');
          router.push(`/student/${resolvedChildId}`);
          return;
        }
        setChild(cSync);
      }
      setDateBookings(store.getBookingsSync().filter(b => b.booking_date === selectedDate));
      setQuotas(store.getSlotQuotasSync());
      setLoading(false);

      // 2. Background Fetch
      const [allC, b, q, crs] = await Promise.all([
        store.getChildren(),
        store.getBookings(undefined, selectedDate),
        store.getSlotQuotas(),
        store.getCourses()
      ]);
      
      if (reqId !== requestRef.current) return;
      
      setCoursesListGlobal(crs || []);
      let c = allC.find(x => x.id === resolvedChildId);
      if (c) {
        if ((c.total_hours - c.used_hours) <= 0) {
          showToast('⚠️ จำนวนชั่วโมงเรียนหมดแล้ว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง');
          router.push(`/student/${resolvedChildId}`);
          return;
        }
        setChild(c);
      }
      setDateBookings(b);
      setQuotas(q);
    }
    loadData();

    const cleanupRealtime = setupRealtimeSubscriptions(() => loadData());
    return () => { if (cleanupRealtime) cleanupRealtime(); };
  }, [childId, selectedDate, router]);

  const changeMonth = (delta: number) => {
    let newM = month + delta;
    let newY = year;
    if (newM < 0) { newM = 11; newY--; }
    if (newM > 11) { newM = 0; newY++; }
    setMonth(newM);
    setYear(newY);
  };

  const handleConfirmBooking = async () => {
    if (!child || !selectedSlot) {
      showToast('กรุณาเลือกรอบเวลาที่ต้องการเข้าเรียน');
      return;
    }

    if (!isAdmin && selectedDate < minParentDate) {
      setAlertModalText(
        '⚠️ การจองคลาสเรียนผ่านระบบออนไลน์ต้องจองล่วงหน้าอย่างน้อย 1 วัน (ไม่สามารถจองคลาสของวันนี้หรือวันพรุ่งนี้ได้)\n\nหากต้องการจองคลาสเรียนฉุกเฉิน กรุณาติดต่อ Admin เท่านั้น'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = store.getCurrentUser();
      
      // Parallel fetch to make it super fast (0.5s instead of 4-5s)
      const [freshChild, existingBookings, familyChildren] = await Promise.all([
        store.getChildById(child.id),
        store.getBookings(child.id, selectedDate),
        currentUser ? store.getChildren(currentUser.id) : Promise.resolve([])
      ]);

      if (!freshChild) {
        setAlertModalText('ไม่พบข้อมูลนักเรียน กรุณาลองใหม่อีกครั้ง');
        setIsSubmitting(false);
        return;
      }

      // Check if already booked on the same day (any slot)
      const hasSameDay = existingBookings.some(b => b.status !== 'cancelled' && b.status !== 'Cancelled');
      
      if (hasSameDay) {
        setAlertModalText('⚠️ น้องมีคลาสเรียนในวันนี้แล้วค่ะ (สงวนสิทธิ์จองได้สูงสุด 1 คลาสต่อวัน)');
        setIsSubmitting(false);
        return;
      }

      // Check Real-time Quota against all bookings for this slot
      const allSlotBookings = await store.getBookings(); // We need all bookings to check class capacity
      // Fetch the actual max_capacity from the course config
      const matchedCourse = coursesListGlobal.find((c: any) => 
        c.display_title?.toLowerCase().includes(freshChild.course_name?.toLowerCase() || 'cubs') ||
        c.internal_name?.toLowerCase().includes(freshChild.course_name?.toLowerCase() || 'cubs')
      );
      const defaultCourseCapacity = matchedCourse?.max_capacity || 10;

      const currentBookedCount = allSlotBookings.filter(b => b.booking_date === selectedDate && (b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.') === (selectedSlot || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.') && b.status !== 'Cancelled' && b.status !== 'cancelled').length;
      
      const courseKeyName = freshChild.course_name?.includes('Mega') ? 'Mega Orca' : 'Orca Cubs';
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDayName = dayNames[new Date(selectedDate).getDay()];
      const customQuota = quotas[`${selectedDate}_${freshChild.course_name}_${selectedSlot}`]
        ?? quotas[`${selectedDate}_${courseKeyName}_${selectedSlot}`]
        ?? quotas[`${currentDayName}_${freshChild.course_name}_${selectedSlot}`]
        ?? quotas[`${currentDayName}_${courseKeyName}_${selectedSlot}`]
        ?? quotas[`${currentDayName}_${selectedSlot}`]
        ?? quotas[`Everyday_${freshChild.course_name}_${selectedSlot}`]
        ?? quotas[`Everyday_${courseKeyName}_${selectedSlot}`]
        ?? quotas[`Everyday_${selectedSlot}`]
        ?? quotas[`${freshChild.course_name}_${selectedSlot}`]
        ?? quotas[`${courseKeyName}_${selectedSlot}`]
        ?? quotas[`${selectedDate}_${selectedSlot}`]
        ?? defaultCourseCapacity;
        
      if (currentBookedCount >= customQuota) {
        setAlertModalText(`🔒 ขออภัยค่ะ รอบเวลา ${selectedSlot} เพิ่งถูกจองเต็มไปเมื่อสักครู่ (${customQuota}/${customQuota} คน) กรุณาเลือกรอบเวลาอื่น`);
        setIsSubmitting(false);
        // Refresh the page data so UI updates the full slot
        store.getBookings().then(b => setDateBookings(b.filter(bk => bk.booking_date === selectedDate)));
        return;
      }

      const remaining = freshChild.total_hours - freshChild.used_hours;
      if (remaining <= 0) {
        setAlertModalText('⚠️ ชั่วโมงเรียนของน้องหมดแล้ว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง');
        setIsSubmitting(false);
        return;
      }

      if (currentUser) {
        const familyTotalUsed = familyChildren.reduce((sum, c) => sum + (c.used_hours || 0), 0);
        const parentPurchased = currentUser.purchased_hours || 6;
        if (familyTotalUsed >= parentPurchased) {
          setAlertModalText(`⚠️ จำนวนคลาสที่ซื้อไว้ (${parentPurchased} ครั้ง) ถูกใช้ครบแล้วทุกคนในครอบครัว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง`);
          setIsSubmitting(false);
          return;
        }
      }

      const newBooking: Booking = {
        id: 'b_' + Date.now(),
        child_id: freshChild.id,
        child_nickname: freshChild.nickname,
        child_full_name: freshChild.full_name,
        course_name: freshChild.course_name || 'Orca Cubs',
        booking_date: selectedDate,
        time_slot: selectedSlot,
        status: 'confirmed',
        booked_by_role: 'parent'
      };

      // Run these in parallel to save another 0.5s
      await Promise.all([
        store.saveBooking(newBooking),
        store.updateChild(freshChild.id, { used_hours: freshChild.used_hours + 1 })
      ]);

      setSuccessModalText(`จองคลาสเรียน ${selectedDate} (รอบ ${selectedSlot}) สำเร็จเรียบร้อยแล้ว!`);
    } catch (error) {
      console.error(error);
      setAlertModalText('เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !child) {
    return (
    <div className="font-sans animate-pulse p-4 max-w-[1200px] mx-auto space-y-6">
      <div className="bg-slate-200 h-12 w-64 rounded-xl"></div>
      <div className="bg-slate-200 h-48 w-full rounded-3xl"></div>
      <div className="bg-slate-200 h-[400px] w-full rounded-3xl"></div>
    </div>
  );
  }

  // Determine Available Slots for selected course & day
  const courseKey = child.course_name?.includes('Mega') ? 'Mega Orca' : 'Orca Cubs';
  const selDateObj = new Date(selectedDate);
  const dayOfWeek = selDateObj.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const isMonday = dayOfWeek === 1;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const scheduleConfig = COURSE_SCHEDULES[courseKey] || COURSE_SCHEDULES['Orca Cubs'];
  
  // Use dynamic schedule from ORCA CLASSES & PRICING if available
  const activeCourse = coursesListGlobal.find((c: any) => 
    c.display_title?.toLowerCase().includes(child.course_name?.toLowerCase() || 'cubs') ||
    c.internal_name?.toLowerCase().includes(child.course_name?.toLowerCase() || 'cubs')
  );

  let customSlots: string[] = [];
  let useCustom = false;
  
  if (activeCourse && activeCourse.schedule_groups && activeCourse.schedule_groups.length > 0) {
    useCustom = true;
    activeCourse.schedule_groups.forEach((g: any) => {
      if (!g.day_label || !g.time_slots) return;
      const lbl = g.day_label.toLowerCase();
      let isMatch = false;
      
      if (lbl.includes('everyday')) isMatch = true;
      else if (lbl.includes('weekend') && (dayOfWeek === 0 || dayOfWeek === 6)) isMatch = true;
      else if (lbl.includes('weekday') && dayOfWeek >= 1 && dayOfWeek <= 5) isMatch = true;
      else {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const shortDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        let matchFound = false;
        
        const parts = lbl.split('-').map((s: string) => s.trim());
        if (parts.length === 2) {
          const startIdx = days.findIndex(d => parts[0].includes(d)) !== -1 
            ? days.findIndex(d => parts[0].includes(d))
            : shortDays.findIndex(d => parts[0].includes(d));
            
          const endIdx = days.findIndex(d => parts[1].includes(d)) !== -1
            ? days.findIndex(d => parts[1].includes(d))
            : shortDays.findIndex(d => parts[1].includes(d));
            
          if (startIdx !== -1 && endIdx !== -1) {
            matchFound = true;
            let curr = startIdx;
            while (true) {
              if (dayOfWeek === curr) { isMatch = true; break; }
              if (curr === endIdx) break;
              curr = (curr + 1) % 7;
            }
          }
        }
        
        if (!matchFound) {
          if (days[dayOfWeek] && lbl.includes(days[dayOfWeek])) isMatch = true;
          if (shortDays[dayOfWeek] && lbl.includes(shortDays[dayOfWeek])) isMatch = true;
        }
      }
      
      if (isMatch) {
        customSlots.push(...g.time_slots);
      }
    });
  }

  customSlots = Array.from(new Set(customSlots)).sort((a, b) => a.localeCompare(b));

  const availableSlots = isMonday
    ? []
    : (useCustom && customSlots.length > 0)
    ? customSlots
    : isWeekend
    ? scheduleConfig.weekend
    : scheduleConfig.weekday;

  // Calendar render math
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  return (
    <div className="font-['Anuphan',sans-serif]">
      <div className="mb-4">
        <BackButton />
      </div>

      <div className="text-center mb-4">
        <h2 className="text-2xl font-black text-[#001a3a] mb-1">น้อง {child.nickname}</h2>
        <div className="text-sm text-slate-500 font-medium">
          คลาส: <strong className="text-sky-700">{child.course_name}</strong> | เลือกว่าที่และรอบเวลาที่ต้องการเข้าเรียน
        </div>
      </div>

      {/* Advance Booking Rule Notice Banner */}
      <div className="mb-4 bg-amber-50 border border-amber-300 p-3.5 rounded-2xl text-amber-900 text-xs font-bold flex items-center gap-2 shadow-2xs">
        <span className="text-base">📅</span>
        <span>
          <strong>เงื่อนไขการจอง:</strong> ต้องทำการจองล่วงหน้าอย่างน้อย 1 วัน (จองได้ตั้งแต่วันที่ {minParentDate} เป็นต้นไป)
        </span>
      </div>

      {/* Calendar Widget */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-5 shadow-xs">
        <div className="text-lg font-bold text-[#001a3a] mb-3.5 flex justify-between items-center">
          <button type="button" onClick={() => changeMonth(-1)} className="bg-[#001a3a] text-white px-3 py-1.5 rounded-xl text-sm font-bold cursor-pointer">◀</button>
          <span>{MONTH_NAMES[month]} {year}</span>
          <button type="button" onClick={() => changeMonth(1)} className="bg-[#001a3a] text-white px-3 py-1.5 rounded-xl text-sm font-bold cursor-pointer">▶</button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          <div className="text-xs font-bold text-rose-600 pb-1">Su</div>
          <div className="text-xs font-bold text-sky-600 pb-1">Mo</div>
          <div className="text-xs font-bold text-sky-600 pb-1">Tu</div>
          <div className="text-xs font-bold text-sky-600 pb-1">We</div>
          <div className="text-xs font-bold text-sky-600 pb-1">Th</div>
          <div className="text-xs font-bold text-sky-600 pb-1">Fr</div>
          <div className="text-xs font-bold text-sky-600 pb-1">Sa</div>

          {Array.from({ length: firstDayIndex }).map((_, idx) => (
            <div key={`empty-${idx}`} />
          ))}

          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = dStr === selectedDate;
            const isTooEarly = !isAdmin && dStr < minParentDate;

            return (
              <button
                key={dStr}
                type="button"
                onClick={() => {
                  if (isTooEarly) {
                    setAlertModalText(
                      '⚠️ การจองคลาสเรียนผ่านระบบออนไลน์ต้องจองล่วงหน้าอย่างน้อย 1 วัน (ไม่สามารถจองคลาสของวันนี้หรือวันพรุ่งนี้ได้)\n\nหากต้องการจองคลาสเรียนฉุกเฉิน กรุณาติดต่อ Admin เท่านั้น'
                    );
                    return;
                  }
                  const clickDay = new Date(dStr).getDay();
                  if (clickDay === 1) {
                    setAlertModalText(`❌ คลาส ${child.course_name} ไม่เปิดสอนในวันจันทร์ (Monday) - กรุณาเลือกวันอื่น`);
                  }
                  setSelectedDate(dStr);
                  setSelectedSlot(null);
                }}
                className={`py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                  isTooEarly
                    ? 'opacity-30 bg-slate-100 text-slate-400'
                    : isSelected
                    ? 'bg-[#001a3a] text-white font-extrabold shadow-md'
                    : 'text-slate-700 hover:bg-sky-50'
                }`}
              >
                {dayNum}
              </button>
            );
          })}
        </div>
      </div>

      {/* Monday Closed Day Alert */}
      {isMonday && (
        <div className="mb-4 bg-rose-50 border-2 border-rose-300 p-4 rounded-2xl text-rose-700 text-xs font-bold flex items-center gap-2">
          <span>❌</span>
          <span>คลาส {child.course_name} ไม่เปิดสอนในวันจันทร์ (Monday) - กรุณาเลือกวันอื่น</span>
        </div>
      )}

      {/* Time Slots Selector */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2.5">
          <label className="block text-base font-bold text-[#001a3a]">
            ClassTime (เลือกรอบเวลาเรียนคลาส {child.course_name}):
          </label>
          <span className="text-xs text-sky-800 font-bold bg-sky-100 px-3 py-1 rounded-full">
            📅 รอบ{['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'][new Date(selectedDate).getDay()]}
          </span>
        </div>

        {isMonday ? (
          <div className="text-center py-8 text-slate-400 font-bold bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            -- คลาสนี้ไม่เปิดสอนในวันจันทร์ (Monday) --
          </div>
        ) : (
          <div className="space-y-2.5">
            {availableSlots.map((slot) => {
              const courseKeyName = child.course_name?.includes('Mega') ? 'Mega Orca' : 'Orca Cubs';
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const currentDayName = dayNames[new Date(selectedDate).getDay()];
              const matchedCourse = coursesListGlobal.find((c: any) => 
                c.display_title?.toLowerCase().includes(child.course_name?.toLowerCase() || 'cubs') ||
                c.internal_name?.toLowerCase().includes(child.course_name?.toLowerCase() || 'cubs')
              );
              const defaultCourseCapacity = matchedCourse?.max_capacity || 10;
              const customQuota = quotas[`${selectedDate}_${child.course_name}_${slot}`]
                ?? quotas[`${selectedDate}_${courseKeyName}_${slot}`]
                ?? quotas[`${currentDayName}_${child.course_name}_${slot}`]
                ?? quotas[`${currentDayName}_${courseKeyName}_${slot}`]
                ?? quotas[`${currentDayName}_${slot}`]
                ?? quotas[`Everyday_${child.course_name}_${slot}`]
                ?? quotas[`Everyday_${courseKeyName}_${slot}`]
                ?? quotas[`Everyday_${slot}`]
                ?? quotas[`${child.course_name}_${slot}`]
                ?? quotas[`${courseKeyName}_${slot}`]
                ?? quotas[`${selectedDate}_${slot}`]
                ?? defaultCourseCapacity;
              const currentBookedCount = dateBookings.filter(b => (b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.') === (slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.') && b.status !== 'Cancelled').length;
              const isFull = currentBookedCount >= customQuota;
              const isSelected = selectedSlot === slot;

              return (
                <div
                  key={slot}
                  onClick={() => {
                    if (isFull) {
                      setAlertModalText(`🔒 รอบเวลา ${slot} ที่นั่งเต็มแล้ว (${customQuota}/${customQuota} คน) กรุณาเลือกรอบเวลาอื่น`);
                      return;
                    }
                    setSelectedSlot(slot);
                  }}
                  className={`flex justify-between items-center p-3.5 border-2 rounded-2xl cursor-pointer transition-all ${
                    isFull
                      ? 'bg-rose-50 border-rose-200 opacity-70 cursor-not-allowed'
                      : isSelected
                      ? 'border-[#001a3a] bg-sky-50 shadow-sm'
                      : 'border-slate-300 hover:border-sky-400'
                  }`}
                >
                  <span className="font-bold text-[#001a3a] text-sm sm:text-base">{slot}</span>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      isFull
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {isFull ? '🔒 Full (เต็มแล้ว)' : `ว่าง ${customQuota - currentBookedCount}/${customQuota} ที่นั่ง`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirm Booking Button */}
      <button
        type="button"
        onClick={handleConfirmBooking}
        disabled={isMonday || !selectedSlot || isSubmitting}
        className={`w-full py-3.5 sm:py-4 rounded-full transition-all duration-300 shadow-xl border-none cursor-pointer mb-8 ${
          isMonday || !selectedSlot || isSubmitting
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed scale-[0.98]'
            : 'bg-[#001a3a] hover:bg-[#002244] text-white hover:scale-[1.02]'
        }`}
      >
        <div className="flex flex-col items-center justify-center leading-tight">
          <span className="text-base sm:text-lg font-bold">{isSubmitting ? 'กำลังจอง...' : 'Book Class'}</span>
          <span className="text-xs sm:text-sm font-semibold opacity-90">(ยืนยันการจองคลาส)</span>
        </div>
      </button>

      {/* Pop-up Success Modal */}
      {successModalText && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl text-center border border-emerald-200 animate-scale-up">
            <div className="text-5xl mb-4 text-emerald-500">✅</div>
            <h3 className="text-xl font-black text-emerald-700 mb-3">จองคลาสสำเร็จ!</h3>
            <p className="text-sm text-slate-700 leading-relaxed mb-6 font-bold whitespace-pre-line">
              {successModalText}
            </p>
            <button
              type="button"
              onClick={() => {
                setSuccessModalText(null);
                router.push(`/student/${child.id}`);
              }}
              className="w-full py-3.5 bg-emerald-500 text-white rounded-2xl font-bold text-sm cursor-pointer shadow-md hover:bg-emerald-600 transition-colors"
            >
              กลับสู่หน้าโปรไฟล์
            </button>
          </div>
        </div>
      )}

      {/* Pop-up Alert Modal */}
      {alertModalText && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl text-center border border-slate-200">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-[#001a3a] mb-3">แจ้งเตือนระบบจองคลาส</h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-6 font-normal whitespace-pre-line">
              {alertModalText}
            </p>
            <button
              type="button"
              onClick={() => setAlertModalText(null)}
              className="w-full py-3 bg-[#001a3a] text-white rounded-full font-bold text-sm cursor-pointer shadow-md hover:bg-[#002244]"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      {/* History & Status Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
        <h3 className="text-base font-bold text-[#001a3a] mb-3 flex items-center justify-between">
          <span>📜 ประวัติการจองในวันที่เลือก ({selectedDate})</span>
          <span className="text-xs text-slate-400 font-normal">(การยกเลิกต้องทำล่วงหน้า)</span>
        </h3>

        {dateBookings.filter(b => b.child_id === child.id).length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-normal">
            ยังไม่มีประวัติการจองเรียนของน้อง {child.nickname} ในวันที่ {selectedDate}
          </div>
        ) : (
          <div className="space-y-2">
            {dateBookings
              .filter(b => b.child_id === child.id)
              .map((b) => (
                <div key={b.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold">
                  <div>
                    <span className="text-emerald-700 font-extrabold">{b.booking_date}</span> | <span className="text-slate-800">{(b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.')}</span>
                    <div className="text-slate-500 font-normal">{b.course_name} {b.booked_by_role === 'admin' && '(Admin จองให้)'}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === 'Cancelled' ? (
                      <span className="text-slate-400 font-bold bg-slate-200 px-2.5 py-1 rounded-lg">Cancelled</span>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('คุณต้องการยกเลิกวันและเวลาเรียนรอบนี้ใช่หรือไม่?')) {
                            await store.cancelBooking(b.id);
                            const updatedUsed = Math.max(0, child.used_hours - 1);
                            await store.updateChild(child.id, { used_hours: updatedUsed });
                            showToast('ยกเลิกรายการจองเรียบร้อยแล้ว');
                            const freshB = await store.getBookings(undefined, selectedDate);
                            setDateBookings(freshB);
                          }
                        }}
                        className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer border-none shadow-2xs"
                      >
                        ยกเลิกจอง
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

