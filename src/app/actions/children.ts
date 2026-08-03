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

export async function addChild(data: { full_name: string, nickname: string, dob: string, gender: Gender, photo_url?: string, assigned_course_id?: string }) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const db = getDb();
  
  // Check limit (default 10 children per family)
  const currentChildren = db.children.filter(c => c.parent_id === user.id);
  const maxAllowed = db.settings?.max_children_allowed || 10;
  if (currentChildren.length >= maxAllowed) {
    return { error: `คุณลงทะเบียนบุตรหลานครบตามจำนวนที่กำหนดแล้ว (${maxAllowed} คน)` };
  }

  const dbUser = db.users.find(u => u.id === user.id);
  const initialClasses = dbUser?.purchased_classes || 0;

  const assignedClass = data.assigned_course_id ? db.classes.find(c => c.id === data.assigned_course_id) : null;

  const newChild: any = {
    id: `child_${Date.now()}`,
    parent_id: user.id,
    full_name: data.full_name,
    nickname: data.nickname,
    dob: data.dob,
    gender: data.gender,
    photo_url: data.photo_url || '',
    assigned_course_id: data.assigned_course_id || '',
    assigned_course_title: assignedClass ? (assignedClass.title || assignedClass.name) : 'รอ Admin เลือกคลาส & อนุมัติ',
    course_approval_status: 'pending',
    total_classes: initialClasses,
    used_classes: 0,
    remaining_classes: initialClasses,
    expiry_date: '',
    status: 'pending'
  };

  db.children.push(newChild);
  
  // Also update first_login for user
  if (dbUser && dbUser.first_login) {
    dbUser.first_login = false;
  }
  
  saveDb(db);

  revalidatePath('/dashboard');
  revalidatePath('/family/add');
  revalidatePath('/admin/members');
  
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
    revalidatePath('/admin/members');
    return { success: true };
  }
  
  return { error: 'Child not found' };
}

export async function updateChild(childId: string, data: { full_name: string, nickname: string, dob: string, gender: Gender, photo_url?: string, assigned_course_id?: string }) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const db = getDb();
  const child = db.children.find(c => c.id === childId && (c.parent_id === user.id || user.role === 'admin'));
  if (!child) return { error: 'Child not found' };

  child.full_name = data.full_name;
  child.nickname = data.nickname;
  child.dob = data.dob;
  child.gender = data.gender;
  if (data.photo_url) {
    (child as any).photo_url = data.photo_url;
  }
  if (data.assigned_course_id) {
    const assignedClass = db.classes.find(c => c.id === data.assigned_course_id);
    (child as any).assigned_course_id = data.assigned_course_id;
    (child as any).assigned_course_title = assignedClass?.title || assignedClass?.name || 'Orca Cubs Class';
    (child as any).course_approval_status = 'pending';
    child.status = 'pending';
  }

  saveDb(db);
  revalidatePath('/dashboard');
  revalidatePath('/family/add');
  revalidatePath('/admin/members');

  return { success: true };
}
