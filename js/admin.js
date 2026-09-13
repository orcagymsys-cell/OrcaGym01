/**
 * Orca Gymnastics Admin Controller
 * Student Approval, Hour Top-Up, Daily Audit Summary Log, & Quota Settings
 */

class AdminController {
  constructor() {
    this.store = window.orcaStore;
  }

  approveAndAddHours(childId, courseName, totalHours, note = '') {
    const currentUser = this.store.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, message: 'สิทธิ์ไม่ถูกต้อง เฉพาะแอดมินเท่านั้น' };
    }

    const child = this.store.getChildById(childId);
    if (!child) {
      return { success: false, message: 'ไม่พบข้อมูลเด็กนักเรียน' };
    }

    const addedHours = parseInt(totalHours, 10);
    const prevTotal = child.totalHours || 0;

    child.status = 'approved';
    child.courseName = courseName;
    child.totalHours = prevTotal + addedHours;
    
    // Calculate Expiry Date (default 6 months from now)
    const exp = new Date();
    exp.setMonth(exp.getMonth() + 6);
    child.expiryDate = exp.toISOString().split('T')[0];

    this.store.saveChild(child);

    // Create Audit Log Entry for Fraud Prevention (Requirement 8)
    const todayStr = new Date().toISOString().split('T')[0];
    const auditLog = {
      id: 'log_' + Date.now(),
      adminId: currentUser.id,
      adminName: currentUser.name || currentUser.username,
      childId: child.id,
      childName: `${child.nickname} (${child.fullName})`,
      hoursAdded: addedHours,
      courseName: courseName,
      date: todayStr,
      timestamp: new Date().toISOString(),
      note: note || `เติมชั่วโมงคลาส ${courseName} +${addedHours} ชม.`
    };

    this.store.addAuditLog(auditLog);

    return {
      success: true,
      message: `อนุมัติและเติมชั่วโมงให้ ${child.nickname} จำนวน +${addedHours} ชั่วโมงเรียบร้อยแล้ว`,
      child,
      auditLog
    };
  }

  // Get Daily Summary of Hours Added (Requirement 8)
  getDailyAuditSummary(dateStr) {
    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const logs = this.store.getAuditLogs().filter(l => l.date === targetDate);
    const totalHoursToday = logs.reduce((sum, item) => sum + (item.hoursAdded || 0), 0);

    return {
      date: targetDate,
      logs,
      totalHoursToday,
      totalTransactions: logs.length
    };
  }

  // Get list of children with low hours for Admin Notification (Requirement 7)
  getLowHoursAlertList() {
    const children = this.store.getChildren().filter(c => c.status === 'approved');
    return children.filter(c => {
      const remaining = c.totalHours - c.usedHours;
      return remaining <= 2;
    });
  }

  // Update Quota per Slot (Admin customization)
  updateSlotQuota(dateStr, timeSlot, newQuota) {
    if (newQuota < 1) {
      return { success: false, message: 'จำนวน Quota ต้องมากกว่า 0' };
    }
    this.store.setQuotaOverride(dateStr, timeSlot, newQuota);
    return { success: true, message: `อัปเดต Quota รอบ ${timeSlot} เป็น ${newQuota} ที่นั่งเรียบร้อยแล้ว` };
  }
}

window.orcaAdmin = new AdminController();
