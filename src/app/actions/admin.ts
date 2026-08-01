'use server';

import { getDb, saveDb } from '@/lib/db';
import { getUser } from './user';
import { revalidatePath } from 'next/cache';

// Mock simple ID generator
const genId = () => Math.random().toString(36).substr(2, 9);

export async function getAllChildren() {
  const db = getDb();
  return db.children;
}

export async function approveChild(childId: string) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const db = getDb();
  const child = db.children.find(c => c.id === childId);
  if (child) {
    child.status = 'approved';
    saveDb(db);
    revalidatePath('/admin/members');
    return { success: true };
  }
  return { error: 'Child not found' };
}

export async function addCoursesToChild(childId: string, amount: number) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const db = getDb();
  const child = db.children.find(c => c.id === childId);
  
  if (child) {
    child.total_classes += amount;
    child.remaining_classes += amount;
    
    // Add audit log
    db.auditLogs.push({
      id: genId(),
      admin_id: user.id,
      target_child_id: child.id,
      action_type: 'ADD_HOURS',
      hours_added: amount,
      created_at: new Date().toISOString()
    });
    
    saveDb(db);
    revalidatePath('/admin/members');
    return { success: true };
  }
  return { error: 'Child not found' };
}

export async function getScheduleMatrix() {
  const db = getDb();
  return {
    classes: db.classes,
    schedules: db.schedules,
    bookings: db.bookings
  };
}
