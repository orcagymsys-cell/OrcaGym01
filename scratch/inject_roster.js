const fs = require('fs');
let p = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

if (!p.includes('import StudentBookingsRoster')) {
  p = p.replace(
    /import WeeklyScheduleAdmin from '@\/app\/components\/WeeklyScheduleAdmin';/,
    "import WeeklyScheduleAdmin from '@/app/components/WeeklyScheduleAdmin';\nimport StudentBookingsRoster from '@/app/components/StudentBookingsRoster';"
  );
}

p = p.replace(
  /<WeeklyScheduleAdmin allBookings=\{allBookings\} \/>/,
  `<WeeklyScheduleAdmin allBookings={allBookings} />
            <StudentBookingsRoster allBookings={allBookings} childrenList={children} parentsList={parents} onBookingCancelled={() => window.location.reload()} />`
);

fs.writeFileSync('app/admin/dashboard/page.tsx', p, 'utf8');
console.log('Successfully injected into dashboard');
