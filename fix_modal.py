import re

path = 'app/home/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'className=\"bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl font-[\'Anuphan\',sans-serif]\"',
    'className=\"bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl font-[\'Anuphan\',sans-serif] max-h-[90vh] flex flex-col\"'
)

content = content.replace(
    '<div className=\"flex justify-between items-center mb-4 pb-3 border-b border-slate-100\">',
    '<div className=\"flex justify-between items-center mb-4 pb-3 border-b border-slate-100 shrink-0\">'
)

content = content.replace(
    '<div className=\"space-y-4\">',
    '<div className=\"space-y-4 overflow-y-auto pr-2\" style={{ scrollbarWidth: \'thin\' }}>'
)

content = content.replace(
    '<div className=\"flex gap-3 pt-2\">',
    '</div>\n                <div className=\"flex gap-3 pt-4 mt-4 border-t border-slate-100 shrink-0\">'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')