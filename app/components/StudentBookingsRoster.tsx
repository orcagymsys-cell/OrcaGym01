'use client';
import { useState } from 'react';
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

  // Derive unique courses from bookings
  const courses = Array.from(new Set(allBookings.map(b => b.course_name).filter(Boolean)));

  const filteredBookings = allBookings.filter(b => {
    // Exclude cancelled if preferred, or keep them. Let's keep them so admin can see, but maybe they want to see active only?
    // The previous implementation kept them and showed status.
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
  }).sort((a, b) => new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime());

  const handleCancelBooking = async (booking: Booking) => {
    if (!confirm(`คุณแน่ใจหรือไม่ที่จะยกเลิกการจองของน้อง ${booking.child_nickname} ในวันที่ ${booking.booking_date}?`)) return;

    try {
      const child = childrenList.find(c => c.id === booking.child_id);
      const childNameForAudit = child?.nickname || child?.full_name || booking.child_nickname || 'ไม่ทราบชื่อ';

      await store.cancelBooking(booking.id);
      
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
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <button onClick={() => window.print()} className="print:hidden text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl border border-blue-700 shadow-sm transition-colors cursor-pointer flex items-center gap-2">
            <span>🖨️</span> Save as PDF / พิมพ์
          </button>
          <div className="print:hidden text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300">
            ทั้งหมด {filteredBookings.length} รายการ
          </div>
        </div>
        <div className="hidden text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-300 self-start sm:self-auto shrink-0">
          ทั้งหมด {filteredBookings.length} รายการ
        </div>
      </div>

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

      {/* Table Render */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs print:shadow-none print:border-black print:overflow-visible">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#001a3a] text-white border-b border-blue-950 font-black print:bg-slate-200 print:text-black print:border-black">
              <th className="p-3 sm:p-3.5 font-black whitespace-nowrap">วันที่เรียน</th>
              <th className="p-3 sm:p-3.5 font-black whitespace-nowrap">เวลาเรียน</th>
              <th className="p-3 sm:p-3.5 font-black whitespace-nowrap">ชื่อนักเรียน</th>
              <th className="p-3 sm:p-3.5 font-black whitespace-nowrap">คลาสเรียน</th>
              <th className="p-3 sm:p-3.5 font-black whitespace-nowrap">ผู้ปกครอง & เบอร์โทร</th>
              <th className="print:hidden p-3 sm:p-3.5 font-black whitespace-nowrap text-center">สถานะ</th>
              <th className="hidden print:table-cell p-3 sm:p-3.5 font-black whitespace-nowrap text-center">เช็คชื่อ</th>
              <th className="print:hidden p-3 sm:p-3.5 font-black whitespace-nowrap text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 font-bold bg-slate-50/50">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📭</span>
                    <span>ไม่พบข้อมูลรายการจองเด็กที่ตรงตามเงื่อนไข</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredBookings.map((b) => {
                const child = childrenList.find(c => c.id === b.child_id);
                const parent = child ? parentsList.find(u => u.id === child.parent_id || u.user_id === child.parent_id) : null;
                const theme = getThemeStyles(b.course_name);

                return (
                  <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors print:border-slate-300">
                    {/* Date */}
                    <td className="p-3 sm:p-3.5 font-extrabold text-slate-800 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <span>🗓️</span>
                        <span>{b.booking_date}</span>
                      </span>
                    </td>

                    {/* Time Slot */}
                    <td className="p-3 sm:p-3.5 font-bold text-slate-700 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800 font-extrabold border border-slate-200">
                        <span>⏰</span>
                        <span>{b.time_slot}</span>
                      </span>
                    </td>

                    {/* Student Name */}
                    <td className="p-3 sm:p-3.5">
                      <div className="font-black text-[#001a3a] text-sm">
                        {b.child_nickname ? (b.child_nickname.startsWith('น้อง') ? b.child_nickname : `น้อง${b.child_nickname}`) : 'น้องนักเรียน'}
                      </div>
                      {b.child_full_name && (
                        <div className="text-[11px] font-medium text-slate-500">
                          {b.child_full_name}
                        </div>
                      )}
                    </td>

                    {/* Course */}
                    <td className="p-3 sm:p-3.5">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-black border inline-block"
                        style={{
                          backgroundColor: theme.badgeBgColor,
                          color: theme.badgeTextColor,
                          borderColor: theme.badgeBorderColor
                        }}
                      >
                        {b.course_name}
                      </span>
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
                    <td className="hidden print:table-cell p-3 sm:p-3.5 text-center">
                      <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto print:border-black"></div>
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
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
