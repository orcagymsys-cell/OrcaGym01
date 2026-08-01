'use server';

import { getDb, saveDb } from '@/lib/db';
import { GymClass } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getUser } from './user';

export async function getClasses() {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized', classes: [] };

  const db = getDb();
  return { classes: db.classes };
}

export async function getClass(id: string) {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized', class: null };

  const db = getDb();
  const cls = db.classes.find(c => c.id === id);
  return { class: cls || null };
}

export async function updateClass(id: string, data: Partial<GymClass>) {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized' };

  const db = getDb();
  const index = db.classes.findIndex(c => c.id === id);
  
  if (index !== -1) {
    db.classes[index] = { ...db.classes[index], ...data };
    saveDb(db);
    revalidatePath('/classes');
    revalidatePath('/admin/classes');
    return { success: true };
  }
  
  return { error: 'Course not found' };
}

export async function createClass(data: GymClass) {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized' };

  const db = getDb();
  db.classes.push(data);
  saveDb(db);
  revalidatePath('/classes');
  revalidatePath('/admin/classes');
  return { success: true };
}

export async function deleteClass(id: string) {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized' };

  const db = getDb();
  const initialLength = db.classes.length;
  db.classes = db.classes.filter(c => c.id !== id);
  
  if (db.classes.length < initialLength) {
    saveDb(db);
    revalidatePath('/classes');
    revalidatePath('/admin/classes');
    return { success: true };
  }
  
  return { error: 'Course not found' };
}
