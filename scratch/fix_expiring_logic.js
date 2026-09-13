const fs = require('fs');

const files = [
  'app/admin/dashboard/page.tsx',
  'app/admin/dashboard/page_fixed.tsx',
  'app/admin/dashboard/page_fixed2.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Replace the logic
    const oldLogic = /const expiringStudentsList = children\.filter\(c => \(c\.total_hours - c\.used_hours\) <= 2\);/g;
    const newLogic = `const expiringStudentsList = children.filter(c => {
    const remaining = c.total_hours - c.used_hours;
    if (remaining <= 0) return false;
    if (!c.expiry_date) return false;
    const parts = c.expiry_date.split('/');
    if (parts.length !== 3) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    const expDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });`;

    content = content.replace(oldLogic, newLogic);

    // Replace the text
    const oldText = 'คอร์สคงเหลือ ≤ 2 ชม. (ต้องการการแจ้งเตือน)';
    const newText = 'จะหมดอายุใน 7 วัน และยังมีโควต้าเหลือ';
    content = content.replace(new RegExp(oldText, 'g'), newText);
    
    // Also handle cases where it might still be encoded or split across lines if any
    content = content.replace(/คอร์สคงเหลือ[^<]*\s*\(ต้องการการแจ้งเตือน\)/g, newText);

    // Update the Alerts section text
    const oldAlertText = 'สมาชิกที่ซื้อ Course ใกล้หมด';
    const newAlertText = 'สมาชิกที่คอร์สใกล้หมดอายุ (ภายใน 7 วัน)';
    content = content.replace(new RegExp(oldAlertText, 'g'), newAlertText);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed logic in', filePath);
  }
});
