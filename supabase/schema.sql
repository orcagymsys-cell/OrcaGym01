-- ============================================================
-- Orca Gymnastics Database Schema & Setup for Supabase
-- Run this script in your Supabase SQL Editor (1-Click Setup)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Parent & Admin Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'parent', -- 'parent' or 'admin'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default admin account
INSERT INTO public.profiles (user_id, name, phone, password, role)
VALUES ('admin', 'แอดมิน Orca', '0800000000', '123', 'admin')
ON CONFLICT (user_id) DO NOTHING;

-- Seed default demo parent account
INSERT INTO public.profiles (user_id, name, phone, password, role)
VALUES ('parent', 'คุณพ่อ สมชาย', '0812345678', '123', 'parent')
ON CONFLICT (user_id) DO NOTHING;

-- 2. Children Table
CREATE TABLE IF NOT EXISTS public.children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  dob DATE NOT NULL,
  gender TEXT NOT NULL,
  avatar TEXT DEFAULT 'girl',
  photo_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' or 'approved'
  course_name TEXT DEFAULT 'Orca Cubs',
  total_hours INT DEFAULT 0,
  used_hours INT DEFAULT 0,
  expiry_date TEXT DEFAULT '-',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bookings Table (Slot Reservation)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
  child_nickname TEXT NOT NULL,
  child_full_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Logs Table (Anti-Fraud Summary)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_name TEXT NOT NULL,
  child_id UUID REFERENCES public.children(id) ON DELETE SET NULL,
  child_name TEXT NOT NULL,
  hours_added INT NOT NULL,
  course_name TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Slot Quotas Table (Custom Capacity per Slot, Default 10)
CREATE TABLE IF NOT EXISTS public.slot_quotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  quota INT DEFAULT 10,
  UNIQUE(booking_date, time_slot)
);

-- 6. Storage Bucket for Student Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set public read policy for storage bucket
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT USING (bucket_id = 'student-photos');

CREATE POLICY "Public Upload Access" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'student-photos');
