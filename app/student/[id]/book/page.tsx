'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';
import { Child, Booking } from '@/lib/types';

const COURSE_SCHEDULES: Record<string, { weekday: string[]; weekend: string[] }> = {
  'Orca Cubs': {
    weekday: ['10:30-12:00', '14:30-16:00', '16:00-17:30', '17:30-19:30'],
    weekend: ['09:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00']
  },
  'Mega Orca': {
    weekday: ['10:00-12:00', '17:30-19:30'],
    weekend: ['10:00-12:00', '14:00-16:00']
  }
};

const DEFAULT_SLOTS = ['10:00-12:00', '10:30-12:00', '14:30-16:00', '16:00-17:30', '17:30-19:30'];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

// Get Minimum Allowed Booking Date (Tomorrow = 1 day advance requirement)
function getMinParentBookingDate(): string {
  const target = new Date();
  target.setDate(target.getDate() + 1); // Cannot book today (at least 1 day in advance)
  return target.toISOString().split('T')[0];
}

export const runtime = 'edge';

export default function BookingCalendarPage() {
  const params = useParams();
  const router = useRouter();
  const childId = params?.id as string;

  const minParentDate = getMinParentBookingDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [child, setChild] = useState<Child | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(minParentDate);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date(minParentDate).getMonth());
  const [year, setYear] = useState<number>(new Date(minParentDate).getFullYear());
  const [dateBookings, setDateBookings] = useState<Booking[]>([]);
  const [quotas, setQuotas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [alertModalText, setAlertModalText] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!childId) return;
      const c = await store.getChildById(childId);
      if (!c || (c.total_hours - c.used_hours) <= 0) {
        showToast('⚠️ จำนวนชั่วโมงเรียนหมดแล้ว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง');
        router.push(`/student/${childId}`);
        return;
      }
      setChild(c);

      const b = await store.getBookings(undefined, selectedDate);
      setDateBookings(b);

      const q = await store.getSlotQuotas();
      setQuotas(q);
      setLoading(false);
    }
    init();
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

    if (selectedDate < minParentDate) {
      setAlertModalText(
        '⚠️ การจองคลาสเรียนผ่านระบบออนไลน์ต้องจองล่วงหน้าอย่างน้อย 1 วัน (ไม่สามารถจองคลาสของวันนี้หรือวันพรุ่งนี้ได้)\n\nหากต้องการจองคลาสเรียนฉุกเฉิน กรุณาติดต่อ Admin เท่านั้น'
      );
      return;
    }

    // ดึงข้อมูล fresh จาก DB เสมอ เพื่อป้องกัน stale cache
    const freshChild = await store.getChildById(child.id);
    if (!freshChild) {
      showToast('ไม่พบข้อมูลนักเรียน กรุณาลองใหม่อีกครั้ง');
      return;
    }

    // เช็คโควต้าระดับเด็กคนนี้
    // ป้องกันการจองคลาสซ้ำในวันและเวลาเดียวกัน
    const existingBookings = await store.getBookings(freshChild.id, selectedDate);
    const hasSameSlot = existingBookings.some(b => b.time_slot === selectedSlot && b.status !== 'cancelled' && b.status !== 'Cancelled');
    
    if (hasSameSlot) {
      setAlertModalText('⚠️ น้องจองคลาสในรอบเวลานี้ไปแล้วค่ะ ไม่สามารถจองซ้ำได้');
      return;
    }

    const remaining = freshChild.total_hours - freshChild.used_hours;
    if (remaining <= 0) {
      showToast('⚠️ ชั่วโมงเรียนของน้องหมดแล้ว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง');
      return;
    }

    // เช็คโควต้าระดับตะกร้าครอบครัว (Family Basket)
    const currentUser = store.getCurrentUser();
    if (currentUser) {
      const familyChildren = await store.getChildren(currentUser.id);
      const familyTotalUsed = familyChildren.reduce((sum, c) => sum + (c.used_hours || 0), 0);
      const parentPurchased = currentUser.purchased_hours || 6;
      if (familyTotalUsed >= parentPurchased) {
        showToast(`⚠️ จำนวนคลาสที่ซื้อไว้ (${parentPurchased} ครั้ง) ถูกใช้ครบแล้วทุกคนในครอบครัว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง`);
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

    await store.saveBooking(newBooking);
    const newUsed = freshChild.used_hours + 1;
    await store.updateChild(freshChild.id, { used_hours: newUsed });

    showToast(`✅ จองคลาสเรียน ${selectedDate} (${selectedSlot}) สำเร็จเรียบร้อยแล้ว! (อนุมัติทันที ไม่ต้องรอแอดมินอนุมัติ)`);
    router.push(`/student/${freshChild.id}`);
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
  const availableSlots = isMonday
    ? []
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
            const isTooEarly = dStr < minParentDate;

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
            {isWeekend ? '📅 รอบวันเสาร์ - อาทิตย์' : '📅 รอบวันอังคาร - ศุกร์'}
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
                ?? 10;
              const currentBookedCount = dateBookings.filter(b => b.time_slot === slot && b.status !== 'Cancelled').length;
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
        disabled={isMonday || !selectedSlot}
        className={`w-full py-3.5 bg-[#001a3a] hover:bg-[#002244] text-white font-bold text-base rounded-full shadow-md transition-all cursor-pointer mb-8 ${
          isMonday || !selectedSlot ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex flex-col items-center justify-center leading-tight">
          <span className="text-base sm:text-lg font-bold">Book Class</span>
          <span className="text-xs sm:text-sm font-semibold opacity-90">(ยืนยันการจองคลาส)</span>
        </div>
      </button>

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
                    <span className="text-emerald-700 font-extrabold">{b.booking_date}</span> | <span className="text-slate-800">{b.time_slot}</span>
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

