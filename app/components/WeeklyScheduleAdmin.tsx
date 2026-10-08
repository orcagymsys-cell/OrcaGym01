'use client';
import { useState, useEffect } from 'react';
import { store } from '@/lib/supabase';
import { Booking } from '@/lib/types';

const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0,0,0,0);
  return d;
}

const COLUMNS = [
  { id: 0, label: '10.00-12.00' },
  { id: 1, label: '14.30-16.00' },
  { id: 2, label: '16.00-17.30' },
  { id: 3, label: '17.30-19.30' },
];

function getCoursesForLogicalSlot(colIndex: number, dayKey: number) {
  const isWeekend = dayKey === 0 || dayKey === 6;
  if (!isWeekend) {
    if (colIndex === 0) return [
      { course: 'Mega Orca', time: '10.30-12.30' },
      { course: 'Orca Cubs', time: '10.30-12.00' }
    ];
    if (colIndex === 1) return [{ course: 'Orca Cubs', time: '14.30-16.00' }];
    if (colIndex === 2) return [{ course: 'Orca Cubs', time: '16.00-17.30' }];
    if (colIndex === 3) {
      const res = [
        { course: 'Mega Orca', time: '17.30-19.30' }
      ];
      if (dayKey === 2 || dayKey === 3) { // Tuesday or Wednesday
        res.push({ course: 'Orca Cubs', time: '17:30-19:00' });
      } else {
        res.push({ course: 'Orca Cubs', time: '17.30-19.30' }); // fallback
      }
      if (dayKey === 4 || dayKey === 5) { // Thursday or Friday
        res.push({ course: 'ORCA FLIP', time: '17:30-19:00' });
      }
      return res;
    }
  } else {
    if (colIndex === 0) return [
      { course: 'Orca Cubs', time: '09.00-10.30' },
      { course: 'Mega Orca', time: '10.30-12.30' },
      { course: 'Orca Cubs', time: '10.30-12.00' }
    ];
    if (colIndex === 1) return [
      { course: 'Orca Cubs', time: '13.00-14.30' },
      { course: 'ORCA FLIP', time: '13.00-14.30' },
      { course: 'Mega Orca', time: '14.30-16.30' },
      { course: 'Orca Cubs', time: '14.30-16.00' }
    ];
    if (colIndex === 2) return [{ course: 'Mega Orca', time: '16.30-18.30' }];
    if (colIndex === 3) return [];
  }
  return [];
}

const DAY_CONFIG = [
  { key: 1, label: 'MON', th: 'จันทร์', color: 'bg-[#ffb347]' },
  { key: 2, label: 'TUE', th: 'อังคาร', color: 'bg-[#ff69b4]' },
  { key: 3, label: 'WED', th: 'พุธ', color: 'bg-[#2ecc71]' },
  { key: 4, label: 'THU', th: 'พฤหัส', color: 'bg-[#ff8c00]' },
  { key: 5, label: 'FRI', th: 'ศุกร์', color: 'bg-[#3b82f6]' },
  { key: 6, label: 'SAT', th: 'เสาร์', color: 'bg-[#9b59b6]' },
  { key: 0, label: 'SUN', th: 'อาทิตย์', color: 'bg-[#e74c3c]' },
];

function getChildColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash);
  const colors = [
    'from-rose-100 to-teal-100 border-teal-300 text-teal-800',
    'from-blue-100 to-indigo-100 border-indigo-300 text-indigo-800',
    'from-amber-100 to-orange-100 border-orange-300 text-orange-800',
    'from-emerald-100 to-cyan-100 border-cyan-300 text-cyan-800',
    'from-fuchsia-100 to-purple-100 border-purple-300 text-purple-800'
  ];
  return colors[index % colors.length];
}

export default function WeeklyScheduleAdmin({ allBookings }: { allBookings: Booking[] }) {
  const [quotas, setQuotas] = useState<Record<string, number>>({});
  const [courses, setCourses] = useState<any[]>([]);
  
  useEffect(() => {
    store.getSlotQuotas().then(setQuotas);
    store.getCourses().then(c => setCourses(c || []));
  }, []);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));
  const [printDateFilter, setPrintDateFilter] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; course: string; time: string; bookings: Booking[]; maxQuota: number } | null>(null);

  const handlePrevWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeekStart(newDate);
  };
  const handleNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeekStart(newDate);
  };
  const handleToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const endOfWeek = new Date(currentWeekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  const weekLabel = `${currentWeekStart.getDate()} ${THAI_MONTHS[currentWeekStart.getMonth()]} - ${endOfWeek.getDate()} ${THAI_MONTHS[endOfWeek.getMonth()]} ${endOfWeek.getFullYear() + 543}`;

  return (
    <div className="w-full">
      <style>{`@media print { @page { size: landscape; margin: 1cm; } }`}</style>
      <div className="bg-white rounded-[32px] border-4 border-slate-100 shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
        
        <div className="bg-[#001a3a] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white print:text-[#001a3a] print:bg-white print:border-b-2 print:border-slate-200">
          <div className="font-bold text-lg">{weekLabel}</div>
          <div className="flex items-center gap-2">
            <div className="print:hidden flex items-center bg-white rounded-xl overflow-hidden mr-2 border border-white shadow-sm">
              <input 
                type="date"
                className="text-xs font-bold text-[#001a3a] bg-white px-3 py-2 outline-none cursor-pointer"
                value={printDateFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setPrintDateFilter(val);
                  if (val) setCurrentWeekStart(getStartOfWeek(new Date(val)));
                }}
                title="เลือกวันที่เพื่อแสดงตารางแค่วันเดียว"
              />
              {printDateFilter && (
                <button 
                  onClick={() => setPrintDateFilter('')}
                  className="px-3 py-2 text-rose-500 hover:bg-slate-100 text-xs font-bold transition-colors"
                  title="ล้างตัวกรองวันที่"
                >
                  ✕
                </button>
              )}
            </div>
            <button onClick={() => window.print()} className="print:hidden text-xs font-bold text-[#001a3a] bg-white hover:bg-slate-100 px-4 py-2 rounded-xl border border-white shadow-sm transition-colors cursor-pointer flex items-center gap-2 mr-2">
              <span>🖨️</span> Save PDF
            </button>
            <button onClick={handlePrevWeek} className="print:hidden bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors cursor-pointer">◀</button>
            <button onClick={handleToday} className="print:hidden bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer">สัปดาห์นี้</button>
            <button onClick={handleNextWeek} className="print:hidden bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors cursor-pointer">▶</button>
          </div>
        </div>

        <div className="overflow-x-auto w-full print:overflow-visible">
          <table className="w-full min-w-[900px] print:min-w-0 border-collapse bg-slate-50/30 table-fixed">
            <thead>
              <tr className="bg-slate-100/80 border-b-2 border-slate-200">
                <th className="w-[100px] p-4 text-center font-black text-slate-500 text-sm border-r-2 border-slate-200">วัน / เวลา</th>
                {COLUMNS.map(col => (
                  <th key={col.id} className="p-4 text-center font-black text-[#001a3a] text-[15px] border-r-2 border-slate-200 last:border-r-0">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAY_CONFIG.filter((dayConfig) => {
                if (!printDateFilter) return true;
                const tmpDate = new Date(currentWeekStart);
                const tmpOffset = dayConfig.key === 0 ? 6 : dayConfig.key - 1;
                tmpDate.setDate(tmpDate.getDate() + tmpOffset);
                const tmpStr = `${tmpDate.getFullYear()}-${String(tmpDate.getMonth() + 1).padStart(2, '0')}-${String(tmpDate.getDate()).padStart(2, '0')}`;
                return tmpStr === printDateFilter;
              }).map((dayConfig) => {
                const currentDate = new Date(currentWeekStart);
                const offset = dayConfig.key === 0 ? 6 : dayConfig.key - 1;
                currentDate.setDate(currentDate.getDate() + offset);
                
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                const dayBookings = allBookings.filter(b => b.booking_date === dateStr && b.status !== 'cancelled' && b.status !== 'Cancelled');

                const isMonday = dayConfig.key === 1;
                const isWeekend = dayConfig.key === 0 || dayConfig.key === 6;

                return (
                  <tr key={dayConfig.key} className="border-b-2 border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className={`${dayConfig.color} w-[100px] p-0 align-middle border-r-2 border-slate-100`}>
                      <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-white py-4">
                        <span className="font-black text-lg">{dayConfig.label}</span>
                        <span className="text-[12px] font-bold opacity-90 mt-1">{currentDate.getDate()} {THAI_MONTHS[currentDate.getMonth()]}</span>
                      </div>
                    </td>

                    {isMonday ? (
                      <td colSpan={COLUMNS.length} className="p-0 relative">
                        <div className="w-full h-full flex items-center justify-center min-h-[120px] bg-red-50 text-red-500 font-black text-lg">
                          ❌ ปิดทำการ (CLOSED)
                        </div>
                      </td>
                    ) : (
                      COLUMNS.map(col => {
                        let staticCourses: {course: string, time: string}[] = [];
                        const hasAnySchedule = courses.some(c => c.schedule_groups && c.schedule_groups.length > 0);
                        
                        if (!hasAnySchedule) {
                          staticCourses = getCoursesForLogicalSlot(col.id, dayConfig.key);
                        } else {
                          courses.forEach(c => {
                            if (c.schedule_groups && c.schedule_groups.length > 0) {
                              c.schedule_groups.forEach((g: any) => {
                                if (!g.day_label || !g.time_slots) return;
                                const lbl = g.day_label.toLowerCase();
                                const dayOfWeek = dayConfig.key;
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
                                      ? days.findIndex(d => parts[0].includes(d)) : shortDays.findIndex(d => parts[0].includes(d));
                                    const endIdx = days.findIndex(d => parts[1].includes(d)) !== -1
                                      ? days.findIndex(d => parts[1].includes(d)) : shortDays.findIndex(d => parts[1].includes(d));
                                      
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
                                  g.time_slots.forEach((t: string) => {
                                    if (!t) return;
                                    const hourMatch = t.match(/^0?(\d+)/);
                                    const hour = hourMatch ? parseInt(hourMatch[1], 10) : 0;
                                    let targetCol = -1;
                                    if (hour < 13) targetCol = 0;
                                    else if (hour >= 13 && hour < 16) targetCol = 1;
                                    else if (hour === 16) targetCol = 2;
                                    else if (hour >= 17) targetCol = 3;
                                    
                                    if (targetCol === col.id) {
                                      staticCourses.push({ course: c.display_title, time: t });
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                        const dynamicCourses = dayBookings
                          .filter(b => {
                            const hourMatch = (b.time_slot || '').match(/^0?(\d+)/);
                            const hour = hourMatch ? parseInt(hourMatch[1], 10) : 0;
                            if (col.id === 0) return hour < 13;
                            if (col.id === 1) return hour >= 13 && hour < 16;
                            if (col.id === 2) return hour === 16;
                            if (col.id === 3) return hour >= 17;
                            return false;
                          })
                          .map(b => {
                            let cName = b.course_name || 'Orca Cubs';
                            if (cName.toLowerCase().includes('mega')) cName = 'Mega Orca';
                            else if (cName.toLowerCase().includes('flip')) cName = 'ORCA FLIP';
                            else if (cName.toLowerCase().includes('cubs')) cName = 'Orca Cubs';

                            const dbCourse = courses.find(crs => crs.display_title.toLowerCase() === cName.toLowerCase());
                            if (dbCourse) cName = dbCourse.display_title;

                            let t = (b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.');
                            if (cName.toLowerCase() === 'mega orca') {
                              if (t.startsWith('10')) t = '10.30-12.30';
                              else if (t.startsWith('14')) t = '14.30-16.30';
                              else if (t.startsWith('16')) t = '16.30-18.30';
                            } else if (cName.toLowerCase() === 'orca cubs' || cName.toLowerCase() === 'orca flip') {
                              if (t.startsWith('17')) t = '17.30-19.00';
                            }

                            return { 
                              course: cName, 
                              time: t
                            };
                          });

                        const mergedMap = new Map();
                        staticCourses.forEach(c => {
                          let cName = c.course;
                          const dbCourse = courses.find(crs => crs.display_title.toLowerCase() === cName.toLowerCase());
                          if (dbCourse) cName = dbCourse.display_title;
                          let t = c.time.replace(/:/g, '.').replace(/^(\d)\./, '0$1.');
                          if (cName.toLowerCase() === 'mega orca') {
                            if (t.startsWith('10')) t = '10.30-12.30';
                            else if (t.startsWith('14')) t = '14.30-16.30';
                            else if (t.startsWith('16')) t = '16.30-18.30';
                          } else if (cName.toLowerCase() === 'orca cubs' || cName.toLowerCase() === 'orca flip') {
                            if (t.startsWith('17')) t = '17.30-19.00';
                          }
                          mergedMap.set(`${cName}|${t}`, { course: cName, time: t });
                        });
                        dynamicCourses.forEach(c => mergedMap.set(`${c.course}|${c.time}`, c));
                        const slotCourses = Array.from(mergedMap.values()).sort((a, b) => a.time.localeCompare(b.time));
                        
                        return (
                          <td key={col.id} className="p-2 border-r-2 border-slate-100 last:border-r-0 align-top">
                            <div className="flex flex-col gap-2 h-full">
                              {slotCourses.length === 0 ? (
                                <div className="flex items-center justify-center h-full opacity-30 text-slate-400 font-bold text-xs">
                                  -
                                </div>
                              ) : (
                                slotCourses.map((c, idx) => {
                                  const bookedForThisSlot = dayBookings.filter(b => {
                                    const bCourse = (b.course_name || '').toLowerCase();
                                    const cCourse = (c.course || '').toLowerCase();
                                    let bTime = (b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.');
                                    if (cCourse === 'mega orca') {
                                      if (bTime.startsWith('10')) bTime = '10.30-12.30';
                                      else if (bTime.startsWith('14')) bTime = '14.30-16.30';
                                      else if (bTime.startsWith('16')) bTime = '16.30-18.30';
                                    } else if (cCourse === 'orca cubs' || cCourse === 'orca flip') {
                                      if (bTime.startsWith('17')) bTime = '17.30-19.00';
                                    }
                                    let cTime = (c.time || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.');
                                    return (bCourse === cCourse || bCourse.includes(cCourse.replace('orca ', ''))) && bTime === cTime;
                                  });
                                  
                                  const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                                  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                  const dayName = dayNames[currentDate.getDay()];
                                  const maxQuota = quotas[`${dateStr}_${c.course}_${c.time}`] ??
                                                   quotas[`${dayName}_${c.course}_${c.time}`] ??
                                                   quotas[`${dayName}_${c.time}`] ??
                                                   quotas[`Everyday_${c.course}_${c.time}`] ??
                                                   quotas[`Everyday_${c.time}`] ??
                                                   quotas[`${c.course}_${c.time}`] ??
                                                   quotas[`${dateStr}_${c.time}`] ??
                                                   (courses.find(crs => crs.display_title.toLowerCase() === c.course.toLowerCase())?.max_capacity || 10);
                                  
                                  const isBooked = bookedForThisSlot.length > 0;
                                  const isFull = bookedForThisSlot.length >= maxQuota;
                                  
                                  return (
                                    <div 
                                      key={`${c.course}-${c.time}-${idx}`}
                                      onClick={() => setSelectedSlot({ date: currentDate, course: c.course, time: c.time, bookings: bookedForThisSlot, maxQuota })}
                                      className={`border-[3px] rounded-2xl p-2.5 flex flex-col items-center text-center w-full cursor-pointer transition-all ${
                                        isFull
                                          ? 'bg-rose-50 border-rose-300 shadow-sm hover:bg-rose-100 hover:border-rose-400'
                                          : isBooked 
                                            ? 'bg-blue-50 border-blue-300 shadow-sm hover:bg-blue-100 hover:border-blue-400' 
                                            : 'bg-white border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
                                      }`}
                                    >
                                      <div className={`font-black text-[14px] leading-tight ${isFull ? 'text-rose-900' : isBooked ? 'text-blue-900' : 'text-slate-600'}`}>{c.course}</div>
                                      <div className={`text-[10px] font-bold mt-1 ${isFull ? 'text-rose-700' : isBooked ? 'text-blue-700' : 'text-slate-400'}`}>{c.time}</div>
                                      <div className={`mt-2.5 text-white text-[11px] px-3 py-0.5 rounded-full font-bold shadow-sm ${isFull ? 'bg-rose-500' : isBooked ? 'bg-blue-600' : 'bg-slate-400'}`}>
                                        👨‍🎓 {bookedForThisSlot.length}/{maxQuota} คน
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedSlot(null)}>
          <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#001a3a] p-5 flex justify-between items-center text-white">
              <div>
                <h3 className="font-black text-xl flex items-center gap-2"><span>📋</span> รายชื่อนักเรียน</h3>
                <p className="text-[13px] font-bold opacity-90 mt-1">
                  {selectedSlot.course} ({selectedSlot.time})<br/>
                  วันที่ {selectedSlot.date.getDate()} {THAI_MONTHS[selectedSlot.date.getMonth()]} {selectedSlot.date.getFullYear() + 543} <br/>
                  ยอดจอง {selectedSlot.bookings.length} / {selectedSlot.maxQuota} ที่นั่ง
                </p>
              </div>
              <button onClick={() => setSelectedSlot(null)} className="text-white hover:text-red-300 font-bold text-3xl px-2 cursor-pointer transition-colors">&times;</button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {selectedSlot.bookings.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  <div className="text-4xl mb-2">📭</div>
                  <div className="font-bold">ยังไม่มีผู้ลงเรียนในคลาสนี้</div>
                </div>
              ) : (
                selectedSlot.bookings.map(b => (
                  <div key={b.id} className="p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl flex justify-between items-center hover:border-blue-200 transition-colors">
                    <div>
                      <div className="font-black text-[#001a3a] text-[15px]">{b.child_nickname ? (b.child_nickname.startsWith('น้อง') ? b.child_nickname : `น้อง${b.child_nickname}`) : 'น้องนักเรียน'}</div>
                      <div className="text-[12px] font-medium text-slate-500 mt-0.5">{b.child_full_name}</div>
                    </div>
                    <span className="text-[11px] font-extrabold px-3 py-1 bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-full">ยืนยันแล้ว</span>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <button 
                onClick={() => setSelectedSlot(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl text-sm transition-colors cursor-pointer"
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
