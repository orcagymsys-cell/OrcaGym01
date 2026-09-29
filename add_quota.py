import os
import re

path = 'app/admin/dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = r'(\{\/\* ข้อมูลผู้ปกครอง \*\/\}\s*<div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">\s*<div className="font-bold text-\[\#001a3a\] mb-2 flex items-center gap-2">\s*<span>👨‍👩‍👧</span> ข้อมูลครอบครัว\s*</div>)'

replacement = r'''{/* ข้อมูลโควต้าเรียน (ใหม่) */}
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100 mb-4">
                     <div className="font-bold text-[#001a3a] mb-2 flex items-center gap-2">
                       <span>🎟️</span> สรุปโควต้าการเรียนของน้อง
                     </div>
                     <div className="space-y-1 text-slate-700">
                       <div>คอร์สที่เรียน: <strong>{c.course_name || 'Orca Cubs'}</strong></div>
                       <div>โควต้าทั้งหมดที่ได้: <strong>{c.total_hours} ครั้ง</strong></div>
                       <div>ใช้จองไปแล้ว: <strong className="text-blue-600">{cBookings.length} ครั้ง</strong></div>
                       <div className="pt-2 mt-2 border-t border-amber-200/60">
                         <div className="text-base">คงเหลือเรียนได้: <strong className="text-rose-600 text-lg">{Math.max(0, c.total_hours - cBookings.length)} ครั้ง</strong></div>
                       </div>
                     </div>
                  </div>
                  
                  \1'''

if re.search(target, content):
    content = re.sub(target, replacement, content)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Target not found')