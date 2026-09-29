import re

with open('app/home/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the anchor tag for LINE
content = re.sub(
    r'<a[^>]*href=\"https://line.me\"[^>]*>.*?</a>', 
    '', 
    content, 
    flags=re.DOTALL
)

with open('app/home/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
