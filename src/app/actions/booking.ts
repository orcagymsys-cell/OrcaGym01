'use server';

import { getDb, saveDb } from '@/lib/db';
import { getUser } from './user';
import { revalidatePath } from 'next/cache';
import { toISODateString, isSameTimeSlot } from '@/lib/types';

export async function bookClass(childId: string, classId: string, timeSlot: string, date: string) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const db = getDb();
  
  // Verify child belongs to user
  const child = db.children.find(c => c.id === childId && c.parent_id === user.id);
  if (!child) return { error: 'Child not found' };

  if (child.status === 'pending' || (child as any).course_approval_status === 'pending') {
    return { error: 'ไม่สามารถจองคลาสเรียนได้ เนื่องจากข้อมูลการเลือกคลาสของบุตรหลานยังรอการตรวจสอบและอนุมัติจาก Admin' };
  }

  // Find class
  const gymClass = db.classes.find(c => c.id === classId);
  if (!gymClass) return { error: 'Invalid class' };

  // Verify Family Basket (ตะกร้าครอบครัว) Quota for classId
  const parentUser = db.users.find(u => u.id === child.parent_id);
  if (!parentUser) return { error: 'Parent account not found' };

  // Find course in parent's Family Basket
  let familyCourse = parentUser.courses_purchased?.find(cp => cp.class_id === classId);
  
  // Fallback for legacy single-course accounts
  if (!familyCourse && (parentUser as any).purchased_course_id === classId) {
    if (!parentUser.courses_purchased) parentUser.courses_purchased = [];
    familyCourse = {
      class_id: classId,
      class_title: (parentUser as any).purchased_course_name || gymClass.title || gymClass.name,
      total_classes: (parentUser as any).purchased_classes || 10,
      used_classes: 0,
      remaining_classes: (parentUser as any).purchased_classes || 10
    };
    parentUser.courses_purchased.push(familyCourse);
  }

  if (!familyCourse || familyCourse.remaining_classes <= 0) {
    return { error: `ชั่วโมงเรียนคลาส ${gymClass.title || gymClass.name} ในตะกร้าครอบครัวหมดแล้ว` };
  }

  // Enforce 1-Day Advance Rule for Booking
  const [y, m, d] = date.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  targetDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 1 && user.role !== 'admin') {
    return { error: 'การจองคลาสเรียนต้องทำล่วงหน้าอย่างน้อย 1 วัน (ไม่สามารถจองในวันเดียวกันหรือย้อนหลังได้)' };
  }

  const targetISODate = toISODateString(date);

  // Check collision (Prevent child booking twice at same date & time)
  const childCollision = db.bookings.some(b => 
    b.child_id === childId &&
    b.status !== 'cancelled' &&
    toISODateString(b.date) === targetISODate &&
    isSameTimeSlot(b.time_slot || (b as any).timeSlot || '', timeSlot)
  );

  if (childCollision) {
    return { error: `น้อง ${child.nickname} มีการจองคลาสเรียนในวันที่ ${date} รอบเวลา ${timeSlot} ไว้แล้ว ไม่สามารถจองซ้ำได้` };
  }

  // Check capacity for this class + date + timeSlot (Strict Capacity Protection)
  const existingBookings = db.bookings.filter(b => 
    ((b as any).class_id === classId || b.schedule_id === classId) && 
    b.status !== 'cancelled' &&
    toISODateString(b.date) === targetISODate &&
    isSameTimeSlot(b.time_slot || (b as any).timeSlot || '', timeSlot)
  );

  if (existingBookings.length >= gymClass.capacity) {
    return { error: `คลาสเรียน ${gymClass.title || gymClass.name} ในรอบเวลา ${timeSlot} ของวันที่ ${date} เต็มแล้ว (${existingBookings.length}/${gymClass.capacity} คน)` };
  }

  // Create booking
  const newBooking: any = {
    id: `bk_${Date.now()}`,
    child_id: childId,
    class_id: classId,
    schedule_id: classId,
    time_slot: timeSlot,
    date,
    status: 'approved'
  };

  // Real-time Family Basket Deduction
  familyCourse.remaining_classes -= 1;
  familyCourse.used_classes += 1;

  child.used_classes += 1;
  child.remaining_classes = familyCourse.remaining_classes;

  db.bookings.push(newBooking);
  saveDb(db);

  revalidatePath(`/child/${childId}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin/schedule');
  revalidatePath('/schedule');
  
  return { success: true };
}

export async function cancelBooking(bookingId: string) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const db = getDb();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) return { error: 'Booking not found' };

  // Verify ownership
  const child = db.children.find(c => c.id === booking.child_id);
  if (!child || (child.parent_id !== user.id && user.role !== 'admin')) {
    return { error: 'Not authorized to cancel this booking' };
  }

  // Rule: Cancel at least 1 day in advance
  const [y, m, d] = booking.date.split('-').map(Number);
  const bookingDate = new Date(y, m - 1, d);
  bookingDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = bookingDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays < 1 && user.role !== 'admin') {
    return { error: 'Must cancel at least 1 day in advance (การยกเลิกต้องทำล่วงหน้าอย่างน้อย 1 วัน)' };
  }

  if (booking.status !== 'cancelled') {
    booking.status = 'cancelled';
    
    // Real-time Refund back to Family Basket
    const parentUser = db.users.find(u => u.id === child.parent_id);
    if (parentUser && parentUser.courses_purchased) {
      const targetClassId = (booking as any).class_id || booking.schedule_id;
      const familyCourse = parentUser.courses_purchased.find(cp => cp.class_id === targetClassId);
      if (familyCourse) {
        familyCourse.remaining_classes += 1;
        familyCourse.used_classes = Math.max(0, familyCourse.used_classes - 1);
        child.remaining_classes = familyCourse.remaining_classes;
      }
    }

    saveDb(db);
    revalidatePath(`/child/${child.id}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/schedule');
    revalidatePath('/schedule');
  }
  
  return { success: true };
}

export async function getLiveSlotCapacities(date: string, classId: string) {
  const db = getDb();
  const targetISO = toISODateString(date);
  
  const activeBookings = db.bookings.filter(b => 
    b.status !== 'cancelled' && 
    toISODateString(b.date) === targetISO
  );

  return {
    success: true,
    bookings: activeBookings
  };
}
