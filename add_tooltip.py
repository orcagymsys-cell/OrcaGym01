import re

path = 'app/home/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = "const isApproved = child.status === 'approved';"
replace1 = "const isApproved = child.status === 'approved';\n            const childBookings = (bookings || []).filter(b => b.child_id === child.id && b.status !== 'Cancelled' && b.status !== 'cancelled').sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());"

if target1 in content:
    content = content.replace(target1, replace1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)