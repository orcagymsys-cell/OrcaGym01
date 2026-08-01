'use server';

import { getDb, saveDb } from '@/lib/db';
import { getUser } from './user';
import { Child, Gender } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getChildren() {
  const user = await getUser();
  if (!user) return [];

  const db = getDb();
  return db.children.filter(c => c.parent_id === user.id);
}

export async function addChild(data: { full_name: string, nickname: string, dob: string, gender: Gender, photo_url?: string }) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const db = getDb();
  
  // Check limit
  const currentChildren = db.children.filter(c => c.parent_id === user.id);
  if (currentChildren.length >= db.settings.max_children_allowed) {
    return { error: 'Maximum number of children reached.' };
  }

  const newChild: any = {
    id: `child_${Date.now()}`,
    parent_id: user.id,
    full_name: data.full_name,
    nickname: data.nickname,
    dob: data.dob,
    gender: data.gender,
    photo_url: data.photo_url || '',
    total_classes: 0,
    used_classes: 0,
    remaining_classes: 0,
    expiry_date: '',
    status: 'pending' // need admin approval for initial setup
  };

  db.children.push(newChild);
  
  // Also update first_login for user
  const dbUser = db.users.find(u => u.id === user.id);
  if (dbUser && dbUser.first_login) {
    dbUser.first_login = false;
  }
  
  saveDb(db);

  revalidatePath('/dashboard');
  revalidatePath('/family/add');
  
  return { success: true };
}

export async function deleteChild(childId: string) {
  const user = await getUser();
  if (!user || user.role !== 'parent') return { error: 'Unauthorized' };

  const db = getDb();
  const initialLength = db.children.length;
  db.children = db.children.filter(c => !(c.id === childId && c.parent_id === user.id));
  
  if (db.children.length < initialLength) {
    saveDb(db);
    revalidatePath('/dashboard');
    return { success: true };
  }
  
  return { error: 'Child not found' };
}
