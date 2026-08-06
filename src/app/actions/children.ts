'use server';

import { supabase } from '@/lib/supabase';
import { getUser } from './user';
import { Child, Gender } from '@/lib/types';
import { revalidatePath } from 'next/cache';

export async function getChildren() {
  const user = await getUser();
  if (!user) return [];

  const { data, error } = await supabase.from('children').select('*').eq('parent_id', user.id);
  return data || [];
}

export async function addChild(data: { full_name: string, nickname: string, dob: string, gender: Gender, photo_url?: string, assigned_course_id?: string }) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const { data: currentChildren } = await supabase.from('children').select('id').eq('parent_id', user.id);
  const maxAllowed = user.max_children_allowed || 10;
  
  if (currentChildren && currentChildren.length >= maxAllowed) {
    return { error: `คุณลงทะเบียนบุตรหลานครบตามจำนวนที่กำหนดแล้ว (${maxAllowed} คน)` };
  }

  const { data: dbUser } = await supabase.from('users').select('*').eq('id', user.id).single();
  const initialClasses = dbUser?.purchased_classes || 0;

  let assignedClass = null;
  if (data.assigned_course_id) {
    const { data: cls } = await supabase.from('classes').select('*').eq('id', data.assigned_course_id).single();
    assignedClass = cls;
  }

  const newChild = {
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

  await supabase.from('children').insert([newChild]);
  
  if (dbUser && dbUser.first_login) {
    await supabase.from('users').update({ first_login: false }).eq('id', user.id);
  }
  
  revalidatePath('/dashboard');
  revalidatePath('/family/add');
  revalidatePath('/admin/members');
  
  return { success: true };
}

export async function deleteChild(childId: string) {
  const user = await getUser();
  if (!user || user.role !== 'parent') return { error: 'Unauthorized' };

  const { error } = await supabase.from('children').delete().eq('id', childId).eq('parent_id', user.id);
  
  if (!error) {
    revalidatePath('/dashboard');
    revalidatePath('/admin/members');
    return { success: true };
  }
  
  return { error: 'Child not found' };
}

export async function updateChild(childId: string, data: { full_name: string, nickname: string, dob: string, gender: Gender, photo_url?: string, assigned_course_id?: string }) {
  const user = await getUser();
  if (!user) return { error: 'Not authorized' };

  const { data: child } = await supabase.from('children').select('*').eq('id', childId).single();
  if (!child || (child.parent_id !== user.id && user.role !== 'admin')) return { error: 'Child not found' };

  const updateData: any = {
    full_name: data.full_name,
    nickname: data.nickname,
    dob: data.dob,
    gender: data.gender,
  };

  if (data.photo_url) {
    updateData.photo_url = data.photo_url;
  }

  if (data.assigned_course_id) {
    const { data: assignedClass } = await supabase.from('classes').select('*').eq('id', data.assigned_course_id).single();
    updateData.assigned_course_id = data.assigned_course_id;
    updateData.assigned_course_title = assignedClass?.title || assignedClass?.name || 'Orca Cubs Class';
    updateData.course_approval_status = 'pending';
    updateData.status = 'pending';
  }

  await supabase.from('children').update(updateData).eq('id', childId);

  revalidatePath('/dashboard');
  revalidatePath('/family/add');
  revalidatePath('/admin/members');

  return { success: true };
}
