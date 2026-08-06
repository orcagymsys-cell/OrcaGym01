'use server';

import { supabase } from '@/lib/supabase';

export async function submitLeadContact(data: {
  parent_name: string;
  phone_number: string;
  child_info: string;
  selected_promotion: string;
  note?: string;
}) {
  if (!data.parent_name || !data.phone_number) {
    return { error: 'กรุณากรอกชื่อผู้ปกครองและเบอร์โทรศัพท์ติดต่อ' };
  }

  const newLead = {
    id: `lead_${Date.now()}`,
    parent_name: data.parent_name.trim(),
    phone_number: data.phone_number.trim(),
    child_info: data.child_info.trim(),
    selected_promotion: data.selected_promotion,
    note: data.note?.trim() || '',
    created_at: new Date().toISOString(),
    status: 'pending' // pending, contacted
  };

  await supabase.from('leads').insert([newLead]);

  return { success: true };
}
