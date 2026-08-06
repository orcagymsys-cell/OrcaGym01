'use server';

import { supabase } from '@/lib/supabase';
import { getUser } from './user';
import { revalidatePath } from 'next/cache';
import { toISODateString, isSameTimeSlot } from '@/lib/types';

export async function bookClass(childId: string, classId: string, timeSlot: string, date: string) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const { data: child } = await supabase.from('children').select('*').eq('id', childId).eq('parent_id', user.id).single();
  if (!child) return { error: 'Child not found' };

  if (child.status === 'pending' || child.course_approval_status === 'pending') {
    return { error: 'ไม่สามารถจองคลาสเรียนได้ เนื่องจากข้อมูลการเลือกคลาสของบุตรหลานยังรอการตรวจสอบและอนุมัติจาก Admin' };
  }

  const { data: gymClass } = await supabase.from('classes').select('*').eq('id', classId).single();
  if (!gymClass) return { error: 'Invalid class' };

  const { data: parentUser } = await supabase.from('users').select('*').eq('id', child.parent_id).single();
  if (!parentUser) return { error: 'Parent account not found' };

  let familyCourse = parentUser.courses_purchased?.find((cp: any) => cp.class_id === classId);
  
  if (!familyCourse && parentUser.purchased_course_id === classId) {
    if (!parentUser.courses_purchased) parentUser.courses_purchased = [];
    familyCourse = {
      class_id: classId,
      class_title: parentUser.purchased_course_name || gymClass.title || gymClass.name,
      total_classes: parentUser.purchased_classes || 10,
      used_classes: 0,
      remaining_classes: parentUser.purchased_classes || 10
    };
    parentUser.courses_purchased.push(familyCourse);
    await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
  }

  if (!familyCourse || familyCourse.remaining_classes <= 0) {
    return { error: `ชั่วโมงเรียนคลาส ${gymClass.title || gymClass.name} ในตะกร้าครอบครัวหมดแล้ว` };
  }

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

  const { data: existingChildBookings } = await supabase.from('bookings')
    .select('*')
    .eq('child_id', childId)
    .neq('status', 'cancelled');
  
  const childCollision = existingChildBookings?.some(b => 
    toISODateString(b.date) === targetISODate &&
    isSameTimeSlot(b.time_slot || b.timeSlot || '', timeSlot)
  );

  if (childCollision) {
    return { error: `น้อง ${child.nickname} มีการจองคลาสเรียนในวันที่ ${date} รอบเวลา ${timeSlot} ไว้แล้ว ไม่สามารถจองซ้ำได้` };
  }

  const { data: classBookings } = await supabase.from('bookings')
    .select('*')
    .neq('status', 'cancelled');
    
  const existingBookings = classBookings?.filter(b => 
    (b.class_id === classId || b.schedule_id === classId) && 
    toISODateString(b.date) === targetISODate &&
    isSameTimeSlot(b.time_slot || b.timeSlot || '', timeSlot)
  ) || [];

  if (existingBookings.length >= gymClass.capacity) {
    return { error: `คลาสเรียน ${gymClass.title || gymClass.name} ในรอบเวลา ${timeSlot} ของวันที่ ${date} เต็มแล้ว (${existingBookings.length}/${gymClass.capacity} คน)` };
  }

  const newBooking = {
    id: `bk_${Date.now()}`,
    child_id: childId,
    class_id: classId,
    schedule_id: classId,
    time_slot: timeSlot,
    date,
    status: 'approved'
  };

  familyCourse.remaining_classes -= 1;
  familyCourse.used_classes += 1;

  child.used_classes = (child.used_classes || 0) + 1;
  child.remaining_classes = familyCourse.remaining_classes;

  await supabase.from('bookings').insert([newBooking]);
  await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
  await supabase.from('children').update({ used_classes: child.used_classes, remaining_classes: child.remaining_classes }).eq('id', childId);

  revalidatePath(`/child/${childId}`);
  revalidatePath('/dashboard');
  revalidatePath('/admin/schedule');
  revalidatePath('/schedule');
  
  return { success: true };
}

export async function cancelBooking(bookingId: string) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (!booking) return { error: 'Booking not found' };

  const { data: child } = await supabase.from('children').select('*').eq('id', booking.child_id).single();
  if (!child || (child.parent_id !== user.id && user.role !== 'admin')) {
    return { error: 'Not authorized to cancel this booking' };
  }

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
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    
    const { data: parentUser } = await supabase.from('users').select('*').eq('id', child.parent_id).single();
    if (parentUser && parentUser.courses_purchased) {
      const targetClassId = booking.class_id || booking.schedule_id;
      const familyCourse = parentUser.courses_purchased.find((cp: any) => cp.class_id === targetClassId);
      if (familyCourse) {
        familyCourse.remaining_classes += 1;
        familyCourse.used_classes = Math.max(0, familyCourse.used_classes - 1);
        child.remaining_classes = familyCourse.remaining_classes;
        
        await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
        await supabase.from('children').update({ remaining_classes: child.remaining_classes }).eq('id', child.id);
      }
    }

    revalidatePath(`/child/${child.id}`);
    revalidatePath('/dashboard');
    revalidatePath('/admin/schedule');
    revalidatePath('/schedule');
  }
  
  return { success: true };
}

export async function getLiveSlotCapacities(date: string, classId: string) {
  const targetISO = toISODateString(date);
  
  const { data: activeBookings } = await supabase.from('bookings')
    .select('*')
    .neq('status', 'cancelled');

  const filtered = activeBookings?.filter(b => toISODateString(b.date) === targetISO) || [];

  return {
    success: true,
    bookings: filtered
  };
}
