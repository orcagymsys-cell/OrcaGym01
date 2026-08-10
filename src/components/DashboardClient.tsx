'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { deleteChild, updateChild } from '@/app/actions/children';
import { cancelBooking } from '@/app/actions/booking';
import { useRouter } from 'next/navigation';
import { Trash2, Edit2, X, Save, ZoomIn, Move, ChevronRight, ArrowLeft, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { Child, Gender, User, GymClass, Schedule, Booking } from '@/lib/types';
import { kanit } from '@/lib/fonts';

function processCroppedImage(imageSrc: string, zoom: number, offsetX: number, offsetY: number): Promise<string> {
  return new Promise((resolve) => {
    if (!imageSrc) return resolve('');
    if (zoom === 1 && offsetX === 0 && offsetY === 0) return resolve(imageSrc);

    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 300;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageSrc);

      ctx.fillStyle = '#95b8d1';
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      const cx = size / 2;
      const cy = size / 2;
      ctx.translate(cx + offsetX * 2.5, cy + offsetY * 2.5);
      ctx.scale(zoom, zoom);

      const aspect = img.width / img.height;
      let drawW = size;
      let drawH = size;
      if (aspect > 1) {
        drawW = size * aspect;
      } else {
        drawH = size / aspect;
      }

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(imageSrc);
  });
}

export default function DashboardClient({ 
  childrenData, 
  parentUser,
  classes = [],
  schedules = [],
  bookings = []
}: { 
  childrenData: Child[];
  parentUser?: User | null;
  classes?: GymClass[];
  schedules?: Schedule[];
  bookings?: Booking[];
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedChildId, setExpandedChildId] = useState<string | null>(null);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editForm, setEditForm] = useState<{ full_name: string; nickname: string; dob: string; gender: Gender; photo_url?: string }>({
    full_name: '',
    nickname: '',
    dob: '',
    gender: 'Girl',
    photo_url: ''
  });
  
  // Image position controls
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, photo_url: reader.result as string }));
        setZoom(1);
        setOffsetX(0);
        setOffsetY(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (window.confirm('Are you sure you want to delete this child?')) {
      setLoadingId(id);
      const res = await deleteChild(id);
      if (res?.error) {
        alert(res.error);
      }
      router.refresh();
      setLoadingId(null);
    }
  };

  const handleEditClick = (child: Child) => {
    setEditingChild(child);
    setEditForm({
      full_name: child.full_name,
      nickname: child.nickname,
      dob: child.dob,
      gender: child.gender,
      photo_url: (child as any).photo_url || ''
    });
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setError('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    setSaveLoading(true);
    setError('');

    let finalPhotoUrl = editForm.photo_url || '';
    if (finalPhotoUrl && (zoom !== 1 || offsetX !== 0 || offsetY !== 0)) {
      finalPhotoUrl = await processCroppedImage(finalPhotoUrl, zoom, offsetX, offsetY);
    }

    // If it's a new photo (base64 data URL), upload it to Storage
    if (finalPhotoUrl && finalPhotoUrl.startsWith('data:image/')) {
      try {
        const resFetch = await fetch(finalPhotoUrl);
        const blob = await resFetch.blob();
        const fileExt = blob.type.split('/')[1] || 'jpeg';
        const fileName = `${editingChild.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          finalPhotoUrl = publicUrlData.publicUrl;
        } else {
          console.error('Failed to upload avatar to storage:', uploadError);
        }
      } catch (e) {
        console.error('Error processing image upload:', e);
      }
    }

    const res = await updateChild(editingChild.id, {
      ...editForm,
      photo_url: finalPhotoUrl
    });

    if (res.error) {
      setError(res.error);
    } else {
      setEditingChild(null);
      router.refresh();
    }
    setSaveLoading(false);
  };

  return (
    <div className="w-full">
      {/* ⚠️ Expiry & Remaining Hours Alert Banner */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiryAlerts: Array<{
          childNickname: string;
          courseTitle: string;
          lastBookingDate: string;
          displayDateStr: string;
          daysLeft: number;
          remainingClasses: number;
        }> = [];

        childrenData.forEach(child => {
          const childCourseId = (child as any).assigned_course_id;
          const familyCourse = parentUser?.courses_purchased?.find(cp => cp.class_id === childCourseId || cp.class_title === child.assigned_course_title) || parentUser?.courses_purchased?.[0];
          const remainingClasses = familyCourse ? familyCourse.remaining_classes : (child.remaining_classes || 0);
          const courseTitle = familyCourse?.class_title || child.assigned_course_title || 'คลาสเรียน';

          const activeBookings = bookings
            .filter(b => b.child_id === child.id && b.status !== 'cancelled')
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          if (activeBookings.length > 0) {
            const lastBk = activeBookings[activeBookings.length - 1];
            const [y, m, d] = lastBk.date.split('-').map(Number);
            const lastBkDate = new Date(y, m - 1, d);
            lastBkDate.setHours(0, 0, 0, 0);

            const diffTime = lastBkDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // Format date e.g. Tue-10-Aug-2026
            let displayDateStr = lastBk.date;
            if (lastBk.date && lastBk.date.includes('-')) {
              const dateObj = new Date(y, m - 1, d);
              if (!isNaN(dateObj.getTime())) {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                displayDateStr = `${dayNames[dateObj.getDay()]}-${String(d).padStart(2, '0')}-${monthNames[dateObj.getMonth()]}-${y}`;
              }
            }

            // Alert condition: remaining_classes is low (<= 2) AND we are within 5 days of the last booking (or it has passed)
            if (remainingClasses <= 2 && diffDays <= 5) {
              expiryAlerts.push({
                childNickname: child.nickname,
                courseTitle,
                lastBookingDate: lastBk.date,
                displayDateStr,
                daysLeft: diffDays,
                remainingClasses
              });
            }
          }
        });

        if (expiryAlerts.length === 0) return null;

        return (
          <div className={`w-full max-w-2xl sm:max-w-3xl mx-auto bg-amber-50/90 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 mb-6 shadow-md ${kanit.className}`}>
            <div className="flex items-start space-x-3 sm:space-x-4">
              <span className="text-2xl sm:text-3xl animate-pulse shrink-0 leading-none pt-0.5">
                ⚠️
              </span>
              <div className="flex-1">
                <h3 className="font-black text-base sm:text-lg text-amber-950 flex items-center gap-2">
                  <span>แจ้งเตือน: ชั่วโมงเรียนที่ซื้อใกล้หมด (Course Expiry Alert)</span>
                </h3>
                <div className="mt-2.5 space-y-2 text-xs sm:text-sm text-amber-900 font-bold">
                  {expiryAlerts.map((alert, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                      <div>
                        <span>คลาสเรียน <span className="font-black text-[#1a2d5c]">{alert.courseTitle}</span> (น้อง {alert.childNickname})</span>
                        <span className="block text-xs text-slate-600 font-semibold mt-0.5">
                          รอบจองสุดท้ายคือวันที่ <span className="font-extrabold text-amber-800">{alert.displayDateStr}</span>
                          {alert.daysLeft === 0 ? (
                            <span className="text-rose-600 font-black ml-1">(เรียนวันนี้!)</span>
                          ) : alert.daysLeft > 0 ? (
                            <span className="text-amber-700 font-extrabold ml-1">(เหลือเวลาอีก {alert.daysLeft} วัน)</span>
                          ) : null}
                        </span>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="px-3 py-1 bg-amber-500 text-white rounded-full font-black text-xs shadow-2xs">
                          เหลือ {alert.remainingClasses} ครั้ง
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm sm:text-base text-amber-950 font-extrabold mt-3.5 leading-normal not-italic">
                  💡 กรุณาติดต่อแอดมินล่วงหน้าเพื่อเติมชั่วโมงเรียนหรือสั่งซื้อคลาสเพิ่มเติมครับ
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Family Basket (Shopee Cart Style) */}
      {parentUser?.courses_purchased && parentUser.courses_purchased.length > 0 && (
        <div className="w-full max-w-2xl sm:max-w-3xl mx-auto mb-8 flex flex-wrap gap-6 px-2 justify-center sm:justify-start">
          {parentUser.courses_purchased.map((cp, idx) => (
            <div key={cp.class_id || idx} className="flex items-center space-x-4 bg-white/50 backdrop-blur-sm p-3 rounded-2xl">
              <div className="relative shrink-0">
                <ShoppingCart size={36} className="text-[#1a2d5c]" strokeWidth={2.5} />
                <span className="absolute -top-2 -right-4 bg-rose-500 text-white text-[10px] sm:text-xs font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                  {cp.remaining_classes}/{cp.total_classes}
                </span>
              </div>
              <div>
                <h2 className="font-black text-sm sm:text-base text-[#1a2d5c]">ตะกร้าเรียนครอบครัว</h2>
                <h3 className="font-bold text-xs sm:text-sm text-sky-600">{cp.class_title}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
      {childrenData.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No family members added yet.</p>
          <Link 
            href="/family/add" 
            className="px-6 py-2 bg-[#183363] text-white rounded-full font-semibold hover:bg-[#112448]"
          >
            + Add Family Member
          </Link>
        </div>
      ) : (
        <div className="w-full flex flex-col items-center space-y-10">
          {childrenData.map(child => {
            const formattedDob = child.dob ? new Date(child.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
            return (
              <div key={child.id} className={`flex flex-col items-center w-full transition-all duration-300 relative group px-1 sm:px-4 ${expandedChildId === child.id ? 'max-w-7xl' : 'max-w-2xl sm:max-w-3xl'}`}>
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between w-full space-y-6 sm:space-y-0">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-8 w-full">
                    <Link 
                      href={`/child/${child.id}`}
                      className="shrink-0 mb-4 sm:mb-0 relative group/avatar cursor-pointer"
                      title={`คลิกที่รูปน้อง ${child.nickname} เพื่อเข้าดูตารางเรียน (My Class)`}
                    >
                      <div className="w-[120px] h-[120px] sm:w-[140px] sm:h-[140px] rounded-full bg-[#95b8d1] flex items-center justify-center overflow-hidden border-[3px] border-transparent group-hover/avatar:border-sky-500 group-hover/avatar:scale-105 group-hover/avatar:shadow-md relative transition-all duration-200">
                        {(child as any).photo_url ? (
                           <img src={(child as any).photo_url} alt={child.nickname} className="w-full h-full object-cover" />
                        ) : (
                           <span className="text-white font-bold text-5xl">{child.nickname[0]}</span>
                        )}
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xs text-center p-1">
                          <span>ดู My Class ↗</span>
                        </div>
                      </div>
                    </Link>
                    <div className="flex flex-col items-center sm:items-start flex-1 text-[#1a2d5c] w-full">
                      <div className="font-semibold text-[20px] sm:text-[22px] mb-1 flex flex-wrap items-baseline gap-x-2 text-center sm:text-left">
                        <span className="shrink-0">Name-Surname:</span>
                        <span className="text-[#3b82f6] font-bold leading-normal">{child.full_name}</span>
                      </div>
                      <div className="font-semibold text-[20px] sm:text-[22px] mb-1 flex flex-wrap items-baseline gap-x-2 text-center sm:text-left">
                        <span className="shrink-0">Nickname:</span>
                        <span className="text-[#3b82f6] font-bold">น้อง {child.nickname}</span>
                      </div>
                      <div className="font-semibold text-[18px] sm:text-[20px] mb-1 flex flex-wrap items-baseline gap-x-2 text-center sm:text-left">
                        <span className="shrink-0">Birthday:</span>
                        <span className="text-[#3b82f6] font-bold">{formattedDob}</span>
                      </div>
                      <div className="font-semibold text-[18px] sm:text-[20px] mb-1 flex flex-wrap items-baseline gap-x-2 text-center sm:text-left">
                        <span className="shrink-0">Gender:</span>
                        <span className="text-[#3b82f6] font-bold">{child.gender}</span>
                      </div>
                      <div className="font-semibold text-[16px] sm:text-[18px] mt-1 flex flex-wrap items-center gap-x-2 text-center sm:text-left">
                        <span className="shrink-0 text-slate-700">คลาสเรียน:</span>
                        <span className="text-[#1a2d5c] font-black">{child.assigned_course_title || 'Orca Cubs Class'}</span>
                        {child.status === 'pending' ? (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300">
                            ⏳ รอแอดมินอนุมัติสิทธิ์คลาส
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
                            ✅ อนุมัติสิทธิ์แล้ว
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center flex-wrap gap-3 mt-6 w-full justify-center sm:justify-start sm:pl-[172px]">
                  <Link 
                    href={`/child/${child.id}`}
                    className="px-6 py-2 bg-[#1a2d5c] text-white rounded-full font-bold text-lg hover:bg-[#111d3d] transition-all shadow-[0_3px_0_0_#ef4444,0_3px_0_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0_0_0_0_#ef4444] whitespace-nowrap"
                  >
                    Booking Course
                  </Link>
                  <button 
                    onClick={() => setExpandedChildId(expandedChildId === child.id ? null : child.id)}
                    className={`px-6 py-2 rounded-full font-bold text-lg transition-all shadow-[0_3px_0_0_#ef4444,0_3px_0_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0_0_0_0_#ef4444] whitespace-nowrap cursor-pointer ${
                      expandedChildId === child.id ? 'bg-[#1a2d5c] text-white' : 'bg-white text-[#1a2d5c] hover:bg-gray-50'
                    }`}
                  >
                    {expandedChildId === child.id ? 'Hide Course Schedule ▲' : 'My Course'}
                  </button>
                  <button
                    onClick={() => handleEditClick(child)}
                    className="px-5 py-2 bg-sky-100 text-[#1a2d5c] rounded-full font-bold text-lg hover:bg-sky-200 transition-all shadow-[0_3px_0_0_#3b82f6,0_3px_0_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0_0_0_0_#3b82f6] whitespace-nowrap flex items-center space-x-1"
                  >
                    <Edit2 size={18} />
                    <span>Edit</span>
                  </button>
                </div>
                
                <button 
                  onClick={(e) => handleDelete(e, child.id)}
                  disabled={loadingId === child.id}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 hidden sm:block"
                  title="Delete child"
                >
                  {loadingId === child.id ? <span className="animate-spin text-xl">↻</span> : <Trash2 size={24} />}
                </button>

                {/* Inline SCHEDULE Panel when My Course is clicked */}
                {expandedChildId === child.id && (
                  <div className="w-full mt-6 bg-white border-2 border-[#1a2d5c] rounded-3xl p-5 shadow-lg text-[#1a2d5c] space-y-6 animate-fadeIn">
                    {/* Header Summary Card */}
                    <div className="w-full bg-sky-50 border border-sky-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#95b8d1] border-2 border-white shadow-xs shrink-0 flex items-center justify-center">
                          {(child as any).photo_url ? (
                            <img src={(child as any).photo_url} alt={child.nickname} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white font-black text-lg">{child.nickname[0]}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-base text-[#1a2d5c]">น้อง {child.nickname} ({child.full_name})</h3>
                          {(() => {
                            const childCourseId = (child as any).assigned_course_id;
                            const familyCourse = parentUser?.courses_purchased?.find(cp => cp.class_id === childCourseId || cp.class_title === child.assigned_course_title) || parentUser?.courses_purchased?.[0];
                            const totalClasses = familyCourse ? familyCourse.total_classes : (child.total_classes || 10);
                            const remainingClasses = familyCourse ? familyCourse.remaining_classes : (child.remaining_classes || 10);
                            return (
                              <div className="mt-0.5">
                                <span className="text-xs font-extrabold bg-white text-[#1a2d5c] px-2.5 py-0.5 rounded-lg border border-sky-300 flex items-center w-fit space-x-1">
                                  <ShoppingCart size={14} className="text-[#1a2d5c]" />
                                  <span>{familyCourse?.class_title || child.assigned_course_title || 'Mega Orca'}: จองแล้ว <span className="text-amber-600 font-black">{totalClasses - remainingClasses}</span>/{totalClasses} ครั้ง</span>
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/child/${child.id}`}
                          className="px-4 py-2 bg-[#1a2d5c] text-white rounded-xl font-bold text-xs hover:bg-[#111d3d] transition-all shadow-xs shrink-0 flex items-center space-x-1"
                        >
                          <span>+ จองคลาสเรียนเพิ่ม</span>
                          <ChevronRight size={14} />
                        </Link>
                        <button
                          onClick={() => setExpandedChildId(null)}
                          className="px-3.5 py-2 bg-white text-[#1a2d5c] hover:bg-slate-100 border-2 border-[#1a2d5c] rounded-xl font-bold text-xs transition-all shrink-0 flex items-center space-x-1 cursor-pointer"
                        >
                          <ArrowLeft size={14} />
                          <span>← ย้อนกลับ</span>
                        </button>
                      </div>
                    </div>

                    {/* WEEKLY SCHEDULE MATRIX TABLE */}
                    {(() => {
                      const childBookings = bookings.filter(b => b.child_id === child.id && b.status !== 'cancelled');

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

                      const parseDayCodeLocal = (dateStr: string) => {
                        if (!dateStr) return '';
                        const [y, m, d] = dateStr.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        const dayCodes = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
                        return dayCodes[dateObj.getDay()];
                      };

                      const startTimesMatchLocal = (slotTime: string, matrixTime: string) => {
                        const normSlot = (slotTime || '').replace(/\./g, ':').trim();
                        const normMatrix = (matrixTime || '').replace(/\./g, ':').trim();
                        if (!normSlot || !normMatrix) return false;
                        if (normSlot === normMatrix) return true;
                        return normSlot.split('-')[0].trim() === normMatrix.split('-')[0].trim();
                      };

                      const getBookingsForCell = (dayCode: string, timeSlot: string) => {
                        return childBookings.filter(b => {
                          const bDayCode = parseDayCodeLocal(b.date);
                          if (bDayCode !== dayCode) return false;

                          const timeStr = (b as any).time_slot || (b as any).timeSlot || ((b as any).schedule?.start_time ? `${(b as any).schedule?.start_time}-${(b as any).schedule?.end_time}` : '');
                          return startTimesMatchLocal(timeStr, timeSlot);
                        });
                      };

                      return (
                        <div className="w-full space-y-6">
                          <div className="w-full overflow-x-auto border-2 border-[#1a2d5c] rounded-2xl shadow-sm bg-white">
                            <table className="w-full border-collapse text-center text-xs">
                              <thead>
                                <tr className="bg-[#1a2d5c] text-white font-black">
                                  <th className="p-2.5 border-r border-blue-900 w-20 sm:w-24 text-[11px] sm:text-xs">Day / Time</th>
                                  {timeslots.map(t => (
                                    <th key={t} className="p-1 sm:p-2 border-r border-blue-900 font-bold text-[9px] sm:text-[11px] leading-tight w-auto">
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
                                                const gymClass = classes.find(c => c.id === (bk as any).class_id || c.id === bk.schedule_id) || classes[0];
                                                
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

                                                return (
                                                  <div
                                                    key={bk.id}
                                                    className="p-2 rounded-xl border border-sky-300 bg-sky-100 text-[#1a2d5c] shadow-xs text-left text-[11px] leading-tight space-y-1 hover:shadow-md transition-shadow relative"
                                                  >
                                                    <div className="font-black text-blue-950 flex items-center justify-between">
                                                      <span>{gymClass?.title || gymClass?.name}</span>
                                                      <button
                                                        onClick={async () => {
                                                          if (confirm('คุณต้องการยกเลิกการจองคลาสเรียนนี้ใช่หรือไม่? (ต้องทำล่วงหน้าอย่างน้อย 1 วัน)')) {
                                                            const res = await cancelBooking(bk.id);
                                                            if (res.error) alert(res.error);
                                                            else router.refresh();
                                                          }
                                                        }}
                                                        className="text-rose-500 hover:text-rose-700 font-black p-0.5"
                                                        title="Cancel booking"
                                                      >
                                                        ×
                                                      </button>
                                                    </div>
                                                    <div className="text-[10px] font-semibold text-slate-600">
                                                      📅 {displayDateStr}
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

                          {/* BOTTOM LIST: รายการคลาสเรียนที่จองไว้ทั้งหมด */}
                          <div className="w-full bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
                            <h4 className="font-black text-base text-[#1a2d5c] mb-4 border-b pb-2 flex items-center justify-between">
                              <span>รายการคลาสเรียนที่จองไว้ทั้งหมด ({childBookings.length} รายการ)</span>
                            </h4>

                            {childBookings.length === 0 ? (
                              <p className="text-slate-400 text-xs italic text-center py-4">
                                ยังไม่มีรายการจองคลาสเรียนสำหรับน้อง {child.nickname}
                              </p>
                            ) : (
                              <div className="divide-y divide-slate-100">
                                {childBookings.map(bk => {
                                  const gymClass = classes.find(c => c.id === (bk as any).class_id || c.id === bk.schedule_id) || classes[0];
                                  const slotTime = (bk as any).time_slot || (bk as any).timeSlot || '10:30-12:00';
                                  
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

                                  return (
                                    <div key={bk.id} className="py-3 flex items-center justify-between flex-wrap gap-2 hover:bg-slate-50 px-2 rounded-xl">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-full bg-[#95b8d1] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                                          {(child as any)?.photo_url ? (
                                            <img src={(child as any).photo_url} alt={child?.nickname} className="w-full h-full object-cover" />
                                          ) : (
                                            <span className="font-bold">{child?.nickname ? child.nickname[0] : '👧🏻'}</span>
                                          )}
                                        </div>
                                        <div>
                                          <h4 className="font-black text-sm text-[#1a2d5c]">
                                            {gymClass?.title || gymClass?.name} <span className="text-xs font-semibold text-slate-500">(น้อง {child?.nickname})</span>
                                          </h4>
                                          <div className="flex items-center space-x-3 text-xs text-slate-600 font-semibold mt-0.5">
                                            <span className="flex items-center gap-1">📅 {displayDateStr}</span>
                                            <span className="flex items-center gap-1">⏰ {slotTime}</span>
                                          </div>
                                        </div>
                                      </div>

                                      <button
                                        onClick={async () => {
                                          if (confirm('คุณต้องการยกเลิกการจองคลาสเรียนนี้ใช่หรือไม่? (ต้องทำล่วงหน้าอย่างน้อย 1 วัน)')) {
                                            const res = await cancelBooking(bk.id);
                                            if (res.error) alert(res.error);
                                            else router.refresh();
                                          }
                                        }}
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
                          <div className="flex justify-end pt-3 border-t border-slate-200">
                            <button
                              onClick={() => setExpandedChildId(null)}
                              className="px-5 py-2 bg-[#1a2d5c] text-white hover:bg-[#111d3d] rounded-xl font-bold text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                            >
                              <ArrowLeft size={16} />
                              <span>← ย้อนกลับ (Back)</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })}
          
          <div className="flex flex-col items-center mt-10 space-y-6 w-full pb-8">
            <Link 
              href="/family/add" 
              className="text-[#1a2d5c] font-bold underline underline-offset-4 decoration-2 hover:text-blue-800 text-lg"
            >
              + Add Another Child
            </Link>

            <Link
              href="/schedule"
              className="w-36 py-2.5 text-center text-white bg-[#1a2d5c] rounded-full hover:bg-[#111d3d] font-black text-lg shadow-[0px_3px_0px_0px_#ef4444,0px_3px_0px_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#ef4444] transition-all"
            >
              Done
            </Link>
          </div>
        </div>
      )}

      {/* EDIT CHILD MODAL */}
      {editingChild && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border-2 border-[#1a2d5c] relative">
            <button
              onClick={() => setEditingChild(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-[#1a2d5c] mb-4 text-center">
              Edit Student Information
            </h2>

            {error && (
              <div className="w-full p-3 mb-4 text-xs font-bold text-red-500 bg-red-50 rounded-xl border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="w-full space-y-4">
              {/* Photo Upload Circle with Live Transform Preview */}
              <div className="flex flex-col items-center mb-3">
                <div className="relative mb-1">
                  <div className="w-28 h-28 rounded-full overflow-hidden border-3 border-[#1a2d5c] bg-[#95b8d1] flex items-center justify-center shadow-md relative">
                    {editForm.photo_url ? (
                      <img 
                        src={editForm.photo_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover transition-transform duration-75" 
                        style={{
                          transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`
                        }}
                      />
                    ) : (
                      <span className="text-white font-bold text-4xl">
                        {editForm.nickname ? editForm.nickname[0] : '👧🏻'}
                      </span>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-[#1a2d5c] text-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform"
                    title="Upload Photo"
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <span className="text-xs text-slate-500 font-semibold mb-2">กดที่ปุ่ม + เพื่อเปลี่ยนรูปถ่าย</span>

                {/* Interactive Sliders for Zoom & Position */}
                {editForm.photo_url && (
                  <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <ZoomIn size={14} /> ขยายรูป: {zoom.toFixed(1)}x
                      </span>
                      <input 
                        type="range" 
                        min="1" 
                        max="2.5" 
                        step="0.1" 
                        value={zoom} 
                        onChange={e => setZoom(parseFloat(e.target.value))}
                        className="w-28 accent-[#1a2d5c] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Move size={14} /> ซ้าย - ขวา: {offsetX}px
                      </span>
                      <input 
                        type="range" 
                        min="-40" 
                        max="40" 
                        step="1" 
                        value={offsetX} 
                        onChange={e => setOffsetX(parseInt(e.target.value))}
                        className="w-28 accent-[#1a2d5c] cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <Move size={14} /> บน - ล่าง: {offsetY}px
                      </span>
                      <input 
                        type="range" 
                        min="-40" 
                        max="40" 
                        step="1" 
                        value={offsetY} 
                        onChange={e => setOffsetY(parseInt(e.target.value))}
                        className="w-28 accent-[#1a2d5c] cursor-pointer"
                      />
                    </div>

                    {(zoom !== 1 || offsetX !== 0 || offsetY !== 0) && (
                      <button
                        type="button"
                        onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); }}
                        className="text-[11px] text-blue-600 font-bold hover:underline w-full text-center block pt-1"
                      >
                        รีเซ็ตตำแหน่งรูปภาพ
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Child's Full Name:</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full border-b border-black focus:outline-none focus:border-b-2 focus:border-[#1a2d5c] bg-transparent pb-1 px-1 font-semibold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nickname:</label>
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={e => setEditForm({ ...editForm, nickname: e.target.value })}
                  className="w-full border-b border-black focus:outline-none focus:border-b-2 focus:border-[#1a2d5c] bg-transparent pb-1 px-1 font-semibold text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth:</label>
                <input
                  type="date"
                  value={editForm.dob}
                  onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                  className="w-full border-b border-black focus:outline-none focus:border-b-2 focus:border-[#1a2d5c] bg-transparent pb-1 px-1 text-sm font-semibold cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Gender:</label>
                <select
                  value={editForm.gender}
                  onChange={e => setEditForm({ ...editForm, gender: e.target.value as Gender })}
                  className="w-full border-b border-black focus:outline-none focus:border-b-2 focus:border-[#1a2d5c] bg-transparent pb-1 px-1 text-sm font-semibold cursor-pointer"
                >
                  <option value="Boy">Boy</option>
                  <option value="Girl">Girl</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => setEditingChild(null)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-full text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-6 py-2 text-white bg-[#1a2d5c] rounded-full hover:bg-[#111d3d] font-bold shadow-[0px_3px_0px_0px_#ef4444,0px_3px_0px_1px_#1a2d5c] border border-[#1a2d5c] active:translate-y-1 active:shadow-[0px_0px_0px_0px_#ef4444] disabled:opacity-50 text-sm transition-all"
                >
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
