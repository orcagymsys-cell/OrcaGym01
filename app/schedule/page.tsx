'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { store, setupRealtimeSubscriptions } from '@/lib/supabase';
import { Child, Booking, UserProfile } from '@/lib/types';
import WeeklyScheduleAdmin from '@/app/components/WeeklyScheduleAdmin';
import StudentBookingsRoster from '@/app/components/StudentBookingsRoster';

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
      { course: 'Mega Orca', time: '10:00-12:00' },
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
    // Weekend logic
    if (colIndex === 0) return [
      { course: 'Orca Cubs', time: '09.00-10.30' },
      { course: 'Mega Orca', time: '10:00-12:00' },
      { course: 'Orca Cubs', time: '10.30-12.00' }
    ];
    if (colIndex === 1) return [
      { course: 'Orca Cubs', time: '13.00-14.30' },
      { course: 'ORCA FLIP', time: '13.00-14.30' },
      { course: 'Mega Orca', time: '14:00-16:00' },
      { course: 'Orca Cubs', time: '14.30-16.00' }
    ];
    if (colIndex === 2) return [];
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

function getChildColor(index: number) {
  const colors = [
    'from-rose-100 to-teal-100 border-teal-300 text-teal-800',
    'from-blue-100 to-indigo-100 border-indigo-300 text-indigo-800',
    'from-amber-100 to-orange-100 border-orange-300 text-orange-800',
    'from-emerald-100 to-cyan-100 border-cyan-300 text-cyan-800',
    'from-fuchsia-100 to-purple-100 border-purple-300 text-purple-800'
  ];
  return colors[index % colors.length];
}

export default function SchedulePage() {
  const [mounted, setMounted] = useState(false);
  const requestRef = useRef(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [allChildren, setAllChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<UserProfile[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getStartOfWeek(new Date()));

  useEffect(() => {
    const user = store.getCurrentUser();
    if (!user) {
      setLoading(false);
      setMounted(true);
      return;
    }
    if (user.role === 'admin') {
      setIsAdmin(true);
      const bCache = store.getLocal<Booking[]>('ORCA_BOOKINGS', []);
      setAllBookings(bCache);
      setParents(store.getUsersSync().filter(u => u.role === 'parent'));
      setAllChildren(store.getChildrenSync());
    } else {
      const myKids = store.getLocal<Child[]>('ORCA_MY_KIDS', []);
      const myBookings = store.getLocal<Booking[]>('ORCA_MY_BOOKINGS', []);
      setChildren(myKids);
      setAllBookings(myBookings);
    }
    setLoading(false);  // ← Always false after mount
    setMounted(true);
  }, []);

  const loadData = async () => {
    const reqId = ++requestRef.current;
    const user = store.getCurrentUser();
    if (!user) {
      setLoading(false);
      return;
    }

    if (user.role === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }

    // --- SWR Pattern: Background Fetch from Supabase ---
    if (user.role === 'admin') {
      const [bookings, users, kids] = await Promise.all([
        store.getBookings(), store.getUsers(), store.getChildren()
      ]);
      if (reqId !== requestRef.current) return;
      setAllBookings(bookings);
      setParents(users.filter(u => u.role === 'parent'));
      setAllChildren(kids);
    } else {
      const parentUserId = user.id || user.user_id;
      const [allKids, allBookingsSys] = await Promise.all([
        store.getChildren(),  // fetch ALL, filter locally
        store.getBookings()
      ]);
      if (reqId !== requestRef.current) return;
      const kidsToSave = allKids.filter(k => k.parent_id === parentUserId);
      setChildren(kidsToSave);
      store.setLocal('ORCA_MY_KIDS', kidsToSave);
      
      if (kidsToSave.length > 0) {
        const myKidIds = kidsToSave.map(k => k.id);
        const myB = allBookingsSys.filter(b => myKidIds.includes(b.child_id));
        setAllBookings(myB);
        store.setLocal('ORCA_MY_BOOKINGS', myB);
      } else {
        setAllBookings([]);
        store.setLocal('ORCA_MY_BOOKINGS', []);
      }
    }
    
    // Ensure loading is hidden after fetch completes
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Setup Supabase Realtime for instant updates
    const cleanupRealtime = setupRealtimeSubscriptions(() => {
      loadData();
    });
    return () => {
      if (cleanupRealtime) cleanupRealtime();
    };
  }, []);

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

  // Calculate how many weeks from today
  const todayWeekStart = getStartOfWeek(new Date());
  const diffMs = currentWeekStart.getTime() - todayWeekStart.getTime();
  const diffWeeks = Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  const weekDiffLabel =
    diffWeeks === 0 ? 'สัปดาห์นี้' :
    diffWeeks === -1 ? 'สัปดาห์ที่แล้ว' :
    diffWeeks === 1 ? 'สัปดาห์หน้า' :
    diffWeeks < 0 ? `${Math.abs(diffWeeks)} สัปดาห์ที่แล้ว` :
    `${diffWeeks} สัปดาห์ข้างหน้า`;


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="w-12 h-12 border-4 border-[#001a3a] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#001a3a] font-bold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="font-['Anuphan',sans-serif] space-y-6 max-w-[1200px] mx-auto pb-20">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-black text-[#001a3a] flex items-center gap-2">
            <span>📅</span> ตารางเรียนทั้งหมด (Admin Schedule)
          </h1>
        </div>
        
        <WeeklyScheduleAdmin allBookings={allBookings} />
        <StudentBookingsRoster 
          allBookings={allBookings} 
          childrenList={allChildren} 
          parentsList={parents} 
          onBookingCancelled={loadData} 
        />
      </div>
    );
  }

  return (
    <div className="font-['Anuphan',sans-serif] space-y-6 max-w-[1200px] mx-auto pb-20">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-xl sm:text-2xl font-black text-[#001a3a] flex items-center gap-2">
          <span>📅</span> ตารางเรียนของครอบครัว
        </h1>
      </div>

      {children.length === 0 ? (
        <div className="bg-sky-50 border border-sky-200 rounded-3xl p-8 text-center">
          <div className="text-4xl mb-3">👨‍👩‍👧</div>
          <div className="font-bold text-sky-900 text-base mb-1">ยังไม่มีสมาชิกในครอบครัว</div>
          <div className="text-sm text-sky-700 mb-4">เพิ่มน้องเพื่อดูตารางเรียนของครอบครัว</div>
          <Link href="/add-child"
            className="inline-block bg-sky-600 text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-sky-700 transition-all">
            + เพิ่มสมาชิก
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border-4 border-slate-100 shadow-xl overflow-hidden">
          
          <div className="bg-[#001a3a] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="font-bold text-lg">{weekLabel}</div>
            <div className="flex items-center gap-2">
              <button onClick={handlePrevWeek} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors cursor-pointer">◀</button>
              <button
                onClick={handleToday}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${diffWeeks === 0 ? 'bg-white/20 hover:bg-white/30' : 'bg-yellow-400 hover:bg-yellow-300 text-[#001a3a]'}`}
              >
                {weekDiffLabel}
              </button>
              <button onClick={handleNextWeek} className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition-colors cursor-pointer">▶</button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[900px] border-collapse bg-slate-50/30 table-fixed">
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
                {DAY_CONFIG.map((dayConfig) => {
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
                          const slotCourses = getCoursesForLogicalSlot(col.id, dayConfig.key);
                          
                          return (
                            <td key={col.id} className="p-2 border-r-2 border-slate-100 last:border-r-0 align-top">
                              <div className="flex flex-col gap-2 h-full">
                                {slotCourses.length === 0 ? (
                                  <div className="flex items-center justify-center h-full opacity-30 text-slate-400 font-bold text-xs">
                                    -
                                  </div>
                                ) : (
                                  slotCourses.map((c, idx) => {
                                    const bookedForThisSlot = dayBookings.filter(b => b.course_name === c.course && (b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.') === (c.time || '').replace(/:/g, '.').replace(/^(\d)\./, '0$1.'));
                                    
                                    if (bookedForThisSlot.length > 0) {
                                      return bookedForThisSlot.map((b, bIdx) => {
                                        const childIdx = children.findIndex(kid => kid.id === b.child_id);
                                        const childColor = getChildColor(childIdx >= 0 ? childIdx : 0);
                                        let childName = b.child_nickname || (childIdx >= 0 ? children[childIdx].nickname : 'ไม่ทราบชื่อ');
                                        if (childName !== 'ไม่ทราบชื่อ' && !childName.startsWith('น้อง')) {
                                          childName = 'น้อง' + childName;
                                        }
                                        
                                        return (
                                          <div key={`${c.time}-${b.id}`} className={`bg-gradient-to-br ${childColor} border-[3px] rounded-2xl p-3 shadow-md flex flex-col items-center text-center animate-fade-in w-full`}>
                                            <div className="font-black text-[15px] text-[#001a3a] leading-tight">{childName}</div>
                                            <div className="text-[11px] font-extrabold opacity-90 mt-1 bg-white/50 px-2 py-0.5 rounded-full">{c.course}</div>
                                          </div>
                                        );
                                      });
                                    }

                                    return (
                                      <div key={`${c.course}-${c.time}-${idx}`} className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5 flex flex-col items-center text-center w-full">
                                        <div className="font-black text-[13px] text-slate-600 leading-tight">{c.course}</div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-1">{c.time}</div>
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
      )}
    </div>
  );
}
