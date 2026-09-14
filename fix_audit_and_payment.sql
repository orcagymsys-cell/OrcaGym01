-- 1. เพิ่มคอลัมน์ payment_history ในตาราง profiles เพื่อเก็บประวัติการซื้อแพ็กเกจของผู้ปกครอง
ALTER TABLE public.profiles ADD COLUMN payment_history JSONB;

-- 2. ลบตาราง audit_logs ตัวเก่าที่โครงสร้างผิดพลาดทิ้ง
DROP TABLE IF EXISTS public.audit_logs;

-- 3. สร้างตาราง audit_logs ใหม่ให้ตรงกับรูปแบบในโค้ด
CREATE TABLE public.audit_logs (
    id TEXT PRIMARY KEY,
    admin_name TEXT,
    action_type TEXT,
    parent_name TEXT,
    child_id TEXT,
    child_name TEXT,
    hours_added INTEGER,
    bonus_hours INTEGER,
    total_hours INTEGER,
    course_name TEXT,
    amount INTEGER,
    slip_ref TEXT,
    slip_url TEXT,
    bank_name TEXT,
    payer_name TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. เปิดใช้งาน RLS เพื่อป้องกันการเข้าถึงจากผู้ไม่หวังดี
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. อนุญาตให้อ่านและเขียนข้อมูล Audit Logs ได้
CREATE POLICY "Allow public read audit" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert audit" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update audit" ON public.audit_logs FOR UPDATE USING (true);
CREATE POLICY "Allow public delete audit" ON public.audit_logs FOR DELETE USING (true);
