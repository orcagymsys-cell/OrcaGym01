export type Role = 'parent' | 'admin';
export type Gender = 'Boy' | 'Girl';
export type Status = 'pending' | 'approved';

export interface User {
  id: string;
  role: Role;
  username: string; // for login
  full_name: string;
  phone_number: string;
  first_login: boolean;
}

export interface Child {
  id: string;
  parent_id: string;
  full_name: string;
  nickname: string;
  dob: string; // YYYY-MM-DD
  gender: Gender;
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
  date: string; // YYYY-MM-DD
  status: Status | 'cancelled';
}

export interface AuditLog {
  id: string;
  admin_id: string;
  target_child_id: string;
  action_type: string;
  hours_added: number;
  created_at: string;
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
}
