const fs = require('fs');
let text = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

const targetAdminCheck = `    const remaining = adminBookingChild.total_hours - adminBookingChild.used_hours;
    if (remaining <= 0) {
      showToast('⚠️ ชั่วโมงเรียนของนักเรียนหมดแล้ว กรุณาเติมชั่วโมงให้ก่อนจองคลาส');
      return;
    }`;

const newAdminCheck = `    const allChildBookings = allBookings.filter(b => b.child_id === adminBookingChild.id && b.status !== 'cancelled' && b.status !== 'Cancelled');
    const remaining = adminBookingChild.total_hours - allChildBookings.length;
    if (remaining <= 0) {
      showToast('⚠️ ชั่วโมงเรียนของนักเรียนหมดแล้ว (จองครบโควต้าแล้ว)');
      return;
    }`;
text = text.replace(targetAdminCheck, newAdminCheck);

const targetAdminUpdate = `    await store.saveBooking(newBooking);
    const newUsed = adminBookingChild.used_hours + 1;
    await store.updateChild(adminBookingChild.id, { used_hours: newUsed });`;

const newAdminUpdate = `    await store.saveBooking(newBooking);
    const newUsed = allChildBookings.length + 1;
    await store.updateChild(adminBookingChild.id, { used_hours: newUsed });`;
text = text.replace(targetAdminUpdate, newAdminUpdate);

fs.writeFileSync('app/admin/dashboard/page.tsx', text, 'utf8');
console.log('Patched admin booking');
