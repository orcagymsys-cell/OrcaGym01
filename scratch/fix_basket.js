const fs = require('fs');
let code = fs.readFileSync('app/home/page.tsx', 'utf8');

// Update logic
code = code.replace(
  'const totalRemaining = Math.max(0, totalPurchased - totalUsed);',
  'const totalRemaining = Math.max(0, totalPurchased - totalAllocated);'
);

// Update labels
code = code.replace('จองเรียนไปแล้ว', 'จัดสรรแล้ว');
code = code.replace('จองเรียนแล้ว:', 'จัดสรรให้เด็กแล้ว:');
code = code.replace(
  '<div>จองเรียนแล้ว: <strong>{totalUsed} ครั้ง</strong></div>',
  '<div>จัดสรรให้เด็กแล้ว: <strong>{totalAllocated} ครั้ง</strong></div>'
);
code = code.replace(
  '<div className="text-slate-800 text-xs sm:text-sm font-extrabold">{totalUsed} ครั้ง</div>',
  '<div className="text-slate-800 text-xs sm:text-sm font-extrabold">{totalAllocated} ครั้ง</div>'
);

fs.writeFileSync('app/home/page.tsx', code, 'utf8');
console.log('Fixed home page family basket display');
