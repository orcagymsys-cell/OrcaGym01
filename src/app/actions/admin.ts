'use server';

import { supabase } from '@/lib/supabase';
import { getUser } from './user';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch (e) {}
}

const genId = () => Math.random().toString(36).substr(2, 9);

export async function getAllChildren() {
  const { data } = await supabase.from('children').select('*');
  return data || [];
}

export async function approveChild(
  childId: string, 
  courseId?: string, 
  purchasedClasses: number = 10, 
  bonusClasses: number = 0,
  paymentDetails?: { amountPaid?: number; paymentSlipUrl?: string; paymentRefNo?: string; remark?: string }
) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const { data: child } = await supabase.from('children').select('*').eq('id', childId).single();
  if (child) {
    const { data: classes } = await supabase.from('classes').select('*');
    const targetCourseId = courseId || child.assigned_course_id || classes?.[0]?.id || 'class_1';
    const gymClass = classes?.find(c => c.id === targetCourseId);
    
    const assigned_course_id = targetCourseId;
    const assigned_course_title = gymClass?.title || gymClass?.name || 'Orca Cubs Class';

    const total = purchasedClasses + bonusClasses;
    
    const { data: parentUser } = await supabase.from('users').select('*').eq('id', child.parent_id).single();
    if (parentUser) {
      if (!parentUser.courses_purchased) parentUser.courses_purchased = [];
      let familyCourse = parentUser.courses_purchased.find((cp: any) => cp.class_id === targetCourseId);
      if (!familyCourse) {
        familyCourse = {
          class_id: targetCourseId,
          class_title: assigned_course_title,
          purchased_classes: purchasedClasses,
          bonus_classes: bonusClasses,
          total_classes: total,
          used_classes: 0,
          remaining_classes: total
        };
        parentUser.courses_purchased.push(familyCourse);
      } else {
        familyCourse.purchased_classes = purchasedClasses;
        familyCourse.bonus_classes = bonusClasses;
        familyCourse.total_classes = total;
        familyCourse.remaining_classes = total;
      }
      await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
    }

    await supabase.from('children').update({
      assigned_course_id,
      assigned_course_title,
      total_classes: total,
      remaining_classes: total,
      status: 'approved',
      course_approval_status: 'approved'
    }).eq('id', childId);

    const auditLog = {
      id: `audit_${Date.now()}_${genId()}`,
      timestamp: new Date().toISOString(),
      admin_id: user.id,
      admin_name: user.full_name || user.username || 'Admin',
      action_type: 'APPROVE_COURSE',
      target_user_id: parentUser?.id,
      target_user_name: parentUser?.full_name || 'ผู้ปกครอง',
      target_child_id: child.id,
      target_child_name: `${child.full_name} (น้อง ${child.nickname})`,
      course_id: targetCourseId,
      course_name: assigned_course_title,
      purchased_classes: purchasedClasses,
      bonus_classes: bonusClasses,
      total_classes: total,
      remaining_classes: total,
      amount_paid: paymentDetails?.amountPaid || 0,
      payment_slip_url: paymentDetails?.paymentSlipUrl || '',
      payment_ref_no: paymentDetails?.paymentRefNo || '',
      remark: paymentDetails?.remark || 'อนุมัติสิทธิ์คลาสเรียน'
    };
    await supabase.from('audit_logs').insert([auditLog]);

    safeRevalidate('/admin/members');
    safeRevalidate('/admin/audit');
    safeRevalidate('/dashboard');
    safeRevalidate('/schedule');
    return { success: true };
  }
  return { error: 'Child not found' };
}

export async function approveChildCourse(
  childId: string, 
  courseId?: string, 
  purchasedClasses: number = 10, 
  bonusClasses: number = 0,
  paymentDetails?: { amountPaid?: number; paymentSlipUrl?: string; paymentRefNo?: string; remark?: string }
) {
  return approveChild(childId, courseId, purchasedClasses, bonusClasses, paymentDetails);
}

export async function updateChildCourse(childId: string, data: { courseId?: string; purchasedClasses?: number; bonusClasses?: number; totalClasses?: number; remainingClasses?: number }) {
  try {
    const user = await getUser();
    if (user?.role !== 'admin') return { error: 'Not authorized' };

    const { data: child, error: childErr } = await supabase.from('children').select('*').eq('id', childId).single();
    if (childErr) throw new Error('Child not found or DB error: ' + childErr.message);
    if (!child) return { error: 'Child not found' };

    const updateData: any = {};

    if (data.courseId) {
      const { data: gymClass } = await supabase.from('classes').select('*').eq('id', data.courseId).single();
      updateData.assigned_course_id = data.courseId;
      updateData.assigned_course_title = gymClass?.title || gymClass?.name || 'Orca Cubs Class';
    }

    const { data: parentUser, error: parentErr } = await supabase.from('users').select('*').eq('id', child.parent_id).single();
    if (parentErr) throw new Error('Parent not found or DB error: ' + parentErr.message);

    const targetCourseId = data.courseId || child.assigned_course_id;
    const familyCourse = parentUser?.courses_purchased?.find((cp: any) => cp.class_id === targetCourseId);

    const purchased = data.purchasedClasses !== undefined ? data.purchasedClasses : (familyCourse?.purchased_classes || 10);
    const bonus = data.bonusClasses !== undefined ? data.bonusClasses : (familyCourse?.bonus_classes || 0);
    const calculatedTotal = data.totalClasses !== undefined ? data.totalClasses : (purchased + bonus);

    updateData.total_classes = calculatedTotal;
    
    if (parentUser && familyCourse) {
      familyCourse.purchased_classes = purchased;
      familyCourse.bonus_classes = bonus;
      familyCourse.total_classes = calculatedTotal;
    }

    if (data.remainingClasses !== undefined) {
      updateData.remaining_classes = data.remainingClasses;
      if (familyCourse) familyCourse.remaining_classes = data.remainingClasses;
    }

    if (parentUser && parentUser.courses_purchased) {
      const { error: userUpdateErr } = await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
      if (userUpdateErr) throw new Error('Failed to update user: ' + userUpdateErr.message);
    }
    
    const { error: childUpdateErr } = await supabase.from('children').update(updateData).eq('id', childId);
    if (childUpdateErr) throw new Error('Failed to update child: ' + childUpdateErr.message);

    safeRevalidate('/admin/members');
    safeRevalidate('/dashboard');
    safeRevalidate('/schedule');
    return { success: true };
  } catch (err: any) {
    console.error("updateChildCourse error:", err);
    return { error: err.message || 'Internal Server Error' };
  }
}

export async function adminCancelBooking(bookingId: string) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (!booking) return { error: 'Booking not found' };

  const { data: child } = await supabase.from('children').select('*').eq('id', booking.child_id).single();

  if (booking.status !== 'cancelled') {
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
    
    if (child) {
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
    }

    safeRevalidate('/admin/members');
    safeRevalidate('/admin/schedule');
    safeRevalidate('/dashboard');
    safeRevalidate('/schedule');
  }
  
  return { success: true };
}

export async function addCoursesToChild(childId: string, amount: number) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const { data: child } = await supabase.from('children').select('*').eq('id', childId).single();
  
  if (child) {
    const total = child.total_classes + amount;
    const remaining = child.remaining_classes + amount;
    
    await supabase.from('children').update({ total_classes: total, remaining_classes: remaining }).eq('id', childId);
    
    await supabase.from('audit_logs').insert([{
      id: genId(),
      admin_id: user.id,
      target_child_id: child.id,
      action_type: 'ADD_HOURS',
      hours_added: amount,
      created_at: new Date().toISOString()
    }]);
    
    safeRevalidate('/admin/members');
    return { success: true };
  }
  return { error: 'Child not found' };
}

export async function getScheduleMatrix() {
  noStore();
  const { data: classes } = await supabase.from('classes').select('*');
  const { data: schedules } = await supabase.from('schedules').select('*');
  const { data: bookings } = await supabase.from('bookings').select('*');
  
  return {
    classes: classes || [],
    schedules: schedules || [],
    bookings: bookings || []
  };
}

export async function getAboutUs() {
  return {
    company_name_th: 'บริษัท ออก้ายิม จำกัด',
    company_name_en: 'ORCA GYM CO., LTD.',
    registration_number: '0105569135935',
    business_description: 'สถาบันสอนและฝึกทักษะกีฬายิมนาสติก กายกรรม โยคะ การเต้นรำ ทุกรูปแบบ และเชียร์ลีดเดอร์ ให้แก่ เด็ก เยาวชน และบุคคลทั่วไป เมื่อได้รับอนุญาตจากหน่วยงานที่เกี่ยวข้องแล้ว',
    address: '289/240 ซอย ร่มเกล้า 6/1 แขวงมีนบุรี เขตมีนบุรี กรุงเทพมหานคร 10510'
  };
}

export async function updateAboutUs(data: any) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };
  return { success: true };
}

export async function getAdminMembersData() {
  noStore();
  const { data: children } = await supabase.from('children').select('*');
  const { data: parents } = await supabase.from('users').select('*').eq('role', 'parent');
  const { data: classes } = await supabase.from('classes').select('*');
  
  return {
    children: children || [],
    parents: parents || [],
    classes: classes || []
  };
}

export async function createParentAccount(data: {
  username: string;
  password?: string;
  full_name: string;
  phone_number: string;
  max_children_allowed?: number;
  courses_purchased?: { class_id: string; total_classes: number; bonus_classes?: number }[];
  course_id?: string;
  purchased_classes?: number;
  payment_details?: {
    amount_paid?: number;
    payment_ref_no?: string;
    payment_slip_url?: string;
    sender_bank_info?: string;
    payment_time?: string;
    remark?: string;
  };
}) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const { data: existingUsers } = await supabase.from('users').select('*');
  const existingUser = existingUsers?.find(u => u.username.toLowerCase() === data.username.trim().toLowerCase());
  if (existingUser) {
    return { error: 'Username นี้มีในระบบแล้ว กรุณาเลือก Username อื่น' };
  }

  const { data: classes } = await supabase.from('classes').select('*');

  const coursesPurchasedList = (data.courses_purchased || []).map(cp => {
    const cls = classes?.find(c => c.id === cp.class_id);
    const count = Number(cp.total_classes) || 0;
    const bonus = Number(cp.bonus_classes) || 0;
    const total = count + bonus;
    return {
      class_id: cp.class_id,
      class_title: cls?.title || cls?.name || 'ORCA Gymnastics Course',
      purchased_classes: count,
      bonus_classes: bonus,
      total_classes: total,
      used_classes: 0,
      remaining_classes: total
    };
  });

  if (coursesPurchasedList.length === 0 && data.course_id) {
    const cls = classes?.find(c => c.id === data.course_id);
    const count = Number(data.purchased_classes) || 0;
    coursesPurchasedList.push({
      class_id: data.course_id,
      class_title: cls?.title || cls?.name || 'ORCA Gymnastics Course',
      purchased_classes: count,
      bonus_classes: 0,
      total_classes: count,
      used_classes: 0,
      remaining_classes: count
    });
  }

  const newUser = {
    id: `user_${genId()}`,
    role: 'parent',
    username: data.username.trim(),
    password: data.password?.trim() || 'orca1234',
    full_name: data.full_name.trim(),
    phone_number: data.phone_number.trim(),
    first_login: true,
    max_children_allowed: Number(data.max_children_allowed) || 10,
    courses_purchased: coursesPurchasedList,
    purchased_course_id: coursesPurchasedList[0]?.class_id || '',
    purchased_course_name: coursesPurchasedList[0]?.class_title || '',
    purchased_classes: coursesPurchasedList[0]?.total_classes || 0
  };

  const totalPaid = Number(data.payment_details?.amount_paid) || 0;
  const auditLog = {
    id: `audit_${Date.now()}_${genId()}`,
    timestamp: new Date().toISOString(),
    admin_id: user.id,
    admin_name: user.full_name || user.username || 'Admin',
    action_type: 'REGISTER_PARENT',
    target_user_id: newUser.id,
    target_user_name: newUser.full_name,
    amount_paid: totalPaid,
    payment_ref_no: data.payment_details?.payment_ref_no || '',
    payment_slip_url: data.payment_details?.payment_slip_url || '',
    remark: data.payment_details?.remark || `Admin สร้างบัญชีผู้ปกครองใหม่ (${newUser.username})`
  };
  
  await supabase.from('audit_logs').insert([auditLog]);
  await supabase.from('users').insert([newUser]);

  safeRevalidate('/admin/members');
  safeRevalidate('/admin/audit');

  return {
    success: true,
    user: newUser
  };
}

export async function updateParentAccount(userId: string, data: {
  full_name?: string;
  phone_number?: string;
  password?: string;
  max_children_allowed?: number;
  courses_purchased?: { class_id: string; total_classes: number }[];
}) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const { data: targetUser } = await supabase.from('users').select('*').eq('id', userId).eq('role', 'parent').single();
  if (!targetUser) return { error: 'Parent user not found' };

  const updateData: any = {};

  if (data.full_name) updateData.full_name = data.full_name.trim();
  if (data.phone_number) updateData.phone_number = data.phone_number.trim();
  if (data.password && data.password.trim() !== '') updateData.password = data.password.trim();
  if (data.max_children_allowed) updateData.max_children_allowed = Number(data.max_children_allowed);

  if (data.courses_purchased) {
    const { data: classes } = await supabase.from('classes').select('*');
    const updatedList = data.courses_purchased.map(cp => {
      const cls = classes?.find(c => c.id === cp.class_id);
      const existingCourse = targetUser.courses_purchased?.find((c: any) => c.class_id === cp.class_id);
      const total = Number(cp.total_classes) || 0;
      const used = existingCourse ? existingCourse.used_classes : 0;
      const remaining = Math.max(0, total - used);

      return {
        class_id: cp.class_id,
        class_title: cls?.title || cls?.name || 'ORCA Gymnastics Course',
        total_classes: total,
        used_classes: used,
        remaining_classes: remaining
      };
    });

    updateData.courses_purchased = updatedList;
  }

  await supabase.from('users').update(updateData).eq('id', userId);

  safeRevalidate('/admin/members');
  safeRevalidate('/dashboard');
  return { success: true };
}

export async function deleteParentAccount(userId: string) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const { data: parentUser } = await supabase.from('users').select('*').eq('id', userId).eq('role', 'parent').single();
  if (!parentUser) return { error: 'Parent account not found' };

  const { data: children } = await supabase.from('children').select('id').eq('parent_id', userId);
  const childrenIds = children?.map(c => c.id) || [];

  if (childrenIds.length > 0) {
    await supabase.from('bookings').delete().in('child_id', childrenIds);
    await supabase.from('children').delete().eq('parent_id', userId);
  }

  await supabase.from('users').delete().eq('id', userId);

  revalidatePath('/admin/members');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getAuditLogsAction() {
  noStore();
  // Bypass getUser check temporarily
  const { data: auditLogs } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  return { success: true, auditLogs: auditLogs || [] };
}
