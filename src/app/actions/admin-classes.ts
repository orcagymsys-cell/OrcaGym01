'use server';

import { supabase } from '@/lib/supabase';
import { GymClass } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { getUser } from './user';

export async function getClasses() {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized', classes: [] };

  const { data: classes, error } = await supabase.from('classes').select('*');
  return { classes: classes || [] };
}

export async function getClass(id: string) {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized', class: null };

  const { data, error } = await supabase.from('classes').select('*').eq('id', id).single();
  return { class: data || null };
}

export async function updateClass(id: string, data: Partial<GymClass>) {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabase.from('classes').update(data).eq('id', id);
  
  if (!error) {
    try {
      revalidatePath('/classes');
      revalidatePath('/admin/classes');
    } catch (e) { console.error('revalidate error', e); }
    return { success: true };
  }
  
  return { error: 'Course not found' };
}

export async function createClass(data: GymClass) {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabase.from('classes').insert([data]);
  
  if (!error) {
    try {
      revalidatePath('/classes');
      revalidatePath('/admin/classes');
    } catch (e) { console.error('revalidate error', e); }
    return { success: true };
  }
  return { error: 'Failed to create course' };
}

export async function deleteClass(id: string) {
  const admin = await getUser();
  if (!admin || admin.role !== 'admin') return { error: 'Unauthorized' };

  const { error } = await supabase.from('classes').delete().eq('id', id);
  
  if (!error) {
    try {
      revalidatePath('/classes');
      revalidatePath('/admin/classes');
    } catch (e) { console.error('revalidate error', e); }
    return { success: true };
  }
  
  return { error: 'Course not found' };
}
