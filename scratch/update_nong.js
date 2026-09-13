const fs = require('fs');

// Roster
let roster = fs.readFileSync('app/components/StudentBookingsRoster.tsx', 'utf8');
roster = roster.replace(
  /{b\.child_nickname \|\| 'น้องนักเรียน'}/g,
  `{b.child_nickname ? (b.child_nickname.startsWith('น้อง') ? b.child_nickname : \`น้อง\${b.child_nickname}\`) : 'น้องนักเรียน'}`
);
fs.writeFileSync('app/components/StudentBookingsRoster.tsx', roster, 'utf8');

// Admin Schedule
let adminSched = fs.readFileSync('app/components/WeeklyScheduleAdmin.tsx', 'utf8');
adminSched = adminSched.replace(
  /{b\.child_nickname \|\| 'ไม่ทราบชื่อ'}/g,
  `{b.child_nickname ? (b.child_nickname.startsWith('น้อง') ? b.child_nickname : \`น้อง\${b.child_nickname}\`) : 'น้องนักเรียน'}`
);
fs.writeFileSync('app/components/WeeklyScheduleAdmin.tsx', adminSched, 'utf8');
