export interface PaymentProofRecord {
  id: string;
  payment_amount?: number;
  payment_ref_no?: string;
  payment_payer_name?: string;
  payment_bank?: string;
  payment_datetime?: string;
  payment_slip?: string;
  purchased_hours?: number;
  course_name?: string;
  note?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  email?: string;
  password?: string;
  role: 'parent' | 'admin';
  payment_amount?: number;
  payment_ref_no?: string;
  payment_payer_name?: string;
  payment_bank?: string;
  payment_datetime?: string;
  payment_slip?: string;
  payment_history?: PaymentProofRecord[];
  purchased_hours?: number;
  created_at?: string;
  pdpa_accepted?: boolean;
  media_consent?: boolean;
  pdpa_accepted_at?: string;
}

export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  nickname: string;
  dob: string;
  gender: string;
  avatar: string;
  photo_url?: string;
  status: 'pending' | 'approved';
  course_name: string;
  total_hours: number;
  used_hours: number;
  bonus_hours?: number;
  expiry_date: string;
  payment_amount?: number;
  slip_ref?: string;
  slip_url?: string;
  transfer_bank?: string;
  transfer_name?: string;
  transfer_time?: string;
  remark?: string;
  created_at?: string;
}

export interface Booking {
  id: string;
  child_id: string;
  child_nickname: string;
  child_full_name: string;
  course_name: string;
  booking_date: string;
  time_slot: string;
  status: string; // 'Booked' | 'Cancelled' | 'confirmed'
  booked_by_role?: 'parent' | 'admin';
  created_at?: string;
}

export interface AuditLog {
  id: string;
  admin_name: string;
  action_type?: 'approve_course' | 'create_parent' | 'topup_hours' | 'bonus_hours' | string;
  parent_name?: string;
  child_id?: string;
  child_name?: string;
  hours_added?: number;
  bonus_hours?: number;
  total_hours?: number;
  course_name?: string;
  amount?: number;
  slip_ref?: string;
  slip_url?: string;
  bank_name?: string;
  payer_name?: string;
  note?: string;
  created_at?: string;
}

export interface SlotQuota {
  id?: string;
  booking_date: string;
  time_slot: string;
  quota: number;
}

export interface PricingOption {
  id?: string;
  times: string | number;
  fee: string | number;
  duration: string;
  tag?: string;
}

export interface ScheduleDayGroup {
  id?: string;
  day_label: string;
  time_slots: string[];
  highlight_tag?: string;
  highlight_slot_no?: number | string;
}

export interface CourseConfig {
  id: string;
  internal_name: string;
  display_title: string;
  subtitle: string;
  age_range: string;
  duration_text: string;
  theme_color?: string;
  max_capacity: number;
  description: string;
  pricing_options: PricingOption[];
  schedule_groups?: ScheduleDayGroup[];
}
