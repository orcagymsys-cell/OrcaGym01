'use server';

import { getDb, saveDb } from '@/lib/db';
import { getUser } from './user';
import { revalidatePath } from 'next/cache';

export async function bookClass(childId: string, scheduleId: string, date: string) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const db = getDb();
  
  // Verify child belongs to user
  const child = db.children.find(c => c.id === childId && c.parent_id === user.id);
  if (!child) return { error: 'Child not found' };

  if (child.remaining_classes <= 0) {
    return { error: 'No remaining classes' };
  }

  // Check capacity
  const schedule = db.schedules.find(s => s.id === scheduleId);
  const gymClass = db.classes.find(c => c.id === schedule?.class_id);
  if (!schedule || !gymClass) return { error: 'Invalid class schedule' };

  const existingBookings = db.bookings.filter(b => b.schedule_id === scheduleId && b.date === date && b.status !== 'cancelled');
  if (existingBookings.length >= gymClass.capacity) {
    return { error: 'Class is full' };
  }

  // Check if already booked
  const alreadyBooked = existingBookings.some(b => b.child_id === childId);
  if (alreadyBooked) {
    return { error: 'Already booked for this time' };
  }

  // Create booking (pending admin approval for final deduction, but we decrement local capacity immediately)
  // Per requirement: หักโควต้าทันทีเพื่อกันคนจองเต็ม
  const newBooking = {
    id: `bk_${Date.now()}`,
    child_id: childId,
    schedule_id: scheduleId,
    date,
    status: 'pending' as const
  };

  db.bookings.push(newBooking);
  saveDb(db);

  revalidatePath(`/child/${childId}`);
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
  if (!child || child.parent_id !== user.id) return { error: 'Not authorized to cancel this booking' };

  // Rule: Cancel at least 1 day in advance
  const bookingDate = new Date(booking.date);
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const diffTime = Math.abs(bookingDate.getTime() - today.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (bookingDate <= today || diffDays < 1) {
    return { error: 'Must cancel at least 1 day in advance.' };
  }

  booking.status = 'cancelled';
  
  // If it was approved, refund class. (For mock, it's just 'cancelled')
  
  saveDb(db);
  revalidatePath(`/child/${child.id}`);
  
  return { success: true };
}
