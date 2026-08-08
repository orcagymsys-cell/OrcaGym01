'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GymClass, Schedule, Booking, Child, User, toISODateString } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Users } from 'lucide-react';

function parseDaysFromLabel(label?: string): string[] {
  if (!label) return [];
  const l = label.toLowerCase().trim();

  // Ranges
  if ((l.includes('tue') || l.includes('tuesday')) && (l.includes('fri') || l.includes('friday'))) {
    return ['TUE', 'WED', 'THU', 'FRI'];
  }
  if ((l.includes('mon') || l.includes('monday')) && (l.includes('fri') || l.includes('friday'))) {
    return ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  }
  if ((l.includes('sat') || l.includes('saturday')) && (l.includes('sun') || l.includes('sunday'))) {
    return ['SAT', 'SUN'];
  }

  // Individual days
  const days: string[] = [];
  if (l.includes('mon')) days.push('MON');
  if (l.includes('tue')) days.push('TUE');
  if (l.includes('wed')) days.push('WED');
  if (l.includes('thu')) days.push('THU');
  if (l.includes('fri')) days.push('FRI');
  if (l.includes('sat')) days.push('SAT');
  if (l.includes('sun')) days.push('SUN');
  return days;
}

function parseDaysFromTag(tag?: string): string[] {
  if (!tag) return [];
  const l = tag.toLowerCase().trim();
  if (l.includes('tue') && l.includes('wed')) return ['TUE', 'WED'];
  if (l.includes('mon') && l.includes('wed')) return ['MON', 'TUE', 'WED'];
  if (l.includes('thu') && l.includes('fri')) return ['THU', 'FRI'];
  if (l.includes('sat') && l.includes('sun')) return ['SAT', 'SUN'];

  const days: string[] = [];
  if (l.includes('mon')) days.push('MON');
  if (l.includes('tue')) days.push('TUE');
  if (l.includes('wed')) days.push('WED');
  if (l.includes('thu')) days.push('THU');
  if (l.includes('fri')) days.push('FRI');
  if (l.includes('sat')) days.push('SAT');
  if (l.includes('sun')) days.push('SUN');
  return days;
}

function normalizeTime(t?: string): string {
  if (!t) return '';
  return t.replace(/\./g, ':').trim();
}

function formatLongEnglishDate(dateStr: string): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[m - 1] || '';
  return `${d} ${monthName} ${y}`;
}

function startTimesMatch(slotTime: string, matrixTime: string): boolean {
  const normSlot = normalizeTime(slotTime);
  const normMatrix = normalizeTime(matrixTime);
  if (!normSlot || !normMatrix) return false;
  if (normSlot === normMatrix) return true;

  const slotStart = normSlot.split('-')[0].trim();
  const matrixStart = normMatrix.split('-')[0].trim();
  return slotStart === matrixStart;
}

export default function AdminScheduleMatrix({ 
  classes = [], 
  schedules = [], 
  bookings = [], 
  childrenData = [],
  parents = []
}: { 
  classes?: GymClass[], 
  schedules?: Schedule[], 
  bookings?: Booking[],
  childrenData?: Child[],
  parents?: User[]
}) {

  const [selectedDate, setSelectedDate] = useState(''); // Init empty to show full week by default
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL'); // Added course tab state
  const [selectedCell, setSelectedCell] = useState<{ day: string, time: string, classes: { gymClass: GymClass, tag?: string }[] } | null>(null);
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingsState, setBookingsState] = useState<Booking[]>(bookings);
  const router = useRouter();

  useEffect(() => {
    // Fetch directly on client to bypass Next.js Server Action cache
    const fetchBookings = async () => {
      const { data, error } = await supabase.from('bookings').select('*');
      if (data && !error) {
        setBookingsState(data);
      } else {
        setBookingsState(bookings);
      }
    };
    fetchBookings();
  }, [bookings]);

  useEffect(() => {
    const channel = supabase.channel('admin_realtime_bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBookingsState(prev => [...prev, payload.new as Booking]);
        } else if (payload.eventType === 'UPDATE') {
          setBookingsState(prev => prev.map(b => b.id === payload.new.id ? (payload.new as Booking) : b));
        } else if (payload.eventType === 'DELETE') {
          setBookingsState(prev => prev.filter(b => b.id !== payload.old.id));
        }
        router.refresh(); // Refresh to catch any other server state if needed
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleAdminCancelBooking = async (bookingId: string) => {
    try {
      const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
      if (!booking) throw new Error('Booking not found');

      const { data: child } = await supabase.from('children').select('*').eq('id', booking.child_id).single();
      if (!child) throw new Error('Child not found');

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

      const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
      if (error) throw error;
      
      alert('✅ ยกเลิกการจองโดย Admin สำเร็จ');
      router.refresh();
    } catch (e: any) {
      alert('❌ ' + (e.message || 'เกิดข้อผิดพลาดในการยกเลิก'));
    }
  };

  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const timeslots = ['09:00-10:30', '10:30-12:00', '12:00-13:30', '13:00-14:30', '14:30-16:00', '16:00-17:00', '17:30-19:30'];

  const getClassesForCell = (day: string, time: string) => {
    const matchedMap = new Map<string, { gymClass: GymClass, tag?: string }>();

    const filteredClasses = selectedCourseId === 'ALL' ? classes : classes.filter(c => c.id === selectedCourseId);

    filteredClasses.forEach(cls => {
      cls.scheduleGrid?.forEach(row => {
        const dayGroupDays = parseDaysFromLabel(row.label);

        row.slots?.forEach((slot, sIdx) => {
          if (!slot || slot.trim() === '') return;
          
          const activeDays = new Set<string>(dayGroupDays);
          let isTagMatch = false;

          if (row.tag && (row.tagIndex === sIdx || row.tagIndex === sIdx + 1)) {
            const tagDays = parseDaysFromTag(row.tag);
            tagDays.forEach(td => activeDays.add(td));
            isTagMatch = true;
          }

          if (activeDays.has(day) && startTimesMatch(slot, time)) {
            matchedMap.set(cls.id, {
              gymClass: cls,
              tag: (isTagMatch && !dayGroupDays.includes(day)) ? row.tag : undefined
            });
          }
        });
      });
    });

    // Fallback to legacy schedules table if scheduleGrid matched nothing
    if (matchedMap.size === 0) {
      const [start] = time.split('-');
      const sch = schedules.find(s => s.day_of_week === day && s.start_time === start);
      if (sch) {
        const cls = classes.find(c => c.id === sch.class_id);
        if (cls && (selectedCourseId === 'ALL' || cls.id === selectedCourseId)) {
          matchedMap.set(cls.id, { gymClass: cls });
        }
      }
    }

    return Array.from(matchedMap.values());
  };

  const currentWeekMap = (() => {
    let baseDate = new Date();
    if (selectedDate) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      baseDate = new Date(y, m - 1, d);
    }
    baseDate.setDate(baseDate.getDate() + (weekOffset * 7));

    const currentDayIndex = baseDate.getDay(); // 0 = Sun, 1 = Mon ...
    const distToMon = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;

    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + distToMon);

    const dayCodes = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const map: { [key: string]: string } = {};

    dayCodes.forEach((code, index) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + index);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      map[code] = `${y}-${m}-${day}`;
    });

    return map;
  })();

  const getBookingsForClass = (classId: string, timeSlot?: string, dayCode?: string) => {
    const targetISO = selectedDate 
      ? toISODateString(selectedDate)
      : dayCode 
      ? toISODateString(currentWeekMap[dayCode])
      : '';

    if (!targetISO) return [];

    return bookingsState.filter(b => {
      if (b.status === 'cancelled') return false;
      if (toISODateString(b.date) !== targetISO) return false;

      const bClassId = (b as any).class_id || b.schedule_id;
      if (bClassId && bClassId !== classId) return false;

      if (timeSlot) {
        const bTime = (b as any).time_slot || (b as any).timeSlot || '';
        return startTimesMatch(bTime, timeSlot);
      }
      return true;
    });
  };

  const selectedDateDayCode = (() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayCodes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return dayCodes[dateObj.getDay()];
  })();

  let displaySelectedDateStr = selectedDate;
  if (selectedDate && selectedDate.includes('-')) {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (!isNaN(dateObj.getTime())) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      displaySelectedDateStr = `${dayNames[dateObj.getDay()]}-${String(d).padStart(2, '0')}-${monthNames[dateObj.getMonth()]}-${y}`;
    }
  }

  const weekDatesSet = new Set(Object.values(currentWeekMap).map(d => toISODateString(d)));
  
  const relevantBookings = selectedCourseId === 'ALL' 
    ? bookingsState 
    : bookingsState.filter(b => {
        const bClassId = (b as any).class_id || b.schedule_id;
        return bClassId === selectedCourseId;
      });

  const displayedBookings = selectedDate 
    ? relevantBookings.filter(b => toISODateString(b.date) === toISODateString(selectedDate) && b.status !== 'cancelled')
    : relevantBookings.filter(b => b.status !== 'cancelled' && weekDatesSet.has(toISODateString(b.date)));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#183363]">Schedule Matrix & Date Roster</h1>
          <p className="text-slate-600 text-sm mt-1">เลือกวันที่ด้านขวา เพื่อเช็กว่าใครจองเรียนวันไหนบ้าง และตรวจสอบว่าคลาสในวันนั้นเต็มหรือใกล้เต็มแล้วหรือยัง</p>
        </div>
        <div className="flex items-center space-x-3 bg-sky-50 p-3 rounded-2xl border-2 border-[#183363] shadow-xs">
          <CalendarIcon className="text-[#183363]" size={22} />
          <div className="flex flex-col space-y-2">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">เลือกวันที่เช็กตาราง (Select Date):</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-[#183363] font-black text-sm focus:outline-none bg-transparent cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="px-2 py-1 bg-white border border-[#183363] text-[#183363] hover:bg-slate-100 rounded text-xs font-bold transition-all shadow-xs">
                &lt; สัปดาห์ก่อนหน้า
              </button>
              <button onClick={() => { setWeekOffset(0); setSelectedDate(''); }} className="px-2 py-1 bg-[#183363] text-white hover:bg-blue-900 rounded text-xs font-bold transition-all shadow-xs">
                สัปดาห์นี้
              </button>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="px-2 py-1 bg-white border border-[#183363] text-[#183363] hover:bg-slate-100 rounded text-xs font-bold transition-all shadow-xs">
                สัปดาห์ถัดไป &gt;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Course Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCourseId('ALL')}
          className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
            selectedCourseId === 'ALL'
              ? 'bg-[#183363] text-white shadow-md'
              : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Courses
        </button>
        {classes.map(cls => (
          <button
            key={cls.id}
            onClick={() => setSelectedCourseId(cls.id)}
            className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
              selectedCourseId === cls.id
                ? 'bg-[#183363] text-white shadow-md'
                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {cls.title || cls.name}
          </button>
        ))}
      </div>

      {/* Selected Date Summary Banner */}
      <div className="bg-sky-50 border-2 border-sky-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-[#183363] text-white flex items-center justify-center font-black shrink-0">
            📅
          </div>
          <div>
            <h3 className="font-black text-base text-[#183363]">
              {selectedDate ? (
                <span>ผลการจองประจำวันที่: <span className="text-blue-600 font-extrabold">{formatLongEnglishDate(selectedDate)}</span> ({selectedDateDayCode})</span>
              ) : (
                <span>ผลการจองสัปดาห์ปัจจุบัน: <span className="text-blue-600 font-extrabold">{formatLongEnglishDate(currentWeekMap['MON'])} ถึง {formatLongEnglishDate(currentWeekMap['SUN'])}</span></span>
              )}
            </h3>
            <p className="text-xs text-slate-600 font-semibold mt-0.5">
              {selectedDate ? (
                <span>ตารางแสดงเฉพาะวัน <span className="font-black text-[#183363]">{selectedDateDayCode}</span> | มีการจองในวันนี้ทั้งหมด: <span className="font-black text-emerald-700">{displayedBookings.length} รายการ</span></span>
              ) : (
                <span>ตารางแสดงข้อมูลของสัปดาห์ปัจจุบัน (MON - SUN) | มีการจองในสัปดาห์นี้รวม: <span className="font-black text-emerald-700">{displayedBookings.length} รายการ</span></span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto mb-6">
        <table className="w-full text-center border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#183363] text-white font-black text-xs">
              <th className="p-3 border-r border-[#2a4a8c] w-24">Day / Time</th>
              {timeslots.map(time => (
                <th key={time} className="p-3 border-r border-[#2a4a8c] whitespace-nowrap">
                  {time}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(selectedDate && selectedDateDayCode ? days.filter(d => d === selectedDateDayCode) : days).map((day) => {
              const isSelectedDayRow = day === selectedDateDayCode;
              return (
                <tr key={day} className={`border-b transition-colors ${isSelectedDayRow ? 'bg-amber-50/90 font-black' : 'hover:bg-slate-50/80'}`}>
                  <td className={`p-3 font-extrabold border-r border-slate-200 text-xs ${
                    isSelectedDayRow 
                      ? 'bg-amber-400 text-amber-950 font-black shadow-inner' 
                      : ['SAT', 'SUN'].includes(day) 
                      ? 'bg-amber-100/70 text-amber-900' 
                      : 'bg-slate-100 text-[#183363]'
                  }`}>
                    <div>{day}</div>
                    {isSelectedDayRow ? (
                      <span className="text-[9px] font-black text-amber-950 block mt-0.5">📍 วันที่เลือก</span>
                    ) : !selectedDate && currentWeekMap[day] ? (
                      <span className="text-[9px] font-extrabold text-slate-500 block mt-0.5">
                        ({currentWeekMap[day].slice(8, 10)}/{currentWeekMap[day].slice(5, 7)})
                      </span>
                    ) : null}
                  </td>
                  {timeslots.map(time => {
                    const activeClasses = getClassesForCell(day, time);
                    const isSelected = selectedCell?.day === day && selectedCell?.time === time;

                    return (
                      <td
                        key={time}
                        onClick={() => {
                          if (activeClasses.length > 0) {
                            setSelectedCell({ day, time, classes: activeClasses });
                          }
                        }}
                        className={`p-2 border-r border-slate-200 transition-all ${
                          activeClasses.length > 0 ? 'cursor-pointer hover:bg-blue-50/80' : 'bg-slate-50/40'
                        } ${isSelected ? 'ring-2 ring-inset ring-blue-600 bg-blue-100/60' : ''}`}
                      >
                        {activeClasses.length > 0 ? (
                          <div className="flex flex-col gap-1.5 items-center justify-center">
                            {activeClasses.map(({ gymClass, tag }) => {
                              const dayBookings = getBookingsForClass(gymClass.id, time, day);
                              const isFull = dayBookings.length >= gymClass.capacity;
                              const isNearFull = dayBookings.length >= gymClass.capacity - 1 && dayBookings.length < gymClass.capacity && dayBookings.length > 0;

                              const attendeeList = dayBookings.map(b => {
                                const child = childrenData.find(c => c.id === b.child_id);
                                return child ? `${child.full_name} (น้อง ${child.nickname})` : 'นักเรียน';
                              });

                              const nativeTitle = dayBookings.length > 0
                                ? `👥 รายชื่อเด็กที่จองรอบนี้ (${dayBookings.length}/${gymClass.capacity} คน):\n${attendeeList.join('\n')}`
                                : `คลาส ${gymClass.title || gymClass.name} (ยังไม่มีเด็กจองในวันที่เลือก)`;

                              return (
                                <div
                                  key={gymClass.id}
                                  title={nativeTitle}
                                  className="group relative flex flex-col items-center bg-white/95 p-1.5 rounded-xl border border-slate-200 shadow-2xs w-full hover:border-[#183363] hover:shadow-md transition-all cursor-pointer"
                                >
                                  <span className="text-[11px] font-black text-[#183363] leading-tight">
                                    {gymClass.title || gymClass.name}
                                  </span>
                                  {tag && (
                                    <span className="text-[10px] font-black text-rose-500">
                                      {tag}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                                    isFull 
                                      ? 'bg-rose-600 text-white font-black shadow-2xs' 
                                      : isNearFull 
                                      ? 'bg-amber-500 text-white font-black animate-pulse shadow-2xs' 
                                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {isFull ? '🔴 คลาสเต็ม' : isNearFull ? '⚠️ ใกล้เต็ม' : ''} ({dayBookings.length}/{gymClass.capacity})
                                  </span>

                                  {/* RICH HOVER TOOLTIP POPOVER */}
                                  {dayBookings.length > 0 && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 min-w-[210px] p-3 bg-[#183363] text-white text-xs rounded-2xl shadow-2xl border-2 border-amber-400 pointer-events-none animate-fadeIn">
                                      <div className="font-black text-amber-300 border-b border-blue-800 pb-1 mb-2 flex items-center justify-between text-[11px]">
                                        <span>👥 รายชื่อเด็กที่จองรอบนี้</span>
                                        <span className="text-white bg-blue-900 px-1.5 py-0.5 rounded-md text-[10px]">({dayBookings.length}/{gymClass.capacity})</span>
                                      </div>
                                      <div className="space-y-1 font-bold text-left text-[11px]">
                                        {dayBookings.map((b, idx) => {
                                          const child = childrenData.find(c => c.id === b.child_id);
                                          return (
                                            <div key={b.id} className="flex items-center space-x-1.5 text-slate-100">
                                              <span className="text-amber-400 font-extrabold">{idx + 1}.</span>
                                              <span className="font-bold text-white">{child?.full_name || 'นักเรียน'}</span>
                                              <span className="text-sky-300 text-[10px]">(น้อง {child?.nickname})</span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#183363]" />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-300 text-xs italic">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Details Panel */}
      {selectedCell && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-[#183363] flex items-center space-x-2 mb-4">
            <Users />
            <span>Class Roster ({selectedCell.day} - {selectedCell.time})</span>
          </h2>

          <div className="space-y-4">
            {selectedCell.classes.map(({ gymClass }) => {
              const classBookings = getBookingsForClass(gymClass.id);

              return (
                <div key={gymClass.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <h3 className="font-extrabold text-[#183363] text-base mb-2">
                    {gymClass.title || gymClass.name} (คลาสเต็ม: {gymClass.capacity} คน)
                  </h3>

                  {classBookings.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">ยังไม่มีเด็กจองในคลาสนี้สำหรับวันที่เลือก</p>
                  ) : (
                    <ul className="space-y-2">
                      {classBookings.map(b => {
                        const child = childrenData.find(c => c.id === b.child_id);
                        return (
                          <li key={b.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-slate-200 shadow-2xs flex-wrap gap-2">
                            <div>
                              <span className="font-bold text-slate-800">{child?.full_name}</span>
                              <span className="text-slate-500 text-sm ml-2">(น้อง {child?.nickname})</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
                                Booked ({b.status})
                              </span>
                              <button
                                onClick={async () => {
                                  if (confirm(`คุณต้องการยกเลิกการจองคลาสนี้ของ น้อง ${child?.nickname || ''} ใช่หรือไม่? (ยกเลิกโดย Admin ไม่ติดเงื่อนไข 1 วัน)`)) {
                                    await handleAdminCancelBooking(b.id);
                                  }
                                }}
                                className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-xs transition-colors"
                              >
                                ยกเลิกโดย Admin
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 📋 ALL BOOKINGS TABLE FOR ADMIN */}
      {(() => {
        const filteredBookings = relevantBookings
          .filter(bk => {
            if (!bookingSearch.trim()) return true;
            const child = childrenData.find(c => c.id === bk.child_id);
            const parent = parents.find(p => p.id === child?.parent_id);
            const gymClass = classes.find(c => c.id === (bk as any).class_id || c.id === bk.schedule_id) || classes[0];
            const q = bookingSearch.toLowerCase();

            return (
              (child?.full_name && child.full_name.toLowerCase().includes(q)) ||
              (child?.nickname && child.nickname.toLowerCase().includes(q)) ||
              (parent?.full_name && parent.full_name.toLowerCase().includes(q)) ||
              (gymClass?.title && gymClass.title.toLowerCase().includes(q)) ||
              (gymClass?.name && gymClass.name.toLowerCase().includes(q)) ||
              (bk.date && bk.date.includes(q))
            );
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-3">
              <div>
                <h2 className="text-xl font-black text-[#183363] flex items-center space-x-2">
                  <CalendarIcon className="text-blue-600" size={22} />
                  <span>ตารางรายการเด็กที่จองเวลาเรียนเข้ามาทั้งหมด (Student Bookings Roster)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">แสดงรายการจองเรียนทั้งหมดในระบบเรียงตามวันที่ พร้อมปุ่มยกเลิกโดย Admin</p>
              </div>
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="🔍 ค้นหาชื่อเด็ก / ผู้ปกครอง / คลาส / วันที่..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#183363] w-full sm:w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-100/80 text-[#183363] text-xs uppercase tracking-wider font-extrabold border-b border-slate-200">
                    <th className="p-3.5">วันที่เรียน (Date)</th>
                    <th className="p-3.5">เวลาเรียน (Time)</th>
                    <th className="p-3.5">ชื่อนักเรียน</th>
                    <th className="p-3.5">คลาสเรียน (Course)</th>
                    <th className="p-3.5">ผู้ปกครอง & เบอร์โทร</th>
                    <th className="p-3.5 text-center">สถานะ</th>
                    <th className="p-3.5 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 italic">
                        ไม่พบรายการจองเวลาเรียนที่ตรงตามเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(bk => {
                      const child = childrenData.find(c => c.id === bk.child_id);
                      const parent = parents.find(p => p.id === child?.parent_id);
                      const gymClass = classes.find(c => c.id === (bk as any).class_id || c.id === bk.schedule_id) || classes[0];
                      const timeSlot = (bk as any).time_slot || (bk as any).timeSlot || '10:30-12:00';

                      let displayDateStr = bk.date;
                      if (bk.date && bk.date.includes('-')) {
                        const [y, m, d] = bk.date.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        if (!isNaN(dateObj.getTime())) {
                          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          displayDateStr = `${dayNames[dateObj.getDay()]}-${String(d).padStart(2, '0')}-${monthNames[dateObj.getMonth()]}-${y}`;
                        }
                      }

                      const isCancelled = bk.status === 'cancelled';

                      return (
                        <tr key={bk.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3.5 font-black text-amber-950 whitespace-nowrap">
                            📅 {displayDateStr}
                          </td>
                          <td className="p-3.5 font-bold text-[#183363] whitespace-nowrap">
                            ⏰ {timeSlot}
                          </td>
                          <td className="p-3.5 font-bold text-slate-800">
                            <div>{child?.full_name || 'นักเรียน'}</div>
                            <div className="text-sky-700 font-extrabold text-[11px]">น้อง {child?.nickname || '-'}</div>
                          </td>
                          <td className="p-3.5 font-black text-[#183363]">
                            {gymClass?.title || gymClass?.name}
                          </td>
                          <td className="p-3.5 text-slate-600 font-medium text-xs">
                            <div className="font-bold text-slate-800">{parent?.full_name || '-'}</div>
                            <div className="text-slate-500 font-semibold">{parent?.phone_number || '-'}</div>
                          </td>
                          <td className="p-3.5 text-center">
                            {isCancelled ? (
                              <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-[11px] font-bold border border-rose-200">
                                ❌ Cancelled (ยกเลิกแล้ว)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[11px] font-bold border border-emerald-200">
                                ✅ Booked (จองเรียนแล้ว)
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-center">
                            {!isCancelled ? (
                              <button
                                onClick={async () => {
                                  if (confirm(`คุณต้องการยกเลิกการจองคลาสนี้ของ น้อง ${child?.nickname || ''} ใช่หรือไม่?`)) {
                                    await handleAdminCancelBooking(bk.id);
                                  }
                                }}
                                className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold text-xs transition-colors"
                              >
                                ยกเลิกโดย Admin
                              </button>
                            ) : (
                              <span className="text-slate-400 text-xs font-semibold">ยกเลิกแล้ว</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
