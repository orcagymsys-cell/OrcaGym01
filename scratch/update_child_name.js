const fs = require('fs');

const file = 'app/schedule/page.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const childName = b\.child_nickname \|\| \(childIdx >= 0 \? children\[childIdx\]\.nickname : 'ไม่ทราบชื่อ'\);/,
  `let childName = b.child_nickname || (childIdx >= 0 ? children[childIdx].nickname : 'ไม่ทราบชื่อ');
                                        if (childName !== 'ไม่ทราบชื่อ' && !childName.startsWith('น้อง')) {
                                          childName = 'น้อง' + childName;
                                        }`
);

fs.writeFileSync(file, code, 'utf8');
