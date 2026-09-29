import re

path = 'app/admin/dashboard/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r\"b\.status !== 'Cancelled'\)\.sort\(\(a,\", r\"b.status !== 'Cancelled' && b.status !== 'cancelled').sort((a,\", content)
content = re.sub(r\"b\.status !== 'Cancelled' &&\s*\(allKids\", r\"b.status !== 'Cancelled' && b.status !== 'cancelled' && (allKids\", content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)