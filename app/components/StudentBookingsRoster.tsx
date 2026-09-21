'use client';
import { useState, useEffect } from 'react';
import { Booking, Child, UserProfile } from '@/lib/types';
import { store } from '@/lib/supabase';
import { showToast } from '@/components/Toast';

type Props = {
  allBookings: Booking[];
  childrenList: Child[];
  parentsList: UserProfile[];
  onBookingCancelled?: () => void;
};

export default function StudentBookingsRoster({ allBookings, childrenList, parentsList, onBookingCancelled }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('All Courses');

  const [dbCourses, setDbCourses] = useState<any[]>([]);
  useEffect(() => {
    store.getCourses().then(c => setDbCourses(c || []));
  }, []);

  // Merge unique courses from DB and legacy bookings
  const dbCourseNames = dbCourses.map(c => c.display_title);
  const rawBookedCourses = allBookings.map(b => b.course_name).filter(Boolean) as string[];
  const uniqueCoursesMap = new Map<string, string>();
  
  dbCourseNames.forEach(c => uniqueCoursesMap.set(c.toLowerCase(), c));
  rawBookedCourses.forEach(c => {
    if (!uniqueCoursesMap.has(c.toLowerCase())) {
      uniqueCoursesMap.set(c.toLowerCase(), c);
    }
  });
  const courses = Array.from(uniqueCoursesMap.values());

  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const filteredBookings = allBookings.filter(b => {
    // If a specific date is selected, ignore timeFilter and just match the date
    if (selectedDateFilter) {
      if (b.booking_date !== selectedDateFilter) return false;
    } else {
      // If no specific date, apply timeFilter
      const bDate = new Date(b.booking_date);
      bDate.setHours(0, 0, 0, 0);
      if (timeFilter === 'upcoming' && bDate.getTime() < todayDate.getTime()) return false;
      if (timeFilter === 'past' && bDate.getTime() >= todayDate.getTime()) return false;
    }
    if (selectedCourseFilter !== 'All Courses' && b.course_name?.toLowerCase() !== selectedCourseFilter.toLowerCase()) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const child = childrenList.find(c => c.id === b.child_id);
      const parent = child ? parentsList.find(p => p.id === child.parent_id || p.user_id === child.parent_id) : null;
      
      const matchChildName = b.child_nickname?.toLowerCase().includes(q) || b.child_full_name?.toLowerCase().includes(q) || child?.full_name?.toLowerCase().includes(q);
      const matchParent = parent?.name?.toLowerCase().includes(q) || parent?.phone?.includes(q);
      const matchCourse = b.course_name?.toLowerCase().includes(q);
      const matchDate = b.booking_date?.includes(q);
      
      return matchChildName || matchParent || matchCourse || matchDate;
    }
    return true;
  });

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะยกเลิกการจองของน้อง ${booking.child_nickname} ในวันที่ ${booking.booking_date}?`)) return;

    try {
      const child = childrenList.find(c => c.id === booking.child_id);
      const childNameForAudit = child?.nickname || child?.full_name || booking.child_nickname || 'ไม่ทราบชื่อ';

      await store.cancelBooking(booking.id);
      
      if (child) {
        const updatedUsed = Math.max(0, child.used_hours - 1);
        await store.updateChild(child.id, { used_hours: updatedUsed });
      }
      
      const adminUser = store.getCurrentUser();
      const adminName = adminUser?.name || 'Admin';
      
      // Attempt to log to audit
      try {
        await store.saveAuditLog({
          id: `audit_${Date.now()}`,
          admin_name: adminName,
          action_type: 'cancel_booking',
          child_id: booking.child_id,
          child_name: childNameForAudit,
          course_name: booking.course_name,
          note: `ยกเลิกการจองเรียนวันที่ ${booking.booking_date} เวลา ${booking.time_slot} โดย Admin`
        });
      } catch (err) {
        console.error('Failed to log audit:', err);
      }
      
      showToast('ยกเลิกการจองสำเร็จ');
      if (onBookingCancelled) onBookingCancelled();
    } catch (error: any) {
      console.error('Cancel booking error:', error);
      showToast(error.message || 'เกิดข้อผิดพลาดในการยกเลิกการจอง');
    }
  };

  const getThemeStyles = (courseName?: string) => {
    const isMega = courseName?.toLowerCase().includes('mega');
    return isMega
      ? { badgeBgColor: '#eff6ff', badgeTextColor: '#1d4ed8', badgeBorderColor: '#bfdbfe' }
      : { badgeBgColor: '#fdf4ff', badgeTextColor: '#a21caf', badgeBorderColor: '#fbcfe8' };
  };

  const groupedBookings = filteredBookings.reduce((acc, b) => {
    const key = `${b.booking_date} | ${b.time_slot} | ${b.course_name || 'Orca Cubs'}`;
    if (!acc[key]) {
      acc[key] = {
        date: b.booking_date,
        time: b.time_slot,
        course: b.course_name || 'Orca Cubs',
        bookings: []
      };
    }
    acc[key].bookings.push(b);
    return acc;
  }, {} as Record<string, { date: string, time: string, course: string, bookings: Booking[] }>);

  const sortedGroups = Object.values(groupedBookings).sort((a, b) => {
    if (a.date !== b.date) {
      if (timeFilter === 'upcoming') {
        return new Date(a.date).getTime() - new Date(b.date).getTime(); // ASCENDING: Closest upcoming date first
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime(); // DESCENDING: Most recent past date first
      }
    }
    if (a.time !== b.time) return a.time.localeCompare(b.time);
    return a.course.localeCompare(b.course);
  });

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm mt-8 space-y-5 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-4">
      
      {/* Title and Subtitle Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-[#001a3a] flex items-center gap-2">
            <span>📅</span>
            <span>ตารางรายการเด็กที่จองเวลาเรียนเข้ามาทั้งหมด (Student Bookings Roster)</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            แสดงรายการจองเรียนทั้งหมดในระบบ สามารถค้นหา กรองตามคลาสเรียน หรือทำการยกเลิกการจองได้
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto shrink-0">
          <div className="flex items-center gap-2 print:hidden bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <span className="text-sm">📅</span>
            <input 
              type="date"
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
              className="outline-none text-xs font-bold text-slate-700 bg-transparent cursor-pointer"
            />
            {selectedDateFilter && (
              <button 
                onClick={() => setSelectedDateFilter('')}
                className="text-slate-400 hover:text-rose-500 transition-colors ml-1 font-bold flex items-center justify-center w-4 h-4"
                title="ล้างวันที่"
              >
                ✕
              </button>
            )}
          </div>
          <button onClick={() => window.print()} className="print:hidden text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl border border-blue-700 shadow-sm transition-colors cursor-pointer flex items-center gap-2">
            <span>🖨️</span> Save as PDF / พิมพ์
          </button>
          <div className="print:hidden text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300">
            ทั้งหมด {filteredBookings.length} รายการ
          </div>
        </div>
        <div className="hidden sm:flex text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-300 self-start shrink-0 items-center justify-center">
          ทั้งหมด {sortedGroups.reduce((sum, g) => sum + g.bookings.length, 0)} รายการ
        </div>
      </div>

      {!selectedDateFilter && (
        <div className="print:hidden border-b border-slate-200 pb-2">
          <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
            <button 
              type="button"
              onClick={() => setTimeFilter('upcoming')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${timeFilter === 'upcoming' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              รายการจองที่จะมาถึง (Upcoming)
            </button>
            <button 
              type="button"
              onClick={() => setTimeFilter('past')}
              className={`px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${timeFilter === 'past' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              ประวัติการจองที่ผ่านมา (Past)
            </button>
          </div>
        </div>
      )}

      {/* Course Filter Pill Bar */}
      <div className="print:hidden">
      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-2">
          เลือกดูแยกตามคลาสเรียน (Filter by Course):
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {['All Courses', ...courses].map((courseName) => {
            const isSelected = selectedCourseFilter.toLowerCase() === courseName.toLowerCase();
            const count = courseName === 'All Courses'
              ? allBookings.length
              : allBookings.filter(b => b.course_name?.toLowerCase() === courseName.toLowerCase()).length;

            return (
              <button
                key={courseName}
                type="button"
                onClick={() => setSelectedCourseFilter(courseName)}
                className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#001a3a] text-white border-[#001a3a] shadow-md ring-2 ring-blue-900/30'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{courseName === 'All Courses' ? '🌐 All Courses' : `🏊 ${courseName}`}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      {/* Search Bar Row */}
      <div className="print:hidden flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อเด็ก / ผู้ปกครอง / เบอร์โทร / คลาส / วันที่..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-[#001a3a] placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 rounded-full w-4 h-4 flex items-center justify-center border-none cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="text-xs font-bold text-slate-500 self-end sm:self-center">
            ผลการค้นหา: {filteredBookings.length} รายการ
          </div>
        )}
      </div>

      {/* Grouped Tables Render */}
      {sortedGroups.length === 0 ? (
        <div className="p-8 text-center text-slate-400 font-bold bg-slate-50/50 rounded-2xl border border-slate-200 mt-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">📭</span>
            <span>ไม่พบข้อมูลรายการจองเด็กที่ตรงตามเงื่อนไข</span>
          </div>
        </div>
      ) : (
        <div className="space-y-8 mt-4">
          {sortedGroups.map((group, groupIdx) => {
            const theme = getThemeStyles(group.course);
            return (
              <div key={groupIdx} className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs print:shadow-none print:border-black print:overflow-visible print:mb-8 bg-white">
                <div className="bg-[#001a3a] text-white p-3 sm:p-4 border-b border-blue-950 flex flex-wrap items-center justify-between gap-3 print:bg-slate-200 print:text-black print:border-black print:break-after-avoid">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black bg-white/20 px-3 py-1 rounded-xl inline-flex items-center gap-2 print:bg-white print:border print:border-black">
                      <span>🗓️</span> {group.date}
                    </span>
                    <span className="text-lg font-black bg-white/20 px-3 py-1 rounded-xl inline-flex items-center gap-2 print:bg-white print:border print:border-black">
                      <span>⏰</span> {group.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-4 py-1.5 rounded-full text-sm font-black border-2 print:border-black"
                      style={{
                        backgroundColor: theme.badgeBgColor,
                        color: theme.badgeTextColor,
                        borderColor: theme.badgeBorderColor
                      }}
                    >
                      {group.course}
                    </span>
                    <span className="text-sm font-bold bg-blue-800 px-3 py-1.5 rounded-full print:bg-white print:text-black print:border print:border-black">
                      👥 {group.bookings.length} คน
                    </span>
                  </div>
                </div>
                
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="print:table-header-group">
                    <tr className="bg-slate-50 border-b border-slate-200 font-black print:bg-slate-100 print:border-black print:break-inside-avoid">
                      <th className="p-3 sm:p-3.5 font-black whitespace-nowrap w-12 text-center">ลำดับ</th>
                      <th className="p-3 sm:p-3.5 font-black whitespace-nowrap">ชื่อนักเรียน</th>
                      <th className="p-3 sm:p-3.5 font-black whitespace-nowrap">ผู้ปกครอง & เบอร์โทร</th>
                      <th className="print:hidden p-3 sm:p-3.5 font-black whitespace-nowrap text-center">สถานะ</th>
                      <th className="p-3 sm:p-3.5 font-black whitespace-nowrap text-center print:w-32">เช็คชื่อ (Check-in)</th>
                      <th className="print:hidden p-3 sm:p-3.5 font-black whitespace-nowrap text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="print:table-row-group">
                    {group.bookings.map((b, index) => {
                      const child = childrenList.find(c => c.id === b.child_id);
                      const parent = child ? parentsList.find(u => u.id === child.parent_id || u.user_id === child.parent_id) : null;

                      return (
                        <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors print:border-slate-300 print:break-inside-avoid">
                          <td className="p-3 sm:p-3.5 text-center font-bold text-slate-500">
                            {index + 1}
                          </td>
                          <td className="p-3 sm:p-3.5">
                            <div className="font-black text-[#001a3a] text-sm flex items-center flex-wrap gap-1">
                              {b.child_nickname ? (b.child_nickname.startsWith('น้อง') ? b.child_nickname : `น้อง${b.child_nickname}`) : 'น้องนักเรียน'}
                              {parent?.purchased_hours === 2 && (
                                <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-bold ml-1 shadow-sm">
                                  ฟรี
                                </span>
                              )}
                            </div>
                            {b.child_full_name && (
                              <div className="text-[11px] font-medium text-slate-500">
                                {b.child_full_name}
                              </div>
                            )}
                          </td>

                          {/* Parent & Phone */}
                          <td className="p-3 sm:p-3.5">
                            {parent ? (
                              <div>
                                <div className="font-bold text-slate-800">{parent.name}</div>
                                <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                                  <span>📞</span>
                                  <span>{parent.phone}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-slate-500 font-medium">
                                {child ? `ผู้ปกครอง (${child.parent_id})` : 'ผู้ปกครอง'}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="print:hidden p-3 sm:p-3.5 text-center">
                            {b.status === 'Cancelled' || b.status === 'cancelled' ? (
                              <span className="bg-rose-50 text-rose-700 border border-rose-300 px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1">
                                <span>❌</span>
                                <span>ยกเลิกแล้ว</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-extrabold inline-flex items-center gap-1">
                                <span>✅</span>
                                <span>{b.status === 'confirmed' ? 'ยืนยันแล้ว' : b.status}</span>
                              </span>
                            )}
                          </td>

                          {/* Check-in */}
                          <td className="p-3 sm:p-3.5 text-center">
                            <div className="w-6 h-6 border-2 border-slate-300 rounded mx-auto print:border-black print:w-8 print:h-8"></div>
                          </td>

                          {/* Action */}
                          <td className="print:hidden p-3 sm:p-3.5 text-center">
                            {(b.status !== 'Cancelled' && b.status !== 'cancelled') ? (
                              <button
                                type="button"
                                onClick={() => handleCancelBooking(b)}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto shadow-2xs"
                              >
                                <span>🗑️</span>
                                <span>ยกเลิกโดย Admin</span>
                              </button>
                            ) : (
                              <span className="text-slate-300 font-bold text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
