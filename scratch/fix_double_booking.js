const fs = require('fs');

function fixParentBooking() {
  const file = 'app/student/[id]/book/page.tsx';
  let code = fs.readFileSync(file, 'utf8');

  const target = `const remaining = freshChild.total_hours - freshChild.used_hours;
    if (remaining <= 0) {`;
  
  const replacement = `// ป้องกันการจองคลาสซ้ำในวันและเวลาเดียวกัน
    const existingBookings = await store.getBookings(freshChild.id, selectedDate);
    const hasSameSlot = existingBookings.some(b => b.time_slot === selectedSlot && b.status !== 'cancelled' && b.status !== 'Cancelled');
    
    if (hasSameSlot) {
      setAlertModalText('⚠️ น้องจองคลาสในรอบเวลานี้ไปแล้วค่ะ ไม่สามารถจองซ้ำได้');
      return;
    }

    const remaining = freshChild.total_hours - freshChild.used_hours;
    if (remaining <= 0) {`;

  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(file, code, 'utf8');
    console.log('Fixed Parent Booking');
  }
}

function fixAdminBooking() {
  const file = 'app/admin/dashboard/page.tsx';
  let code = fs.readFileSync(file, 'utf8');

  const target = `const allBookings = await store.getBookings(undefined, adminBookingDate);`;
  
  const replacement = `const allBookings = await store.getBookings(undefined, adminBookingDate);
    
    // Check double booking for the specific child
    const childAlreadyBooked = allBookings.some(b => b.child_id === adminBookingChild.id && b.time_slot === adminBookingSlot && b.status !== 'Cancelled');
    if (childAlreadyBooked) {
      showToast('⚠️ เด็กคนนี้ถูกจองในรอบเวลานี้ไปแล้ว ไม่สามารถจองซ้ำได้');
      return;
    }`;

  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(file, code, 'utf8');
    console.log('Fixed Admin Dashboard (page.tsx)');
  }
}

function fixAdminBookingFixed(fileName) {
  const file = 'app/admin/dashboard/' + fileName;
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  const target = `const allBookings = await store.getBookings(undefined, adminBookingDate);`;
  
  const replacement = `const allBookings = await store.getBookings(undefined, adminBookingDate);
    
    // Check double booking for the specific child
    const childAlreadyBooked = allBookings.some(b => b.child_id === adminBookingChild.id && b.time_slot === adminBookingSlot && b.status !== 'Cancelled');
    if (childAlreadyBooked) {
      showToast('⚠️ เด็กคนนี้ถูกจองในรอบเวลานี้ไปแล้ว ไม่สามารถจองซ้ำได้');
      return;
    }`;

  if (code.includes(target)) {
    code = code.replace(target, replacement);
    fs.writeFileSync(file, code, 'utf8');
    console.log('Fixed Admin Dashboard (' + fileName + ')');
  }
}

fixParentBooking();
fixAdminBooking();
fixAdminBookingFixed('page_fixed.tsx');
fixAdminBookingFixed('page_fixed2.tsx');
