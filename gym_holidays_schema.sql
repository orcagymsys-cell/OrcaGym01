-- ORCA Gymnastics - Gym Holidays Schema
CREATE TABLE IF NOT EXISTS public.gym_holidays (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    course_name TEXT DEFAULT 'All Courses',
    reason TEXT DEFAULT 'วันหยุดทำการ',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.gym_holidays ENABLE ROW LEVEL SECURITY;

-- Allow read and write for all users (same as bookings/slot_quotas)
DROP POLICY IF EXISTS "Allow all actions for gym_holidays" ON public.gym_holidays;
CREATE POLICY "Allow all actions for gym_holidays" ON public.gym_holidays FOR ALL USING (true) WITH CHECK (true);
