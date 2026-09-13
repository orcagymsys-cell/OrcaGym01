const fs = require('fs');
const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
const chars = new Set();
for(let i=0; i<content.length; i++) {
    const c = content.charCodeAt(i);
    if(c >= 0x80) chars.add(c);
}
console.log(Array.from(chars).map(c => c.toString(16)).join(', '));
