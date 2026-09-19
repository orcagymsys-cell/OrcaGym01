const fs = require('fs');
let text = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

text = text.replace(
  /if \(!newParentName \|\| !newParentEmail\) \{\s*showToast\('กรุณากรอกชื่อและอีเมลผู้ปกครอง'\);\s*return;\s*\}/,
  `if (!newParentName || !newParentEmail || !newParentPhone) {\n      showToast('กรุณากรอกข้อมูล: ชื่อ-นามสกุล, อีเมล และเบอร์โทรศัพท์ผู้ปกครองให้ครบถ้วน');\n      return;\n    }`
);

text = text.replace(
  /if \(!hoursToAdd\) \{\s*showToast\('กรุณาเลือกจำนวนโควต้า\/คลาสที่ซื้อ'\);\s*return;\s*\}/,
  `if (!hoursToAdd) {\n      showToast('กรุณาเลือก คลาส & โควต้าที่ซื้อ');\n      return;\n    }\n    if (!paymentAmount || !paymentPayerName || !paymentBank) {\n      showToast('กรุณากรอกข้อมูลหลักฐานการชำระเงินให้ครบถ้วน (จำนวนเงินที่โอน, ชื่อบัญชีผู้โอน, ธนาคารต้นทาง)');\n      return;\n    }`
);

fs.writeFileSync('app/admin/dashboard/page.tsx', text, 'utf8');
console.log('Patched regex');
