const fs = require('fs');
let text = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const regex = /if \(phoneLen < 10 \|\| phoneLen > 12\) \{\n\s*showToast\('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง \(10-12 หลัก\)'\);\n\s*return;\n\s*const emailRegex = \/\^\[a-zA-Z0-9._%\+-\]\+@\[a-zA-Z0-9.-\]\+\\.\[a-zA-Z\]\{2,\}\$\/;\n\s*if \(\!emailRegex\.test\(newParentEmail\.trim\(\)\)\) \{\n\s*showToast\('กรุณากรอกอีเมลให้ถูกต้องตามรูปแบบสากล \(ต้องมี @ และใช้ภาษาอังกฤษเท่านั้น\)'\);\n\s*return;\n\s*\}\n\s*\}/;

const fixed = `if (phoneLen < 10 || phoneLen > 12) {\n      showToast('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (10-12 หลัก)');\n      return;\n    }\n    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;\n    if (!emailRegex.test(newParentEmail.trim())) {\n      showToast('กรุณากรอกอีเมลให้ถูกต้องตามรูปแบบสากล (ต้องมี @ และใช้ภาษาอังกฤษเท่านั้น)');\n      return;\n    }`;

text = text.replace(regex, fixed);
fs.writeFileSync('app/admin/dashboard/page.tsx', text, 'utf8');
console.log('Fixed insertion');
