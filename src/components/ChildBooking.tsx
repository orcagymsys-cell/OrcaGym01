'use client';

import { useState } from 'react';
import { Child, GymClass, Schedule, Booking, User, toISODateString, isSameTimeSlot } from '@/lib/types';
import { getLiveSlotCapacities } from '@/app/actions/booking';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Image from 'next/image';

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts.map(Number);
  const dateObj = new Date(y, m - 1, d);
  if (isNaN(dateObj.getTime())) return dateStr;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const dayName = dayNames[dateObj.getDay()];
  const monthName = monthNames[dateObj.getMonth()];
  const dayNum = String(d).padStart(2, '0');

  return `${dayName}-${dayNum}-${monthName}-${y}`;
}

function parseDaysFromLabel(label?: string): string[] {
  if (!label) return [];
  const str = label.toLowerCase().replace(/\s+/g, '');

  const dayMap: { [key: string]: number } = {
    'mon': 1, 'monday': 1, 'จันทร์': 1,
    'tue': 2, 'tuesday': 2, 'อังคาร': 2,
    'wed': 3, 'wednesday': 3, 'พุธ': 3,
    'thu': 4, 'thursday': 4, 'พฤหัส': 4, 'พฤหัสบดี': 4,
    'fri': 5, 'friday': 5, 'ศุกร์': 5,
    'sat': 6, 'saturday': 6, 'เสาร์': 6,
    'sun': 0, 'sunday': 0, 'อาทิตย์': 0
  };

  const dayCodes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  if (str.includes('ทุกวัน') || str.includes('everyday') || str.includes('daily')) {
    return ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  }

  const rangeMatch = str.match(/([a-zก-๙]+)(?:-|to|ถึง)+([a-zก-๙]+)/);
  if (rangeMatch) {
    const startStr = rangeMatch[1];
    const endStr = rangeMatch[2];

    let startIdx = -1;
    let endIdx = -1;

    Object.keys(dayMap).forEach(k => {
      if (startStr.includes(k) && startIdx === -1) startIdx = dayMap[k];
      if (endStr.includes(k) && endIdx === -1) endIdx = dayMap[k];
    });

    if (startIdx !== -1 && endIdx !== -1) {
      const active: string[] = [];
      let curr = startIdx;
      while (true) {
        active.push(dayCodes[curr]);
        if (curr === endIdx) break;
        curr = (curr + 1) % 7;
      }
      return active;
    }
  }

  const activeDays: string[] = [];
  if (str.includes('mon') || str.includes('จันทร์')) activeDays.push('MON');
  if (str.includes('tue') || str.includes('อังคาร')) activeDays.push('TUE');
  if (str.includes('wed') || str.includes('พุธ')) activeDays.push('WED');
  if (str.includes('thu') || str.includes('พฤหัส')) activeDays.push('THU');
  if (str.includes('fri') || str.includes('ศุกร์')) activeDays.push('FRI');
  if (str.includes('sat') || str.includes('เสาร์')) activeDays.push('SAT');
  if (str.includes('sun') || str.includes('อาทิตย์')) activeDays.push('SUN');

  return Array.from(new Set(activeDays));
}

function parseDaysFromTag(tag?: string): string[] {
  return parseDaysFromLabel(tag);
}

function parseTimeMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const normalized = timeStr.replace(/\./g, ':').trim();
  const [hours, minutes] = normalized.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

function sortTimeSlots(slots: string[]): string[] {
  return [...slots].sort((a, b) => {
    const [startA, endA] = a.split('-').map(parseTimeMinutes);
    const [startB, endB] = b.split('-').map(parseTimeMinutes);

    if (startA !== startB) {
      return startA - startB;
    }
    return (endA || 0) - (endB || 0);
  });
}

function getTomorrowDateString(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const dd = String(tomorrow.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function calculateAgeTH(dobString?: string): string {
  if (!dobString) return '';
  const [y, m, d] = dobString.split('-').map(Number);
  if (!y || !m || !d) return '';

  const today = new Date();
  let years = today.getFullYear() - y;
  let months = today.getMonth() + 1 - m;
  let days = today.getDate() - d;

  if (days < 0) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years <= 0 && months <= 0) return 'อายุ น้อยกว่า 1 เดือน';

  let ageParts: string[] = [];
  if (years > 0) ageParts.push(`${years} ขวบ`);
  if (months > 0) ageParts.push(`${months} เดือน`);

  return `อายุ ${ageParts.join(' ')}`;
}

export default function ChildBooking({ 
  child, 
  schedules, 
  classes, 
  history,
  allBookings,
  parentUser
}: { 
  child: Child; 
  schedules: Schedule[]; 
  classes: GymClass[];
  history: (Booking & { schedule: Schedule, gymClass: GymClass })[];
  allBookings?: Booking[];
  parentUser?: User | null;
}) {
  const purchasedCourses = parentUser?.courses_purchased || [];
  const availableClasses = purchasedCourses.length > 0
    ? classes.filter(c => purchasedCourses.some(cp => cp.class_id === c.id))
    : classes;

  const initialCourseId = (child as any).assigned_course_id || availableClasses[0]?.id || classes[0]?.id || '';
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [liveBookings, setLiveBookings] = useState<Booking[] | null>(null);
  const router = useRouter();

  const refreshLiveCapacities = async (dateStr?: string) => {
    const targetDate = dateStr || selectedDate;
    if (!targetDate || !selectedCourseId) return;
    try {
      const res = await getLiveSlotCapacities(targetDate, selectedCourseId);
      if (res.success && res.bookings) {
        setLiveBookings(res.bookings);
      }
    } catch (err) {
      console.error("Live capacity refresh error:", err);
    }
  };

  const selectedCourse = classes.find(c => c.id === selectedCourseId) || classes[0];

  // Derive available time slots and day status for selected course and date
  const getSlotInfo = () => {
    if (!selectedDate || !selectedCourse) {
      return { slots: [], dayName: '', isDayOpen: true };
    }

    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);

    const dayCodes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayNamesTH = ['วันอาทิตย์ (Sunday)', 'วันจันทร์ (Monday)', 'วันอังคาร (Tuesday)', 'วันพุธ (Wednesday)', 'วันพฤหัสบดี (Thursday)', 'วันศุกร์ (Friday)', 'วันเสาร์ (Saturday)'];
    
    const dayIndex = d.getDay();
    const dayCode = dayCodes[dayIndex];
    const dayNameStr = dayNamesTH[dayIndex];

    const slots: string[] = [];

    if (selectedCourse.scheduleGrid && selectedCourse.scheduleGrid.length > 0) {
      selectedCourse.scheduleGrid.forEach(row => {
        const dayGroupDays = parseDaysFromLabel(row.label);

        row.slots?.forEach((slot, sIdx) => {
          if (!slot || slot.trim() === '') return;

          const activeDays = new Set<string>(dayGroupDays);

          if (row.tag && (row.tagIndex === sIdx || row.tagIndex === sIdx + 1)) {
            const tagDays = parseDaysFromTag(row.tag);
            tagDays.forEach(td => activeDays.add(td));
          }

          if (activeDays.has(dayCode)) {
            slots.push(slot);
          }
        });
      });
    } else {
      // Fallback only if scheduleGrid is undefined or empty
      const courseSchedules = schedules.filter(s => s.class_id === selectedCourse.id && s.day_of_week === dayCode);
      courseSchedules.forEach(s => {
        slots.push(`${s.start_time}-${s.end_time}`);
      });
    }

    const uniqueSlots = sortTimeSlots(Array.from(new Set(slots)));
    return {
      slots: uniqueSlots,
      dayName: dayNameStr,
      isDayOpen: uniqueSlots.length > 0
    };
  };

  const { slots: availableSlots, dayName, isDayOpen } = getSlotInfo();

  const handleBook = async () => {
    if (!selectedDate || !selectedTime) {
      setError('กรุณาเลือกวันที่และรอบเวลาเรียน');
      return;
    }

    if (!isDayOpen) {
      setError(`คลาสเรียนนี้ไม่เปิดสอนในวันดังกล่าว (${dayName})`);
      return;
    }

    // 1-Day Advance Constraint Check
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [y, m, d] = selectedDate.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      setError('การจองคลาสเรียนต้องทำล่วงหน้าอย่างน้อย 1 วัน');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const targetISODate = toISODateString(selectedDate);
      const { data: gymClass } = await supabase.from('classes').select('*').eq('id', selectedCourse.id).single();
      if (!gymClass) { throw new Error('Invalid class'); }

      const { data: parentUser } = await supabase.from('users').select('*').eq('id', child.parent_id).single();
      if (!parentUser) { throw new Error('Parent not found'); }

      let familyCourse = parentUser.courses_purchased?.find((cp: any) => cp.class_id === selectedCourse.id);
      if (!familyCourse || familyCourse.remaining_classes <= 0) {
        throw new Error(`ชั่วโมงเรียนคลาส ${gymClass.title || gymClass.name} ในตะกร้าครอบครัวหมดแล้ว`);
      }

      const { data: existingChildBookings } = await supabase.from('bookings').select('*').eq('child_id', child.id).neq('status', 'cancelled');
      const childCollision = existingChildBookings?.some(b => toISODateString(b.date) === targetISODate && isSameTimeSlot(b.time_slot || b.timeSlot || '', selectedTime));
      if (childCollision) {
        throw new Error(`น้อง ${child.nickname} มีการจองคลาสเรียนในวันที่ ${selectedDate} รอบเวลา ${selectedTime} ไว้แล้ว ไม่สามารถจองซ้ำได้`);
      }

      const { data: classBookings } = await supabase.from('bookings').select('*').neq('status', 'cancelled');
      const existingBookings = classBookings?.filter(b => (b.class_id === selectedCourse.id || b.schedule_id === selectedCourse.id) && toISODateString(b.date) === targetISODate && isSameTimeSlot(b.time_slot || b.timeSlot || '', selectedTime)) || [];
      
      if (existingBookings.length >= gymClass.capacity) {
        throw new Error(`คลาสเรียน ${gymClass.title || gymClass.name} ในรอบเวลา ${selectedTime} ของวันที่ ${selectedDate} เต็มแล้ว`);
      }

      const newBooking = {
        id: `bk_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        child_id: child.id,
        class_id: selectedCourse.id,
        schedule_id: selectedCourse.id,
        time_slot: selectedTime,
        date: selectedDate,
        status: 'approved'
      };

      familyCourse.remaining_classes -= 1;
      familyCourse.used_classes += 1;

      const { error: userUpdateError } = await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
      if (userUpdateError) throw userUpdateError;

      const { error: childUpdateError } = await supabase.from('children').update({ remaining_classes: familyCourse.remaining_classes }).eq('id', child.id);
      if (childUpdateError) throw childUpdateError;

      const { error: bookingError } = await supabase.from('bookings').insert([newBooking]);
      if (bookingError) throw bookingError;

      alert('✅ จองคลาสสำเร็จ (Booking successful)');
      
      // Update local state temporarily so UI updates instantly
      if (liveBookings) {
        setLiveBookings([...liveBookings, newBooking as any]);
      } else if (allBookings) {
        setLiveBookings([...allBookings, newBooking as any]);
      }
      
      setSelectedDate('');
      setSelectedTime('');
      router.refresh();
    } catch (e: any) {
      setError(e.message || 'เกิดข้อผิดพลาดในการจองคลาส');
    }

    setLoading(false);
  };

  const handleCancel = async (bookingId: string) => {
    if (confirm('คุณต้องการยกเลิกการจองคลาสเรียนนี้ใช่หรือไม่? (ต้องทำล่วงหน้า 1 วัน)')) {
      try {
        const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
        if (!booking) throw new Error('Booking not found');

        const { data: parentUser } = await supabase.from('users').select('*').eq('id', child.parent_id).single();
        if (parentUser && parentUser.courses_purchased) {
          const targetClassId = booking.class_id || booking.schedule_id;
          const familyCourse = parentUser.courses_purchased.find((cp: any) => cp.class_id === targetClassId);
          if (familyCourse) {
            familyCourse.remaining_classes += 1;
            familyCourse.used_classes = Math.max(0, familyCourse.used_classes - 1);
            
            await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
            await supabase.from('children').update({ remaining_classes: familyCourse.remaining_classes }).eq('id', child.id);
          }
        }

        await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
        
        alert('✅ ยกเลิกการจองสำเร็จ (Booking cancelled)');
        router.refresh();
      } catch (e: any) {
        alert('❌ ' + (e.message || 'เกิดข้อผิดพลาดในการยกเลิก'));
      }
    }
  };

  const photoUrl = (child as any).photo_url;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto">
      {/* Top Bar with Back Button */}
      <div className="w-full flex items-center justify-between mb-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-slate-100 text-[#183363] rounded-2xl font-extrabold text-sm border-2 border-[#183363] shadow-2xs transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#95b8d1] flex items-center justify-center border-4 border-white shadow-md mb-3 overflow-hidden">
          {photoUrl ? (
            <img src={photoUrl} alt={child.nickname} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[#183363] font-bold text-4xl">{child.nickname ? child.nickname[0] : '👧🏻'}</span>
          )}
        </div>
        <h2 className="text-[#183363] font-black text-2xl md:text-3xl">น้อง {child.nickname}</h2>
        <p className="text-[#183363] font-bold text-lg mt-1">{calculateAgeTH(child.dob)}</p>
        <p className="text-slate-500 font-semibold text-sm mt-0.5">{child.gender}</p>
      </div>

      {/* Course Status & Selector Bar */}
      <div className="w-full bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8 text-center space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <label className="text-xs font-black text-[#183363] uppercase tracking-wider">คลาสเรียนของน้อง (Course):</label>
          {availableClasses.length > 1 ? (
            <select
              value={selectedCourseId}
              onChange={(e) => {
                setSelectedCourseId(e.target.value);
                setSelectedTime('');
              }}
              className="px-4 py-2.5 bg-white border-2 border-[#183363] text-[#183363] font-black text-base rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
            >
              {availableClasses.map(c => {
                const cp = purchasedCourses.find(p => p.class_id === c.id);
                const rem = cp ? cp.remaining_classes : (c as any).remaining_classes;
                return (
                  <option key={c.id} value={c.id}>
                    {c.title || c.name} {rem !== undefined ? `(คงเหลือ ${rem} ครั้ง)` : ''}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="px-4 py-2 bg-emerald-50 border-2 border-emerald-500 text-emerald-900 font-black text-base rounded-xl flex items-center space-x-2 shadow-xs">
              <span>🔒 {selectedCourse?.title || selectedCourse?.name}</span>
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] font-extrabold uppercase">LOCKED & APPROVED</span>
            </div>
          )}
        </div>

        {(() => {
          const familyCourse = purchasedCourses.find(cp => cp.class_id === selectedCourse?.id);
          const courseTotal = familyCourse ? familyCourse.total_classes : child.total_classes;
          const courseUsed = familyCourse ? familyCourse.used_classes : child.used_classes;
          const courseRemaining = familyCourse ? familyCourse.remaining_classes : child.remaining_classes;
          return (
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 inline-block max-w-md mx-auto w-full">
              <p className="text-xs font-extrabold text-[#183363] flex items-center justify-center space-x-1.5">
                <ShoppingCart size={16} className="text-[#183363]" />
                <span>โควต้าตะกร้าเรียนครอบครัว ({selectedCourse?.title || selectedCourse?.name}):</span>
              </p>
              <p className="font-extrabold text-[#183363] text-sm sm:text-base mt-1">
                ซื้อทั้งหมด: {courseTotal} ครั้ง | ใช้ไปแล้ว: <span className="text-amber-600">{courseUsed}</span> ครั้ง | คงเหลือ: <span className="text-emerald-600 font-black text-base">{courseRemaining}</span> ครั้ง
              </p>
              {courseRemaining <= 2 && courseRemaining > 0 && (
                <span className="inline-block mt-1 px-3 py-0.5 bg-rose-100 text-rose-600 rounded-full text-[11px] font-bold border border-rose-200">
                  ⚠️ ชั่วโมงเรียนในตะกร้าคลาสนี้ใกล้หมดแล้ว
                </span>
              )}
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left Side: Booking & Calendar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-lg text-[#183363] border-b-2 border-[#183363] pb-1 mb-4 inline-block">
              Book a Class ({selectedCourse?.title || selectedCourse?.name})
            </h3>
            
            {child.status === 'pending' && (
              <div className="p-4 mb-4 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 shadow-xs">
                <div className="flex items-center space-x-2 font-black text-sm mb-1">
                  <span>⏳</span>
                  <span>รอผู้ดูแลระบบอนุมัติสิทธิ์คลาสเรียน (Pending Admin Approval)</span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">
                  คุณผู้ปกครองได้เลือกคลาส <span className="font-extrabold text-[#183363]">{selectedCourse?.title || selectedCourse?.name}</span> ให้น้องเรียบร้อยแล้ว ข้อมูลของน้องถูกส่งไปยังฝั่ง Admin เพื่อทำการ Approve ตรวจสอบร่วมกันว่าเลือกคลาสได้อย่างถูกต้องตามสิทธิ์ที่ซื้อ เมื่อ Admin กด Approve แล้ว จึงจะสามารถเลือกวันและรอบเวลาจองเรียนให้น้องได้ครับ
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 mb-4 text-xs font-bold text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Date (เลือกวันที่จอง - ต้องจองล่วงหน้าอย่างน้อย 1 วัน)</label>
              <input 
                type="date" 
                min={getTomorrowDateString()}
                value={selectedDate}
                disabled={child.status === 'pending'}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDate(val);
                  setSelectedTime('');
                  if (val) {
                    refreshLiveCapacities(val);
                  }
                }}
                className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#183363] text-sm font-semibold text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
              {selectedDate && !isDayOpen && (
                <p className="text-xs font-bold text-rose-600 mt-1.5 flex items-center gap-1">
                  ❌ คลาส {selectedCourse?.title || selectedCourse?.name} ไม่เปิดสอนใน{dayName}
                </p>
              )}
              {selectedDate && isDayOpen && (
                <p className="text-[#183363] text-xs font-extrabold mt-1.5 flex items-center gap-1">
                  ✅ {dayName} เปิดสอน {availableSlots.length} รอบเวลา
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-1">Class Time (รอบเวลาเรียนในคลาสนี้)</label>
              <select 
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                onFocus={() => refreshLiveCapacities()}
                onClick={() => refreshLiveCapacities()}
                className="w-full px-4 py-2.5 border-2 border-amber-400 rounded-xl focus:outline-none bg-white font-bold text-slate-800 text-sm cursor-pointer disabled:bg-slate-100 disabled:border-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed"
                disabled={child.status === 'pending' || !selectedDate || !isDayOpen}
              >
                <option value="">
                  {child.status === 'pending' ? '-- รอ Admin อนุมัติสิทธิ์คลาสก่อน --' : !selectedDate ? '-- กรุณาเลือกวันที่ก่อน --' : !isDayOpen ? `-- คลาสนี้ไม่เปิดสอนใน${dayName} --` : '-- Select Time --'}
                </option>
                {availableSlots.map(t => {
                  const targetISODate = toISODateString(selectedDate);
                  const bookingsPool = liveBookings || allBookings || history;

                  const existingCount = bookingsPool.filter(b => 
                    toISODateString(b.date) === targetISODate && 
                    b.status !== 'cancelled' &&
                    (((b as any).class_id || b.schedule_id) === selectedCourseId) &&
                    isSameTimeSlot((b as any).time_slot || (b as any).timeSlot || '', t)
                  ).length;

                  const capacity = selectedCourse?.capacity || 5;
                  const isFull = existingCount >= capacity;
                  const isBookedByChild = history.some(b => 
                    b.child_id === child.id && 
                    b.status !== 'cancelled' &&
                    toISODateString(b.date) === targetISODate && 
                    isSameTimeSlot((b as any).time_slot || (b as any).timeSlot || '', t)
                  );

                  let labelStr = t;
                  if (isBookedByChild) {
                    labelStr += ' (คุณจองรอบนี้ไว้แล้ว ✅)';
                  } else if (isFull) {
                    labelStr += ` (คลาสเต็ม 🔴 ${existingCount}/${capacity} คน)`;
                  } else {
                    labelStr += ` (ว่าง ${capacity - existingCount}/${capacity} ที่นั่ง)`;
                  }

                  return (
                    <option key={t} value={t} disabled={isFull || isBookedByChild}>
                      {labelStr}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <button
              onClick={handleBook}
              disabled={loading || child.status !== 'approved' || !selectedTime || !isDayOpen}
              className="w-full py-3 bg-[#183363] text-white rounded-xl font-black text-base hover:bg-[#112448] disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              {loading ? 'Booking...' : child.status === 'pending' ? '⏳ รอ Admin อนุมัติสิทธิ์คลาสก่อนจอง' : 'Book Class (ยืนยันการจองคลาส)'}
            </button>
            
            <div className="mt-2 text-center text-xs text-slate-500 font-semibold">
              (การจองหรือยกเลิกต้องทำล่วงหน้าอย่างน้อย 1 วัน)
            </div>
          </div>
        </div>

        {/* Right Side: History */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-black text-lg text-[#183363] mb-4 border-b pb-2">History & Status</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr className="text-[#183363] font-black border-b border-slate-200">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Class</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.length === 0 ? (
                  <tr><td colSpan={4} className="py-6 text-slate-400 font-medium italic">No booking history</td></tr>
                ) : (
                  history.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 text-emerald-600 font-bold">{formatDisplayDate(b.date)}</td>
                      <td className="py-3 text-slate-700 font-bold">{b.schedule?.start_time ? `${b.schedule.start_time}-${b.schedule.end_time}` : '-'}</td>
                      <td className="py-3 text-[#183363] font-extrabold">{b.gymClass?.name || 'Class'}</td>
                      <td className="py-3">
                        {b.status !== 'cancelled' && (
                          <button 
                            onClick={() => handleCancel(b.id)}
                            className="w-6 h-6 rounded-full bg-rose-500 text-white font-bold inline-flex items-center justify-center hover:bg-rose-600 shadow-2xs"
                            title="Cancel booking"
                          >
                            ×
                          </button>
                        )}
                        {b.status === 'cancelled' && <span className="text-slate-400 font-bold">Cancelled</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
