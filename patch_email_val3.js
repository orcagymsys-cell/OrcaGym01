const fs = require('fs');
let lines = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/'));

if (start !== -1) {
  lines.splice(start, 5); // remove the wrongly inserted lines
  
  const target = lines.findIndex(l => l.includes('const phoneLen = newParentPhone.replace('));
  lines.splice(target, 0, `    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(newParentEmail.trim())) {
      showToast('กรุณากรอกอีเมลให้ถูกต้องตามรูปแบบสากล (ต้องมี @ และใช้ภาษาอังกฤษเท่านั้น)');
      return;
    }`);
  
  fs.writeFileSync('app/admin/dashboard/page.tsx', lines.join('\n'), 'utf8');
  console.log('Fixed insertion by splice');
} else {
  console.log('Could not find wrongly inserted lines');
}
