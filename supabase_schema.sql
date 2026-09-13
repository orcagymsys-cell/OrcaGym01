-- ORCA Gymnastics Supabase Schema (Clean Slate)

-- 1. Profiles Table (For Admin and Parents)
CREATE TABLE public.profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE,
    name TEXT,
    phone TEXT,
    email TEXT,
    password TEXT,
    role TEXT CHECK (role IN ('admin', 'parent')),
    
    -- Course Info
    purchased_hours INTEGER DEFAULT 0,
    
    -- Payment Info
    payment_amount NUMERIC,
    payment_ref_no TEXT,
    payment_payer_name TEXT,
    payment_bank TEXT,
    payment_datetime TEXT,
    payment_slip TEXT,
    
    -- PDPA Info
    pdpa_accepted BOOLEAN DEFAULT FALSE,
    media_consent BOOLEAN DEFAULT FALSE,
    pdpa_accepted_at TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert Default Admin
INSERT INTO public.profiles (id, user_id, name, password, role) 
VALUES ('u_admin', 'admin', 'แอดมิน Orca', '123', 'admin');

-- 2. Children Table (For Students)
CREATE TABLE public.children (
    id TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name TEXT,
    nickname TEXT,
    dob TEXT,
    gender TEXT,
    avatar TEXT,
    status TEXT DEFAULT 'pending',
    
    course_name TEXT,
    total_hours INTEGER DEFAULT 0,
    used_hours INTEGER DEFAULT 0,
    expiry_date TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Bookings Table
CREATE TABLE public.bookings (
    id TEXT PRIMARY KEY,
    child_id TEXT REFERENCES public.children(id) ON DELETE CASCADE,
    booking_date TEXT,
    time_slot TEXT,
    status TEXT DEFAULT 'Confirmed',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Audit Logs Table
CREATE TABLE public.audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Slot Quotas Table
CREATE TABLE public.slot_quotas (
    id TEXT PRIMARY KEY,
    booking_date TEXT,
    time_slot TEXT,
    course_name TEXT,
    quota INTEGER DEFAULT 0
);
