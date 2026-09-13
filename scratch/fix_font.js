const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

code = code.replace(
  /<span className="text-xs text-slate-500 font-normal">อัปവเรียลไทม์<\/span>/g,
  '<span className="text-xs text-slate-500 font-normal">อัปเดตเรียลไทม์</span>'
);

fs.writeFileSync('app/admin/dashboard/page.tsx', code, 'utf8');
console.log('Fixed font encoding issue!');
