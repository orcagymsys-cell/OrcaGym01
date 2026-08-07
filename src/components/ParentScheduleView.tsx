'use client';

import { useState } from 'react';
import { Child, GymClass, Schedule, Booking, User } from '@/lib/types';
import Link from 'next/link';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

function parseDayCode(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayCodes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  return dayCodes[dateObj.getDay()];
}

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

function normalizeTime(t?: string): string {
  if (!t) return '';
  return t.replace(/\./g, ':').trim();
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

export default function ParentScheduleView({
  childrenData,
  classes,
  schedules,
  bookings,
  parentUser
}: {
  childrenData: Child[];
  classes: GymClass[];
  schedules: Schedule[];
  bookings: Booking[];
  parentUser?: User | null;
}) {
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenData[0]?.id || 'all');
  const [viewMode, setViewMode] = useState<'personal' | 'master'>('personal');
  const router = useRouter();

  const days = [
    { code: 'MON', label: 'Mon (จันทร์)' },
    { code: 'TUE', label: 'Tue (อังคาร)' },
    { code: 'WED', label: 'Wed (พุธ)' },
    { code: 'THU', label: 'Thu (พฤหัส)' },
    { code: 'FRI', label: 'Fri (ศุกร์)' },
    { code: 'SAT', label: 'Sat (เสาร์)' },
    { code: 'SUN', label: 'Sun (อาทิตย์)' }
  ];

  const timeslots = [
    '09:00-10:30',
    '10:30-12:00',
    '12:00-13:30',
    '13:00-14:30',
    '14:30-16:00',
    '16:00-17:00',
    '17:30-19:30'
  ];

  const activeChild = childrenData.find(c => c.id === selectedChildId);

  // Helper to find open classes for master timetable cell
  const getOpenClassesForCell = (dayCode: string, timeSlot: string) => {
    const dayIndexMap: { [key: string]: number } = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0 };
    const targetDayNum = dayIndexMap[dayCode];

    return classes.filter(cls => {
      const isCubs = cls.id === 'class_1' || cls.title?.includes('Orca Cubs') || cls.name?.includes('Orca Cubs');
      const isMega = cls.id === 'class_2' || cls.title?.includes('Mega Orca') || cls.name?.includes('Mega Orca');

      if (isCubs) {
        if ([2, 3, 4, 5].includes(targetDayNum)) {
          return ['10:30-12:00', '14:30-16:00', '16:00-17:00'].some(t => startTimesMatch(t, timeSlot));
        } else if ([6, 0].includes(targetDayNum)) {
          return ['09:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00'].some(t => startTimesMatch(t, timeSlot));
        }
      } else if (isMega) {
        if ([1, 2, 3, 4, 5].includes(targetDayNum)) {
          return ['10:30-12:00', '17:30-19:30'].some(t => startTimesMatch(t, timeSlot));
        } else if ([6, 0].includes(targetDayNum)) {
          return ['10:30-12:00', '16:00-17:00', '17:30-19:30'].some(t => startTimesMatch(t, timeSlot));
        }
      } else {
        const openTimes = (cls as any).pricing_plans?.[0]?.times || [];
        if (openTimes.length > 0) {
          return openTimes.some((t: string) => startTimesMatch(t, timeSlot));
        }
      }
      return false;
    });
  };

  // Filter bookings by selected child
  const filteredBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return false;
    if (selectedChildId === 'all') return true;
    return b.child_id === selectedChildId;
  });

  const getBookingsForCell = (dayCode: string, timeSlot: string) => {
    return filteredBookings.filter(b => {
      const bDayCode = parseDayCode(b.date);
      if (bDayCode !== dayCode) return false;

      const timeStr = (b as any).time_slot || (b as any).timeSlot || ((b as any).schedule?.start_time ? `${(b as any).schedule?.start_time}-${(b as any).schedule?.end_time}` : '');
      return startTimesMatch(timeStr, timeSlot);
    });
  };

  const handleCancel = async (bookingId: string) => {
    const bk = bookings.find(b => b.id === bookingId);
    if (bk) {
      const [y, m, d] = bk.date.split('-').map(Number);
      const bookingDate = new Date(y, m - 1, d);
      bookingDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const diffTime = bookingDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 1) {
        alert('❌ ไม่สามารถยกเลิกได้ (การยกเลิกคลาสเรียนต้องทำล่วงหน้าอย่างน้อย 1 วัน)');
        return;
      }
    }

    if (confirm('คุณต้องการยกเลิกการจองคลาสเรียนนี้ใช่หรือไม่? (ต้องทำล่วงหน้าอย่างน้อย 1 วัน)')) {
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

        await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
        
        alert('✅ ยกเลิกการจองสำเร็จ');
        router.refresh();
      } catch (e: any) {
        alert('❌ ' + (e.message || 'เกิดข้อผิดพลาดในการยกเลิก'));
      }
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center space-y-6 px-4 sm:px-6 pb-12">
      {/* Header Title */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-black text-[#1a2d5c]">
          Class Schedule & Timetable (ตารางเรียน & ตารางคลาสที่เปิดสอน)
        </h1>
        <p className="text-sm text-slate-500 font-semibold mt-1">
          ตรวจสอบตารางเรียนประจำตัวเด็กๆ หรือดูรอบเวลาคลาสเรียนทั้งหมดที่ยิมเปิดสอน
        </p>
      </div>

      {/* View Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 w-full border-b pb-4">
        <button
          onClick={() => setViewMode('personal')}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-black text-sm transition-all border-2 ${
            viewMode === 'personal'
              ? 'bg-[#1a2d5c] text-white border-[#1a2d5c] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Calendar size={18} />
          <span>ตารางเรียนประจำตัวเด็ก (My Bookings)</span>
        </button>

        <button
          onClick={() => setViewMode('master')}
          className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-black text-sm transition-all border-2 ${
            viewMode === 'master'
              ? 'bg-[#1a2d5c] text-white border-[#1a2d5c] shadow-md'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <Clock size={18} />
          <span>ตารางคลาสเรียนทั้งหมดที่เปิดสอน (Master Class Timetable)</span>
        </button>
      </div>

      {/* MODE 1: PERSONAL BOOKING SCHEDULE */}
      {viewMode === 'personal' && (
        <div className="w-full space-y-6">
          {/* Child Selector Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full border-b pb-4">
            <button
              onClick={() => setSelectedChildId('all')}
              className={`px-5 py-2.5 rounded-full font-extrabold text-sm transition-all border-2 ${
                selectedChildId === 'all'
                  ? 'bg-[#1a2d5c] text-white border-[#1a2d5c] shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              👨‍👩‍👧‍👦 เด็กทุกคน (All Children)
            </button>

            {childrenData.map(c => {
              const isSelected = selectedChildId === c.id;
              const photoUrl = (c as any).photo_url;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedChildId(c.id)}
                  className={`flex items-center space-x-2 px-5 py-2 rounded-full font-extrabold text-sm transition-all border-2 ${
                    isSelected
                      ? 'bg-[#1a2d5c] text-white border-[#1a2d5c] shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-sky-200 border border-white shrink-0 flex items-center justify-center">
                    {photoUrl ? (
                      <img src={photoUrl} alt={c.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-[#1a2d5c]">{c.nickname[0]}</span>
                    )}
                  </div>
                  <span>น้อง {c.nickname}</span>
                  {c.remaining_classes <= 2 && c.remaining_classes > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="ชั่วโมงใกล้หมด" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Child Info Summary */}
          {activeChild && (
            <div className="w-full bg-sky-50 border border-sky-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-[#95b8d1] border-2 border-white shadow-sm shrink-0 flex items-center justify-center">
                  {(activeChild as any).photo_url ? (
                    <img src={(activeChild as any).photo_url} alt={activeChild.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#1a2d5c] font-black text-xl">{activeChild.nickname[0]}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-black text-lg text-[#1a2d5c]">น้อง {activeChild.nickname} ({activeChild.full_name})</h3>
                  {(() => {
                    const childCourseId = (activeChild as any).assigned_course_id;
                    const childCourseTitle = (activeChild as any).assigned_course_title;
                    const familyCourse = parentUser?.courses_purchased?.find(cp => cp.class_id === childCourseId) || parentUser?.courses_purchased?.[0];
                    
                    if (familyCourse) {
                      return (
                        <div className="flex flex-wrap gap-2 mt-1">
                          <span className="text-xs font-extrabold bg-white text-[#1a2d5c] px-2.5 py-1 rounded-lg border border-sky-300">
                            🧺 {familyCourse.class_title}: คงเหลือ <span className="text-emerald-600 font-black">{familyCourse.remaining_classes}</span>/{familyCourse.total_classes} ครั้ง
                          </span>
                        </div>
                      );
                    }

                    return (
                      <p className="text-xs font-bold text-slate-600 mt-0.5">
                        คลาสเรียน: <span className="font-extrabold text-[#1a2d5c]">{childCourseTitle || 'Orca Cubs Class'}</span> | สิทธิ์คงเหลือ: <span className="text-emerald-600 font-black text-sm">{activeChild.remaining_classes}</span> ครั้ง
                      </p>
                    );
                  })()}
                </div>
              </div>
              <Link
                href={`/child/${activeChild.id}`}
                className="px-5 py-2 bg-[#1a2d5c] text-white rounded-xl font-bold text-sm hover:bg-[#111d3d] transition-all shadow-sm active:scale-95 shrink-0 flex items-center space-x-1"
              >
                <span>+ จองคลาสเรียนเพิ่ม</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          )}

          {/* PERSONAL SCHEDULE MATRIX TABLE */}
          <div className="w-full max-w-full overflow-x-auto border-2 border-[#1a2d5c] rounded-2xl shadow-md bg-white">
            <table className="w-full border-collapse text-center text-[10px] sm:text-xs">
              <thead>
                <tr className="bg-[#1a2d5c] text-white font-black">
                  <th className="p-2 sm:p-3 border-r border-blue-900 w-16 sm:w-24">Day / Time</th>
                  {timeslots.map(t => (
                    <th key={t} className="p-1 sm:p-2 border-r border-blue-900 w-auto font-bold text-[9px] sm:text-[11px] leading-tight">
                      {t.replace('-', '\n')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day, dIdx) => (
                  <tr key={day.code} className={dIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-3 border-r border-b font-black text-[#1a2d5c] bg-slate-100 whitespace-nowrap">
                      {day.label}
                    </td>
                    {timeslots.map(time => {
                      const cellBookings = getBookingsForCell(day.code, time);
                      return (
                        <td key={time} className="p-2 border-r border-b align-top h-24 relative">
                          {cellBookings.length === 0 ? (
                            <span className="text-slate-300 font-normal italic block pt-6">-</span>
                          ) : (
                            <div className="space-y-1.5">
                              {cellBookings.map(bk => {
                                const child = childrenData.find(c => c.id === bk.child_id);
                                const gymClass = classes.find(c => c.id === (bk as any).class_id || c.id === bk.schedule_id) || classes[0];
                                return (
                                  <div
                                    key={bk.id}
                                    className="p-2 rounded-xl border border-sky-300 bg-sky-100 text-[#1a2d5c] shadow-xs text-left text-[11px] leading-tight space-y-1 hover:shadow-md transition-shadow relative group"
                                  >
                                    <div className="font-black text-blue-950 flex items-center justify-between">
                                      <span>{gymClass?.title || gymClass?.name}</span>
                                      <button
                                        onClick={() => handleCancel(bk.id)}
                                        className="text-rose-500 hover:text-rose-700 font-black p-0.5"
                                        title="Cancel booking"
                                      >
                                        ×
                                      </button>
                                    </div>
                                    {selectedChildId === 'all' && child && (
                                      <div className="text-[10px] font-bold text-sky-800">
                                        👤 น้อง {child.nickname}
                                      </div>
                                    )}
                                    <div className="text-[10px] font-semibold text-slate-600">
                                      📅 {formatDisplayDate(bk.date)}
                                    </div>
                                  </div>
                                );
                              })}
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
      )}

      {/* MODE 2: MASTER CLASS TIMETABLE GRID */}
      {viewMode === 'master' && (
        <div className="w-full space-y-6">
          <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2 font-black text-[#1a2d5c] text-sm">
              <Clock size={18} className="text-blue-600" />
              <span>ตารางคลาสเรียนทั้งหมดที่เปิดสอน (Master Class Timetable)</span>
            </div>
            <div className="flex items-center space-x-4 font-extrabold">
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-sky-400 inline-block" />
                <span>Orca Cubs Class</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span>Mega Orca</span>
              </span>
            </div>
          </div>

          <div className="w-full max-w-full overflow-x-auto border-2 border-[#1a2d5c] rounded-2xl shadow-md bg-white">
            <table className="w-full border-collapse text-center text-[10px] sm:text-xs">
              <thead>
                <tr className="bg-[#1a2d5c] text-white font-black">
                  <th className="p-2 sm:p-3 border-r border-blue-900 w-16 sm:w-24">Day / Time</th>
                  {timeslots.map(t => (
                    <th key={t} className="p-1 sm:p-2 border-r border-blue-900 w-auto font-bold text-[9px] sm:text-[11px] leading-tight">
                      {t.replace('-', '\n')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((day, dIdx) => (
                  <tr key={day.code} className={dIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                    <td className="p-3 border-r border-b font-black text-[#1a2d5c] bg-slate-100 whitespace-nowrap">
                      {day.label}
                    </td>
                    {timeslots.map(time => {
                      const openClasses = getOpenClassesForCell(day.code, time);
                      return (
                        <td key={time} className="p-2 border-r border-b align-top h-24 relative">
                          {openClasses.length === 0 ? (
                            <span className="text-slate-300 font-normal italic block pt-6">-</span>
                          ) : (
                            <div className="space-y-1.5">
                              {openClasses.map(cls => {
                                const isCubs = cls.id === 'class_1' || cls.title?.includes('Cubs');
                                return (
                                  <div
                                    key={cls.id}
                                    className={`p-2 rounded-xl border text-center text-xs font-black shadow-xs transition-shadow ${
                                      isCubs 
                                        ? 'bg-sky-100 border-sky-300 text-[#183363]' 
                                        : 'bg-amber-100 border-amber-300 text-amber-950'
                                    }`}
                                  >
                                    <span>{cls.title || cls.name}</span>
                                  </div>
                                );
                              })}
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
      )}

      {/* UPCOMING BOOKINGS LIST */}
      <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-4">
        <h3 className="font-black text-lg text-[#1a2d5c] mb-4 border-b pb-2 flex items-center justify-between">
          <span>รายการคลาสเรียนที่จองไว้ทั้งหมด ({filteredBookings.length} รายการ)</span>
        </h3>

        {filteredBookings.length === 0 ? (
          <p className="text-slate-400 text-sm italic text-center py-6">
            ยังไม่มีรายการจองคลาสเรียนในระบบ สามารถกดปุ่ม "+ จองคลาสเรียนเพิ่ม" เพื่อเริ่มเลือกวันจองเรียนได้ทันที
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredBookings.map(bk => {
              const child = childrenData.find(c => c.id === bk.child_id);
              const gymClass = classes.find(c => c.id === (bk as any).class_id || c.id === bk.schedule_id) || classes[0];
              const slotTime = (bk as any).time_slot || (bk as any).timeSlot || '10:30-12:00';
              return (
                <div key={bk.id} className="py-3 flex items-center justify-between flex-wrap gap-2 hover:bg-slate-50 px-2 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-[#95b8d1] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                      {(child as any)?.photo_url ? (
                        <img src={(child as any).photo_url} alt={child?.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold">{child?.nickname ? child.nickname[0] : '👧🏻'}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-[#1a2d5c]">
                        {gymClass?.title || gymClass?.name} <span className="text-xs font-bold text-slate-500">(น้อง {child?.nickname})</span>
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-slate-600 font-semibold mt-0.5">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDisplayDate(bk.date)}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {slotTime}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancel(bk.id)}
                    className="px-4 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-full transition-colors"
                  >
                    ยกเลิกการจอง
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
