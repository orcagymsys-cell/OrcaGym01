/**
 * Orca Gymnastics Data Store & Persistence Layer
 * Controls initial seed state and LocalStorage CRUD operations
 */

const STORAGE_KEYS = {
  USERS: 'orca_users',
  CHILDREN: 'orca_children',
  BOOKINGS: 'orca_bookings',
  AUDIT_LOGS: 'orca_audit_logs',
  QUOTAS: 'orca_quotas',
  CURRENT_USER: 'orca_current_user'
};

const DEFAULT_QUOTA_PER_SLOT = 10;

// SVG Avatars Data URLs / SVGs for Boy and Girl
const AVATARS = {
  girl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23bae6fd"/><path d="M50 22c-14 0-25 10-25 24 0 7 3 13 8 17v12h34V63c5-4 8-10 8-17 0-14-11-24-25-24z" fill="%23b91c1c"/><circle cx="50" cy="45" r="16" fill="%23fde047"/><circle cx="43" cy="42" r="2" fill="%230f172a"/><circle cx="57" cy="42" r="2" fill="%230f172a"/><path d="M46 50 Q50 54 54 50" stroke="%23e11d48" stroke-width="2" fill="none"/><path d="M25 35c0 0 10-8 25-8s25 8 25 8-5 12-25 12S25 35 25 35z" fill="%23991b1b"/></svg>`,
  boy: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%23ddd6fe"/><path d="M50 20c-15 0-26 8-26 22 0 8 5 14 10 18v15h32V60c5-4 10-10 10-18 0-14-11-22-26-22z" fill="%234338ca"/><circle cx="50" cy="46" r="16" fill="%23fed7aa"/><circle cx="43" cy="43" r="2" fill="%230f172a"/><circle cx="57" cy="43" r="2" fill="%230f172a"/><path d="M46 51 Q50 55 54 51" stroke="%23c2410c" stroke-width="2" fill="none"/><path d="M30 30c0 0 8-12 20-12s20 12 20 12-6-4-20-4-20 4-20 4z" fill="%233730a3"/></svg>`,
  logo: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="90" fill="none" stroke="%23003366" stroke-width="8"/><path d="M40 120 C 60 70, 140 60, 170 95 C 130 90, 90 120, 60 145 Z" fill="%23003366"/><circle cx="145" cy="85" r="4" fill="white"/></svg>`
};

class Store {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      const initialUsers = [
        {
          id: 'u_admin',
          username: 'admin',
          password: '123',
          role: 'admin',
          name: 'แอดมิน Orca',
          phone: '02-000-0000'
        },
        {
          id: 'u_parent1',
          username: 'parent',
          password: '123',
          role: 'parent',
          name: 'สบายตา สบายใจ',
          phone: '081-234-5678',
          termsAccepted: true
        }
      ];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(initialUsers));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CHILDREN)) {
      const initialChildren = [
        {
          id: 'c_1',
          parentId: 'u_parent1',
          fullName: 'สบายตา สบายใจ',
          nickname: 'น้องเย็นสบาย',
          dob: '2020-05-05',
          gender: 'Girl',
          avatar: 'girl',
          status: 'approved', // approved, pending
          courseName: 'Orca Cubs',
          totalHours: 12,
          usedHours: 2,
          expiryDate: '2026-12-31'
        },
        {
          id: 'c_2',
          parentId: 'u_parent1',
          fullName: 'ยิ้มง่าย สบายใจ',
          nickname: 'น้องยิ้มสบาย',
          dob: '2021-08-15',
          gender: 'Boy',
          avatar: 'boy',
          status: 'approved',
          courseName: 'Mega Orca',
          totalHours: 24,
          usedHours: 1,
          expiryDate: '2027-01-15'
        },
        {
          id: 'c_3',
          parentId: 'u_parent1',
          fullName: 'สดใส สบายใจ',
          nickname: 'น้องสดใส',
          dob: '2019-10-10',
          gender: 'Girl',
          avatar: 'girl',
          status: 'approved',
          courseName: 'Orca Cubs',
          totalHours: 6,
          usedHours: 5, // 1 hour remaining -> Low Hours Alert!
          expiryDate: '2026-08-15'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(initialChildren));
    }

    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      const todayStr = new Date().toISOString().split('T')[0];
      const initialBookings = [
        {
          id: 'b_1',
          childId: 'c_1',
          childNickname: 'น้องเย็นสบาย',
          date: '2026-07-30',
          timeSlot: '10:00-12:00',
          courseName: 'Orca Cubs',
          status: 'confirmed',
          createdAt: new Date().toISOString()
        },
        {
          id: 'b_2',
          childId: 'c_1',
          childNickname: 'น้องเย็นสบาย',
          date: '2026-05-12',
          timeSlot: '10:00-12:00',
          courseName: 'Orca Cubs',
          status: 'completed',
          createdAt: '2026-05-12T10:00:00.000Z'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(initialBookings));
    }

    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      const todayStr = new Date().toISOString().split('T')[0];
      const initialAuditLogs = [
        {
          id: 'log_1',
          adminId: 'u_admin',
          adminName: 'แอดมิน Orca',
          childId: 'c_1',
          childName: 'น้องเย็นสบาย (สบายตา สบายใจ)',
          hoursAdded: 12,
          courseName: 'Orca Cubs',
          date: todayStr,
          timestamp: new Date().toISOString(),
          note: 'ชำระเงินแพ็กเกจ 12 ครั้ง เรียบร้อย'
        },
        {
          id: 'log_2',
          adminId: 'u_admin',
          adminName: 'แอดมิน Orca',
          childId: 'c_2',
          childName: 'น้องยิ้มสบาย (ยิ้มง่าย สบายใจ)',
          hoursAdded: 24,
          courseName: 'Mega Orca',
          date: todayStr,
          timestamp: new Date().toISOString(),
          note: 'ชำระเงินแพ็กเกจ 24 ครั้ง'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialAuditLogs));
    }

    if (!localStorage.getItem(STORAGE_KEYS.QUOTAS)) {
      localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify({ defaultQuota: DEFAULT_QUOTA_PER_SLOT, slotOverrides: {} }));
    }
  }

  // --- Users ---
  getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  }

  saveUser(user) {
    const users = this.getUsers();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
  }

  setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // --- Children ---
  getChildren() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CHILDREN) || '[]');
  }

  getChildrenByParent(parentId) {
    return this.getChildren().filter(c => c.parentId === parentId);
  }

  getChildById(id) {
    return this.getChildren().find(c => c.id === id);
  }

  saveChild(child) {
    const children = this.getChildren();
    const idx = children.findIndex(c => c.id === child.id);
    if (idx >= 0) {
      children[idx] = child;
    } else {
      children.push(child);
    }
    localStorage.setItem(STORAGE_KEYS.CHILDREN, JSON.stringify(children));
  }

  // --- Bookings ---
  getBookings() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKINGS) || '[]');
  }

  getBookingsByChild(childId) {
    return this.getBookings().filter(b => b.childId === childId && b.status !== 'cancelled');
  }

  getBookingsByDate(dateStr) {
    return this.getBookings().filter(b => b.date === dateStr && b.status !== 'cancelled');
  }

  saveBooking(booking) {
    const bookings = this.getBookings();
    bookings.push(booking);
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }

  cancelBooking(bookingId) {
    const bookings = this.getBookings();
    const b = bookings.find(x => x.id === bookingId);
    if (b) {
      b.status = 'cancelled';
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));

      // Refund 1 hour back to student
      const child = this.getChildById(b.childId);
      if (child && child.usedHours > 0) {
        child.usedHours -= 1;
        this.saveChild(child);
      }
    }
  }

  // --- Audit Logs ---
  getAuditLogs() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
  }

  addAuditLog(logEntry) {
    const logs = this.getAuditLogs();
    logs.unshift(logEntry); // Most recent first
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  }

  // --- Quotas ---
  getQuotaConfig() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.QUOTAS) || '{"defaultQuota":10,"slotOverrides":{}}');
  }

  setQuotaOverride(dateStr, timeSlot, capacity) {
    const config = this.getQuotaConfig();
    const key = `${dateStr}_${timeSlot}`;
    config.slotOverrides[key] = parseInt(capacity, 10);
    localStorage.setItem(STORAGE_KEYS.QUOTAS, JSON.stringify(config));
  }

  getSlotMaxCapacity(dateStr, timeSlot) {
    const config = this.getQuotaConfig();
    const key = `${dateStr}_${timeSlot}`;
    if (config.slotOverrides[key] !== undefined) {
      return config.slotOverrides[key];
    }
    return config.defaultQuota || DEFAULT_QUOTA_PER_SLOT;
  }
}

window.orcaStore = new Store();
window.AVATARS = AVATARS;
