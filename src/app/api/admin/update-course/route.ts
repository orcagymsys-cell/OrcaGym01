import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { childId, data } = await req.json();

    const { data: child, error: childErr } = await supabase.from('children').select('*').eq('id', childId).single();
    if (childErr || !child) return NextResponse.json({ error: 'Child not found' }, { status: 404 });

    const updateData: any = {};
    if (data.courseId) {
      const { data: gymClass } = await supabase.from('classes').select('*').eq('id', data.courseId).single();
      updateData.assigned_course_id = data.courseId;
      updateData.assigned_course_title = gymClass?.title || gymClass?.name || 'Orca Cubs Class';
    }

    const { data: parentUser, error: parentErr } = await supabase.from('users').select('*').eq('id', child.parent_id).single();
    if (parentErr || !parentUser) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

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
      await supabase.from('users').update({ courses_purchased: parentUser.courses_purchased }).eq('id', parentUser.id);
    }
    
    await supabase.from('children').update(updateData).eq('id', childId);

    try {
      revalidatePath('/admin/members');
      revalidatePath('/dashboard');
      revalidatePath('/schedule');
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
