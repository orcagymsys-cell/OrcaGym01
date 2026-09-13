/**
 * Orca Gymnastics Booking Engine
 * Calendar rendering, Quota verification, Hour deduction, & Alerts
 */

class BookingEngine {
  constructor() {
    this.store = window.orcaStore;
  }

  // Available Time Slots Configuration
  getTimeSlots(courseName) {
    if (courseName === 'Mega Orca') {
      return [
        { time: '10:30-12:30', duration: 2 },
        { time: '16:00-18:00', duration: 2 },
        { time: '17:30-19:30', duration: 2 }
      ];
    }
    // Default: Orca Cubs
    return [
      { time: '10:00-12:00', duration: 1.5 },
      { time: '10:30-12:00', duration: 1.5 },
      { time: '14:30-16:00', duration: 1.5 },
      { time: '16:00-17:30', duration: 1.5 },
      { time: '17:30-19:30', duration: 1.5 }
    ];
  }

  getSlotStatus(dateStr, timeSlot) {
    const maxCapacity = this.store.getSlotMaxCapacity(dateStr, timeSlot);
    const existingBookings = this.store.getBookingsByDate(dateStr).filter(b => b.timeSlot === timeSlot);
    const bookedCount = existingBookings.length;
    const remaining = maxCapacity - bookedCount;

    return {
      maxCapacity,
      bookedCount,
      remaining: Math.max(0, remaining),
      isFull: remaining <= 0,
      attendees: existingBookings
    };
  }

  createBooking(childId, dateStr, timeSlot) {
    const child = this.store.getChildById(childId);
    if (!child) {
      return { success: false, message: 'ไม่พบข้อมูลเด็กนักเรียน' };
    }

    if (child.status !== 'approved') {
      return { success: false, message: 'บัญชีนักเรียนยังอยู่ในสถานะรอ Admin อนุมัติและเติมชั่วโมง' };
    }

    const remainingHours = child.totalHours - child.usedHours;
    if (remainingHours <= 0) {
      return { success: false, message: 'ชั่วโมงเรียนคงเหลือของคุณหมดแล้ว กรุณาติดต่อ Admin เพื่อซื้อคลาสเพิ่ม' };
    }

    // Check Quota Limit
    const slotStatus = this.getSlotStatus(dateStr, timeSlot);
    if (slotStatus.isFull) {
      return { success: false, message: `รอบเวลานี้เต็มแล้ว (จำกัด ${slotStatus.maxCapacity} คน/รอบ)` };
    }

    // Check Duplicate Booking for same child on same date
    const existing = this.store.getBookingsByChild(childId).find(b => b.date === dateStr && b.status !== 'cancelled');
    if (existing) {
      return { success: false, message: 'น้องได้ทำการจองเรียนในวันนี้ไปแล้ว' };
    }

    // Deduct 1 Class Hour
    child.usedHours += 1;
    this.store.saveChild(child);

    // Save Booking Record
    const newBooking = {
      id: 'b_' + Date.now(),
      childId: child.id,
      childNickname: child.nickname,
      childFullName: child.fullName,
      parentId: child.parentId,
      date: dateStr,
      timeSlot: timeSlot,
      courseName: child.courseName,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };
    this.store.saveBooking(newBooking);

    return {
      success: true,
      booking: newBooking,
      remainingHours: child.totalHours - child.usedHours
    };
  }

  cancelBooking(bookingId) {
    const booking = this.store.getBookings().find(b => b.id === bookingId);
    if (!booking) {
      return { success: false, message: 'ไม่พบรายการจอง' };
    }

    // Notice rule: Must cancel at least 1 day in advance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);

    const diffDays = (bookingDate - today) / (1000 * 60 * 60 * 24);
    if (diffDays < 1) {
      return { success: false, message: 'การยกเลิกต้องทำล่วงหน้าอย่างน้อย 1 วัน' };
    }

    this.store.cancelBooking(bookingId);
    return { success: true, message: 'ยกเลิกการจองและคืนชั่วโมงเรียบร้อยแล้ว' };
  }

  // Check low hours alert for a child (Requirement 6)
  checkChildLowHours(child) {
    const remaining = child.totalHours - child.usedHours;
    if (remaining <= 2 && remaining > 0) {
      return { isLow: true, level: 'warning', message: `⚠️ ชั่วโมงเรียนคงเหลือใกล้หมด! เหลือเพียง ${remaining} ชั่วโมง` };
    } else if (remaining <= 0) {
      return { isLow: true, level: 'danger', message: `❌ ชั่วโมงเรียนคงเหลือหมดแล้ว กรุณาติดต่อแอดมินเพื่อต่อคลาส` };
    }
    return { isLow: false };
  }
}

window.orcaBooking = new BookingEngine();
