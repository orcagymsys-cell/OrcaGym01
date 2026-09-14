const fs = require('fs');
let text = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const target = `    const allBookings = await store.getBookings(undefined, adminBookingDate);
    
    // Check double booking for the specific child
    const childAlreadyBooked = allBookings.some(b => b.child_id === adminBookingChild.id && b.time_slot === adminBookingSlot && b.status !== 'Cancelled');`;

const newCode = `    const existingDayBookings = await store.getBookings(undefined, adminBookingDate);
    
    // Check double booking for the specific child
    const childAlreadyBooked = existingDayBookings.some(b => b.child_id === adminBookingChild.id && b.time_slot === adminBookingSlot && b.status !== 'Cancelled');`;
text = text.replace(target, newCode);

const target2 = `      .filter(c => c.status === 'approved' && (remaining) <= 2)
      .map(c => \`\${c.nickname} (เหลือ \${remaining} ชม.)\`)`;

const new2 = `      .filter(c => { const cRem = c.total_hours - allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length; return c.status === 'approved' && cRem <= 2; })
      .map(c => { const cRem = c.total_hours - allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length; return \`\${c.nickname} (เหลือ \${cRem} ชม.)\`; })`;
text = text.replace(target2, new2);

fs.writeFileSync('app/admin/dashboard/page.tsx', text, 'utf8');
console.log('Fixed block scope error');
