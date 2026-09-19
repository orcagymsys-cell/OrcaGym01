const fs = require('fs');
let text = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const targetStr = `    if (!newParentName || !newParentEmail || !newParentPhone) {\n      showToast('กรุณากรอกข้อมูล: ชื่อ-นามสกุล, อีเมล และเบอร์โทรศัพท์ผู้ปกครองให้ครบถ้วน');\n      return;\n    }`;

const newStr = `    if (!newParentName || !newParentEmail || !newParentPhone) {\n      showToast('กรุณากรอกข้อมูล: ชื่อ-นามสกุล, อีเมล และเบอร์โทรศัพท์ผู้ปกครองให้ครบถ้วน');\n      return;\n    }\n    const phoneLen = newParentPhone.replace(/\\D/g, '').length;\n    if (phoneLen < 10 || phoneLen > 12) {\n      showToast('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10-12 หลัก)');\n      return;\n    }`;

text = text.replace(targetStr, newStr);

fs.writeFileSync('app/admin/dashboard/page.tsx', text, 'utf8');
console.log('Patched phone validation');
