const fs = require('fs');
let text = fs.readFileSync('app/student/[id]/book/page.tsx', 'utf8');

const targetStr = `    // เช็คโควต้าระดับเด็กคนนี้
    // ป้องกันการจองคลาสซ้ำในวันและเวลาเดียวกัน
    const existingBookings = await store.getBookings(freshChild.id, selectedDate);
    const hasSameSlot = existingBookings.some(b => b.time_slot === selectedSlot && b.status !== 'cancelled' && b.status !== 'Cancelled');
    
    if (hasSameSlot) {
      setAlertModalText('⚠️ น้องจองคลาสในรอบเวลานี้ไปแล้วค่ะ ไม่สามารถจองซ้ำได้');
      return;
    }

    const remaining = freshChild.total_hours - freshChild.used_hours;
    if (remaining <= 0) {
      showToast('⚠️ ชั่วโมงเรียนของน้องหมดแล้ว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง');
      return;
    }

    // เช็คโควต้าระดับตะกร้าครอบครัว (Family Basket)
    const currentUser = store.getCurrentUser();
    if (currentUser) {
      const familyChildren = await store.getChildren(currentUser.id);
      const familyTotalUsed = familyChildren.reduce((sum, c) => sum + (c.used_hours || 0), 0);
      const parentPurchased = currentUser.purchased_hours || 6;
      if (familyTotalUsed >= parentPurchased) {
        showToast(\`⚠️ จำนวนคลาสที่ซื้อไว้ (\${parentPurchased} ครั้ง) ถูกใช้ครบแล้วทุกคนในครอบครัว กรุณาติดต่อแอดมินเพื่อเติมชั่วโมง\`);
        return;
      }
    }`;

const newStr = `    // เช็คโควต้าระดับเด็กคนนี้
    const allChildBookings = await store.getBookings(freshChild.id);
    const activeChildBookings = allChildBookings.filter(b => b.status !== 'cancelled' && b.status !== 'Cancelled');
    
    // ป้องกันการจองคลาสซ้ำในวันและเวลาเดียวกัน
    const hasSameSlot = activeChildBookings.some(b => b.booking_date === selectedDate && b.time_slot === selectedSlot);
    
    if (hasSameSlot) {
      setAlertModalText('⚠️ น้องจองคลาสในรอบเวลานี้ไปแล้วค่ะ ไม่สามารถจองซ้ำได้');
      return;
    }

    const remaining = freshChild.total_hours - activeChildBookings.length;
    if (remaining <= 0) {
      showToast('⚠️ ชั่วโมงเรียนของน้องหมดแล้ว (จองครบโควต้าแล้ว)');
      return;
    }

    // เช็คโควต้าระดับตะกร้าครอบครัว (Family Basket)
    const currentUser = store.getCurrentUser();
    if (currentUser) {
      const familyChildren = await store.getChildren(currentUser.id);
      const parentPurchased = currentUser.purchased_hours || 6;
      
      const allBookingsList = await store.getBookings();
      const familyChildrenIds = familyChildren.map(c => c.id);
      const familyActiveBookings = allBookingsList.filter(b => familyChildrenIds.includes(b.child_id) && b.status !== 'cancelled' && b.status !== 'Cancelled');
      
      if (familyActiveBookings.length >= parentPurchased) {
        showToast(\`⚠️ จำนวนคลาสที่ซื้อไว้ (\${parentPurchased} ครั้ง) ถูกใช้จองครบแล้วทุกคนในครอบครัว\`);
        return;
      }
    }`;

text = text.replace(targetStr, newStr);

// Also fix the updateChild line:
const targetUpdate = `    await store.saveBooking(newBooking);
    const newUsed = freshChild.used_hours + 1;
    await store.updateChild(freshChild.id, { used_hours: newUsed });`;
const newUpdate = `    await store.saveBooking(newBooking);
    const newUsed = activeChildBookings.length + 1;
    await store.updateChild(freshChild.id, { used_hours: newUsed });`;
text = text.replace(targetUpdate, newUpdate);

fs.writeFileSync('app/student/[id]/book/page.tsx', text, 'utf8');
console.log('Patched student book page');
