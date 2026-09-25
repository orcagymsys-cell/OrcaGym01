import os

def replace_in_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return
    
    replacements = [
        ("(b.time_slot || '').replace(/:/g, '.') === (c.time || '').replace(/:/g, '.')", "(b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.') === (c.time || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.')"),
        ("(b.time_slot || '').replace(/:/g, '.') === (adminBookingSlot || '').replace(/:/g, '.')", "(b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.') === (adminBookingSlot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.')"),
        ("(b.time_slot || '').replace(/:/g, '.') === (selectedSlot || '').replace(/:/g, '.')", "(b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.') === (selectedSlot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.')"),
        ("(b.time_slot || '').replace(/:/g, '.') === (slot || '').replace(/:/g, '.')", "(b.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.') === (slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.')"),
        ("(booking.time_slot || '').replace(/:/g, '.') === (slot || '').replace(/:/g, '.')", "(booking.time_slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.') === (slot || '').replace(/:/g, '.').replace(/^(\d)\./, '0\.')"),
    ]
    
    new_content = content
    for k, v in replacements:
        new_content = new_content.replace(k, v)
        
    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {path}')

for root, dirs, files in os.walk('app'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file))
