const fs = require('fs');
let text = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// We have multiple instances of `total_hours - c.used_hours` and `total_hours - adminBookingChild.used_hours`
// We will replace them globally with accurate calculations.

text = text.replace(
  /const remaining = c\.total_hours - c\.used_hours;/g,
  `const cActive = allBookings.filter(b => b.child_id === c.id && b.status !== 'cancelled' && b.status !== 'Cancelled');
  const remaining = c.total_hours - cActive.length;`
);

text = text.replace(
  /c\.total_hours - c\.used_hours/g,
  `remaining`
);

text = text.replace(
  /adminBookingChild\.total_hours - adminBookingChild\.used_hours/g,
  `(adminBookingChild.total_hours - allBookings.filter(b => b.child_id === adminBookingChild.id && b.status !== 'cancelled' && b.status !== 'Cancelled').length)`
);

fs.writeFileSync('app/admin/dashboard/page.tsx', text, 'utf8');
console.log('Patched admin display');
