export type Role = 'parent' | 'admin';
export type Gender = 'Boy' | 'Girl';
export type Status = 'pending' | 'approved';

export interface PurchasedCourse {
  class_id: string;
  class_title?: string;
  purchased_classes?: number; // e.g. 10
  bonus_classes?: number;     // e.g. 1
  total_classes: number;      // e.g. 11 (purchased + bonus)
  used_classes: number;
  remaining_classes: number;
  expiry_date?: string;
}

export interface User {
  id: string;
  role: Role;
  username: string; // for login
  password?: string;
  full_name: string;
  phone_number: string;
  first_login: boolean;
  max_children_allowed?: number;
  courses_purchased?: PurchasedCourse[];
  purchased_course_id?: string;
  purchased_course_name?: string;
  purchased_classes?: number;
}

export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  nickname: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
  assigned_course_id?: string;
  assigned_course_title?: string;
  course_approval_status?: Status;
  total_classes: number;
  used_classes: number;
  remaining_classes: number;
  expiry_date: string; // YYYY-MM-DD
  status: Status;
}

export interface GymClassPricing {
  id: string;
  times: string;
  fees: string;
  duration: string;
  tag?: string; // e.g. "free 2"
}

export interface GymClassScheduleRow {
  id: string;
  label: string; // e.g. "Tuesday - Friday"
  slots: string[]; // e.g. ["10:30-12:00", "14:30-16:00"]
  tag?: string; // e.g. "Tue-Wed" under a slot
  tagIndex?: number; // Which slot index has the tag
}

export interface GymClass {
  id: string;
  name: string; // Original, could be the internal ID or just fallback
  capacity: number; // Original
  title?: string;
  subtitle?: string;
  description?: string;
  ageRange?: string;
  durationText?: string;
  theme?: 'blue' | 'pink' | 'orange' | 'green' | 'purple' | 'yellow'; // the background theme
  pricing?: GymClassPricing[];
  scheduleGrid?: GymClassScheduleRow[];
}

export interface Schedule {
  id: string;
  class_id: string;
  day_of_week: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
  start_time: string; // e.g. "10:30"
  end_time: string; // e.g. "12:00"
}

export interface Booking {
  id: string;
  child_id: string;
  schedule_id: string;
  class_id?: string;
  time_slot?: string;
  date: string; // YYYY-MM-DD
  status: Status | 'cancelled';
}

export interface AuditLog {
  id: string;
  timestamp?: string; // ISO String e.g. 2026-08-03T12:48:00+07:00
  admin_id: string;
  admin_name?: string;
  action_type: string;
  target_user_id?: string;
  target_user_name?: string;
  target_child_id?: string;
  target_child_name?: string;
  course_id?: string;
  course_name?: string;
  purchased_classes?: number;
  bonus_classes?: number;
  total_classes?: number;
  remaining_classes?: number;
  amount_paid?: number;
  payment_slip_url?: string;
  payment_ref_no?: string;
  sender_bank_info?: string;
  payment_time?: string;
  remark?: string;
  details?: string;
  created_at?: string;
  hours_added?: number;
}

export interface AboutUsInfo {
  company_name_th: string;
  company_name_en: string;
  registration_number: string;
  business_description: string;
  address: string;
}

export interface LeadContact {
  id: string;
  parent_name: string;
  phone_number: string;
  child_info?: string;
  selected_promotion?: string;
  note?: string;
  created_at: string;
  status: 'pending' | 'contacted';
}

export interface DbSchema {
  users: User[];
  children: Child[];
  classes: GymClass[];
  schedules: Schedule[];
  bookings: Booking[];
  auditLogs: AuditLog[];
  settings: {
    max_children_allowed: number;
  };
  aboutUs?: AboutUsInfo;
  leads?: LeadContact[];
}

export function toISODateString(dStr: string): string {
  if (!dStr) return '';
  const trimmed = dStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const matchFormatted = trimmed.match(/(?:[A-Za-z]{3}-)?(\d{1,2})-([A-Za-z]{3})-(\d{4})/);
  if (matchFormatted) {
    const day = matchFormatted[1].padStart(2, '0');
    const monthStr = matchFormatted[2].toLowerCase();
    const year = matchFormatted[3];
    const months: { [key: string]: string } = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const month = months[monthStr] || '01';
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return trimmed;
}

export function isSameTimeSlot(t1: string, t2: string): boolean {
  if (!t1 || !t2) return false;
  const start1 = t1.replace(/\./g, ':').replace(/\s+/g, '').split('-')[0];
  const start2 = t2.replace(/\./g, ':').replace(/\s+/g, '').split('-')[0];
  return start1 === start2;
}
