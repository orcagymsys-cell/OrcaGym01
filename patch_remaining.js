const fs = require('fs');
let lines = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('.filter(c => c.status === \'approved\' && (remaining) <= 2)'));
if (start !== -1) {
  lines[start] = `      .filter(c => c.status === 'approved' && (c.total_hours - allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length) <= 2)`;
  lines[start+1] = `      .map(c => \`\${c.nickname} (เหลือ \${c.total_hours - allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length} ชม.)\`)`;
  fs.writeFileSync('app/admin/dashboard/page.tsx', lines.join('\n'), 'utf8');
  console.log('Fixed remaining error');
} else {
  console.log('Could not find line');
}
