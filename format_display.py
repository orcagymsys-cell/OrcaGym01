import os
import re

def replace_in_file(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return
    
    new_content = content
    js_code = \"{(b.time_slot || '').replace(/:/g, '.').replace(/^(\\\\d)\\\\./, '0$1.')}\"
    js_code2 = \"{(booking.time_slot || '').replace(/:/g, '.').replace(/^(\\\\d)\\\\./, '0$1.')}\"
    js_code3 = \"{(urgentAlertBooking.time_slot || '').replace(/:/g, '.').replace(/^(\\\\d)\\\\./, '0$1.')}\"
    
    js_tpl = \"${(b.time_slot || '').replace(/:/g, '.').replace(/^(\\\\d)\\\\./, '0$1.')}\"
    js_tpl2 = \"${(booking.time_slot || '').replace(/:/g, '.').replace(/^(\\\\d)\\\\./, '0$1.')}\"

    new_content = re.sub(r'\{b\.time_slot\}', js_code, new_content)
    new_content = re.sub(r'\{booking\.time_slot\}', js_code2, new_content)
    new_content = re.sub(r'\{urgentAlertBooking\.time_slot\}', js_code3, new_content)
    
    new_content = re.sub(r'\$\{b\.time_slot\}', js_tpl, new_content)
    new_content = re.sub(r'\$\{booking\.time_slot\}', js_tpl2, new_content)

    if new_content != content:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f'Updated {path}')

for root, dirs, files in os.walk('app'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            replace_in_file(os.path.join(root, file))
