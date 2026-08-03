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

export async function approveChild(
  childId: string, 
  courseId?: string, 
  purchasedClasses: number = 10, 
  bonusClasses: number = 0,
  paymentDetails?: { amountPaid?: number; paymentSlipUrl?: string; paymentRefNo?: string; remark?: string }
) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const db = getDb();
  const child = db.children.find(c => c.id === childId);
  if (child) {
    const targetCourseId = courseId || (child as any).assigned_course_id || db.classes[0]?.id || 'class_1';
    const gymClass = db.classes.find(c => c.id === targetCourseId);
    
    (child as any).assigned_course_id = targetCourseId;
    (child as any).assigned_course_title = gymClass?.title || gymClass?.name || 'Orca Cubs Class';

    const total = purchasedClasses + bonusClasses;
    child.total_classes = total;
    child.remaining_classes = total;
    child.status = 'approved';
    (child as any).course_approval_status = 'approved';

    // Sync with parent's Family Basket
    const parentUser = db.users.find(u => u.id === child.parent_id);
    if (parentUser) {
      if (!parentUser.courses_purchased) parentUser.courses_purchased = [];
      let familyCourse = parentUser.courses_purchased.find(cp => cp.class_id === targetCourseId);
      if (!familyCourse) {
        familyCourse = {
          class_id: targetCourseId,
          class_title: (child as any).assigned_course_title,
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
    }

    // Immutable Audit Log entry for Fraud Prevention
    const auditLog: any = {
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
      course_name: (child as any).assigned_course_title,
      purchased_classes: purchasedClasses,
      bonus_classes: bonusClasses,
      total_classes: total,
      remaining_classes: total,
      amount_paid: paymentDetails?.amountPaid || 0,
      payment_slip_url: paymentDetails?.paymentSlipUrl || '',
      payment_ref_no: paymentDetails?.paymentRefNo || '',
      remark: paymentDetails?.remark || 'อนุมัติสิทธิ์คลาสเรียน'
    };
    if (!db.auditLogs) db.auditLogs = [];
    db.auditLogs.unshift(auditLog);

    saveDb(db);
    revalidatePath('/admin/members');
    revalidatePath('/admin/audit');
    revalidatePath('/dashboard');
    revalidatePath('/schedule');
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
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const db = getDb();
  const child = db.children.find(c => c.id === childId);
  if (!child) return { error: 'Child not found' };

  if (data.courseId) {
    const gymClass = db.classes.find(c => c.id === data.courseId);
    (child as any).assigned_course_id = data.courseId;
    (child as any).assigned_course_title = gymClass?.title || gymClass?.name || 'Orca Cubs Class';
  }

  const parentUser = db.users.find(u => u.id === child.parent_id);
  const targetCourseId = data.courseId || (child as any).assigned_course_id;
  const familyCourse = parentUser?.courses_purchased?.find(cp => cp.class_id === targetCourseId);

  const purchased = data.purchasedClasses !== undefined ? data.purchasedClasses : (familyCourse?.purchased_classes || 10);
  const bonus = data.bonusClasses !== undefined ? data.bonusClasses : (familyCourse?.bonus_classes || 0);
  const calculatedTotal = data.totalClasses !== undefined ? data.totalClasses : (purchased + bonus);

  child.total_classes = calculatedTotal;
  if (familyCourse) {
    familyCourse.purchased_classes = purchased;
    familyCourse.bonus_classes = bonus;
    familyCourse.total_classes = calculatedTotal;
  }

  if (data.remainingClasses !== undefined) {
    child.remaining_classes = data.remainingClasses;
    if (familyCourse) familyCourse.remaining_classes = data.remainingClasses;
  }

  saveDb(db);
  revalidatePath('/admin/members');
  revalidatePath('/dashboard');
  revalidatePath('/schedule');
  return { success: true };
}

export async function adminCancelBooking(bookingId: string) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const db = getDb();
  const booking = db.bookings.find(b => b.id === bookingId);
  if (!booking) return { error: 'Booking not found' };

  const child = db.children.find(c => c.id === booking.child_id);

  if (booking.status !== 'cancelled') {
    booking.status = 'cancelled';
    
    // Refund back to Family Basket
    if (child) {
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
    }

    saveDb(db);
    revalidatePath('/admin/members');
    revalidatePath('/admin/schedule');
    revalidatePath('/dashboard');
    revalidatePath('/schedule');
  }
  
  return { success: true };
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

export async function getAboutUs() {
  const db = getDb();
  return db.aboutUs || {
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

  const db = getDb();
  db.aboutUs = data;
  saveDb(db);

  revalidatePath('/about');
  revalidatePath('/admin/about');
  return { success: true };
}

export async function getAdminMembersData() {
  const db = getDb();
  return {
    children: db.children,
    parents: db.users.filter(u => u.role === 'parent'),
    classes: db.classes
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

  const db = getDb();
  
  const existingUser = db.users.find(u => u.username.toLowerCase() === data.username.trim().toLowerCase());
  if (existingUser) {
    return { error: 'Username นี้มีในระบบแล้ว กรุณาเลือก Username อื่น' };
  }

  const coursesPurchasedList = (data.courses_purchased || []).map(cp => {
    const cls = db.classes.find(c => c.id === cp.class_id);
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
    const cls = db.classes.find(c => c.id === data.course_id);
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

  const newUser: any = {
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

  // Audit Log entry for parent registration by Admin
  const totalPaid = Number(data.payment_details?.amount_paid) || 0;
  const auditLog: any = {
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
    sender_bank_info: data.payment_details?.sender_bank_info || '',
    payment_time: data.payment_details?.payment_time || '',
    remark: data.payment_details?.remark || `Admin สร้างบัญชีผู้ปกครองใหม่ (${newUser.username})`
  };
  if (!db.auditLogs) db.auditLogs = [];
  db.auditLogs.unshift(auditLog);

  db.users.push(newUser);
  saveDb(db);

  revalidatePath('/admin/members');
  revalidatePath('/admin/audit');

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

  const db = getDb();
  const targetUser = db.users.find(u => u.id === userId && u.role === 'parent');
  if (!targetUser) return { error: 'Parent user not found' };

  if (data.full_name) targetUser.full_name = data.full_name.trim();
  if (data.phone_number) targetUser.phone_number = data.phone_number.trim();
  if (data.password && data.password.trim() !== '') targetUser.password = data.password.trim();
  if (data.max_children_allowed) (targetUser as any).max_children_allowed = Number(data.max_children_allowed);

  if (data.courses_purchased) {
    const updatedList = data.courses_purchased.map(cp => {
      const cls = db.classes.find(c => c.id === cp.class_id);
      const existingCourse = targetUser.courses_purchased?.find(c => c.class_id === cp.class_id);
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

    targetUser.courses_purchased = updatedList;
  }

  saveDb(db);
  revalidatePath('/admin/members');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function deleteParentAccount(userId: string) {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized' };

  const db = getDb();
  const parentUser = db.users.find(u => u.id === userId && u.role === 'parent');
  if (!parentUser) return { error: 'Parent account not found' };

  // Remove parent user
  db.users = db.users.filter(u => u.id !== userId);

  // Remove associated children and their bookings
  const childrenIds = db.children.filter(c => c.parent_id === userId).map(c => c.id);
  db.children = db.children.filter(c => c.parent_id !== userId);
  db.bookings = db.bookings.filter(b => !childrenIds.includes(b.child_id));

  saveDb(db);

  revalidatePath('/admin/members');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function getAuditLogsAction() {
  const user = await getUser();
  if (user?.role !== 'admin') return { error: 'Not authorized', auditLogs: [] };
  const db = getDb();
  return { success: true, auditLogs: db.auditLogs || [] };
}
