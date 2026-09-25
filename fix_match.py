import os
import re

def replace_in_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return
    
    replacements = [
        (r'b\.time_slot === c\.time', r"(b.time_slot || '').replace(/:/g, '.') === (c.time || '').replace(/:/g, '.')"),
        (r'b\.time_slot === adminBookingSlot', r"(b.time_slot || '').replace(/:/g, '.') === (adminBookingSlot || '').replace(/:/g, '.')"),
        (r'b\.time_slot === selectedSlot', r"(b.time_slot || '').replace(/:/g, '.') === (selectedSlot || '').replace(/:/g, '.')"),
        (r'b\.time_slot === slot', r"(b.time_slot || '').replace(/:/g, '.') === (slot || '').replace(/:/g, '.')"),
        (r'booking\.time_slot === slot', r"(booking.time_slot || '').replace(/:/g, '.') === (slot || '').replace(/:/g, '.')"),
    ]
    
    new_content = content
    for k, v in replacements:
        new_content = re.sub(k, v, new_content)
        
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {path}')

for root, dirs, files in os.walk('app'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file))
