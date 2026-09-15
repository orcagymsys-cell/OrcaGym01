import { createClient } from '@supabase/supabase-js';
import { UserProfile, Child, Booking, AuditLog, SlotQuota, CourseConfig } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        fetch: (url, options) => {
          // 3-second timeout to prevent UI freezing on bad DNS
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          return fetch(url, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(timeoutId));
        }
      }
    })
  : null;

// --- Local Data Store Fallback Engine ---
const STORAGE_KEYS = {
  USERS: 'orca_users_v3',
  CHILDREN: 'orca_children_v3',
  BOOKINGS: 'orca_bookings_v3',
  AUDIT_LOGS: 'orca_audit_logs_v3',
  QUOTAS: 'orca_quotas_v3',
  CURRENT_USER: 'orca_current_user_v3',
  SEED_INITIALIZED: 'orca_seed_init_v3',
  COURSES: 'orca_courses_v4',
};

function getLocal<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

const syncChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window 
  ? new BroadcastChannel('orca_store_channel') 
  : null;

function setLocal(key: string, value: any) {
  if (typeof window === 'undefined') return;
  try {
    const newVal = JSON.stringify(value);
    const oldVal = localStorage.getItem(key);
    
    // Prevents infinite SWR background fetch re-render loops
    if (newVal === oldVal) return;
    
    localStorage.setItem(key, newVal);
    window.dispatchEvent(new CustomEvent('orca_store_updated', { detail: { key, value } }));
    if (syncChannel) {
      try {
        syncChannel.postMessage({ key, value });
      } catch (err) {}
    }
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// Initial Local Seed Data
export function initLocalSeed() {
  if (typeof window === 'undefined') return;

  // SAFETY: Clear massive Base64 images from localStorage to prevent QuotaExceededError
  try {
    const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    if (rawUsers) {
      let users = JSON.parse(rawUsers);
      let modified = false;
      users = users.map((u: any) => {
        if (u.payment_slip && u.payment_slip.length > 50000) {
          u.payment_slip = undefined;
          modified = true;
        }
        if (u.payment_history) {
          u.payment_history = u.payment_history.map((h: any) => {
            if (h.payment_slip && h.payment_slip.length > 50000) {
              h.payment_slip = undefined;
              modified = true;
            }
            return h;
          });
        }
        return u;
      });
      if (modified) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }
    }
  } catch (e) {
    console.error('Failed to cleanup large slips:', e);
  }

  const isInitialized = getLocal<boolean>(STORAGE_KEYS.SEED_INITIALIZED, false);
  if (isInitialized) return;

  // Always ensure default COURSES data is seeded if empty
  const existingCourses = getLocal<CourseConfig[]>(STORAGE_KEYS.COURSES, []);
  if (existingCourses.length === 0) {
    const seedCourses: CourseConfig[] = [
      {
        id: 'c_cubs',
        internal_name: 'Orca Cubs01',
        display_title: 'Orca Cubs',
        subtitle: 'Class',
        age_range: 'Age 4-10',
        duration_text: '1.5 hrs/time',
        theme_color: 'Blue (Cubs)',
        max_capacity: 10,
          description: 'เปิดประตูสู่การเรียนรู้กับคลาส ORCA Cubs (สำหรับน้องๆ อายุ 6-10 ปี) คลาสเรียนพื้นฐานเบื้องต้นสำหรับเด็กๆ ที่ดีไซน์มาเพื่อเสริมสร้างทักษะทางร่างกายและการเคลื่อนไหวอย่างถูกวิธี สนุกสนาน สมวัย ปูพื้นฐานแน่นเพื่อให้พร้อมต่อยอดในระดับที่สูงขึ้นได้อย่างมั่นใจ',
        pricing_options: [
          { id: 'p1', times: 1, fee: '700 THB', duration: '-', tag: '' },
          { id: 'p2', times: 6, fee: '4,100 THB (683)', duration: '2 Months', tag: '' },
          { id: 'p3', times: 12, fee: '7,800 THB (650)', duration: '4 Months', tag: '' },
          { id: 'p4', times: 24, fee: '14,400 THB (600)', duration: '6 Months', tag: 'free 2' }
        ]
      },
      {
        id: 'c_mega',
        internal_name: 'Mega Orca01',
        display_title: 'Mega Orca',
        subtitle: 'Class',
        age_range: 'Age 5-15',
        duration_text: '2 hrs/time',
        theme_color: 'Indigo (Mega)',
        max_capacity: 10,
          description: 'ต่อยอดทักษะสู่ความเป็นเลิศกับคลาส Mega ORCA (สำหรับเด็กอายุ 7-15 ปี) เหมาะสำหรับผู้ที่มีพื้นฐานยิมนาสติกมาแล้ว หรือต้องการพัฒนาทักษะแบบก้าวกระโดด เน้นความแข็งแรง ความยืดหยุ่นขั้นสูง และความอดทน พร้อมปูทางสู่การแข่งขันในอนาคต',
        pricing_options: [
          { id: 'p1', times: 1, fee: '800 THB', duration: '-', tag: '' },
          { id: 'p2', times: 6, fee: '4,300 THB (716)', duration: '2 Months', tag: '' },
          { id: 'p3', times: 12, fee: '8,400 THB (700)', duration: '4 Months', tag: '' },
          { id: 'p4', times: 24, fee: '15,600 THB (650)', duration: '6 Months', tag: 'free 2' }
        ]
      }
    ];
    setLocal(STORAGE_KEYS.COURSES, seedCourses);
  }

  const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    setLocal(STORAGE_KEYS.USERS, [
      { id: 'u_admin', user_id: 'admin', name: 'เนเธญเธ”เธกเธดเธ Orca', phone: '0800000000', email: 'admin@orcagym.com', password: '123', role: 'admin' }
    ]);
  }

  const existingChildren = getLocal<Child[]>(STORAGE_KEYS.CHILDREN, []);
  if (existingChildren.length === 0) {
    setLocal(STORAGE_KEYS.CHILDREN, []);
  }

  setLocal(STORAGE_KEYS.SEED_INITIALIZED, true);
}

// Data Store Helpers (Works with Supabase or Local Fallback)
export const store = {
  getCurrentUser(): UserProfile | null {
    return getLocal<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(user: UserProfile | null) {
    setLocal(STORAGE_KEYS.CURRENT_USER, user);
    if (user) {
      const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
      const idx = users.findIndex(u => u.id === user.id || u.user_id === user.user_id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...user };
      } else {
        users.push(user);
      }
      setLocal(STORAGE_KEYS.USERS, users);
    }
  },

  async getUsers(): Promise<UserProfile[]> {
    initLocalSeed();
    let localUsers = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
    // Ensure admin exists
    // Fix any corrupted names stored in localStorage from the previous bug, AND completely purge the old mock u_napaporn!
    let modified = false;
    
    // No more napaporn purge needed

    // 2. Fix admin name if needed
    localUsers.forEach(u => {
      if (u.name && u.name.includes('เน€เธโฌ')) {
        if (u.user_id === 'admin') u.name = 'เนเธญเธ”เธกเธดเธ Orca';
        modified = true;
      }
    });
    
    if (modified) setLocal(STORAGE_KEYS.USERS, localUsers);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
        if (data && data.length > 0) {
          // Combine all users
          const allList = [...localUsers, ...data];
          
          // Sort by created_at ascending, so newest is added last and overwrites older in Map
          allList.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
          
          const userMap = new Map<string, UserProfile>();
          allList.forEach(u => {
            const key = u.user_id || u.id;
            const existing = userMap.get(key);
            if (existing) {
              // Preserve local-only fields if they are missing in Supabase data
              if (!u.payment_history && existing.payment_history) {
                u.payment_history = existing.payment_history;
              }
              if (!u.payment_slip && existing.payment_slip) {
                u.payment_slip = existing.payment_slip;
              }
            }
            userMap.set(key, u);
          });
          
          const merged = Array.from(userMap.values());
          // Final sort descending for UI lists
          merged.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          return merged;
        }
      } catch (err) {}
    }
    return localUsers;
  },

  async saveUser(user: UserProfile) {
    const localUser = JSON.parse(JSON.stringify(user));
    if (localUser.payment_slip && localUser.payment_slip.length > 50000) localUser.payment_slip = undefined;
    if (localUser.payment_history) {
      localUser.payment_history = localUser.payment_history.map((h: any) => {
        if (h.payment_slip && h.payment_slip.length > 50000) h.payment_slip = undefined;
        return h;
      });
    }
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === localUser.id || u.user_id === localUser.user_id);
    if (idx !== -1) users[idx] = localUser;
    else users.push(localUser);
    setLocal(STORAGE_KEYS.USERS, users);

    if (isSupabaseConfigured && supabase) {
      const dbUser = { ...user };
      // delete (dbUser as any).payment_history;
      const { error } = await supabase.from('profiles').upsert([dbUser]);
      if (error) console.error('Failed to save profile', error);
    }
  },

  async updateUser(id: string, updates: Partial<UserProfile>): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').update(updates).eq('id', id);
      } catch (err) {}
    }
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
    const idx = users.findIndex(u => u.id === id || u.user_id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updates };
      setLocal(STORAGE_KEYS.USERS, users);
      
      // Keep current user session in sync
      const current = this.getCurrentUser();
      if (current && (current.id === id || current.user_id === id)) {
        this.setCurrentUser(users[idx]);
      }
    }
  },

  async deleteUser(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
      } catch (err) {}
    }
    let users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
    users = users.filter(u => u.id !== id && u.user_id !== id);
    setLocal(STORAGE_KEYS.USERS, users);

    const currentUser = getLocal<UserProfile | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (currentUser && (currentUser.id === id || currentUser.user_id === id)) {
      setLocal(STORAGE_KEYS.CURRENT_USER, null);
    }
  },

  
  async uploadAvatar(file: File, prefix: string): Promise<string | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${prefix}_${Date.now()}.${ext}`;
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });
          
        if (error) {
          console.error('Upload error:', error);
          return null;
        }
        
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        return publicUrl;
      } catch (err) {
        console.error('Avatar upload caught error:', err);
        return null;
      }
    }
    return null;
  },

  async getChildren(parentId?: string): Promise<Child[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('children').select('*').order('id');
        if (parentId) query = query.eq('parent_id', parentId);
        const { data, error } = await query;
        if (!error && data) {
          setLocal('CHILDREN_CACHE', data);
          return data;
        }
      } catch (e) {}
    }
    const cached = getLocal<Child[]>('CHILDREN_CACHE', []);
    if (parentId && cached.length > 0) return cached.filter(c => c.parent_id === parentId);
    return cached;
  },

  async getChildById(id: string): Promise<Child | null> {
    const children = await this.getChildren();
    return children.find(c => c.id === id) || null;
  },

  async saveChild(child: Child): Promise<Child> {
    if (!isSupabaseConfigured || !supabase) return child;
    const childForDB = { ...child };
    const { error } = await supabase.from('children').upsert([childForDB]);
    if (error) throw new Error(error.message);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("orca_store_updated"));
    return child;
  },

  async updateChild(id: string, updates: Partial<Child>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('children').update(updates).eq('id', id);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("orca_store_updated"));
  },

  async deleteChild(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('children').delete().eq('id', id);
    await supabase.from('bookings').delete().eq('child_id', id);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("orca_store_updated"));
  },

  async getBookings(childId?: string, date?: string): Promise<Booking[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('bookings').select('*').order('id');
        if (childId) query = query.eq('child_id', childId);
        if (date) query = query.eq('booking_date', date);
        const { data, error } = await query;
        if (!error && data) {
          // fetch children for names
          const children = await this.getChildren();
          const childrenMap = new Map<string, any>(children.map(c => [c.id, c]));
          const mapped = data.map(b => {
            const c = childrenMap.get(b.child_id);
            return {
              ...b,
              child_nickname: c?.nickname,
              child_full_name: c?.full_name,
              course_name: c?.course_name || 'Orca Cubs'
            };
          });
          if (!childId && !date) setLocal('BOOKINGS_CACHE', mapped);
          return mapped;
        }
      } catch(e) {}
    }
    let cached = getLocal<Booking[]>('BOOKINGS_CACHE', []);
    if (childId) cached = cached.filter(b => b.child_id === childId);
    if (date) cached = cached.filter(b => b.booking_date === date);
    return cached;
  },

  async saveBooking(booking: Booking): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    const dbBooking = {
      id: booking.id,
      child_id: booking.child_id,
      booking_date: booking.booking_date,
      time_slot: booking.time_slot,
      status: booking.status,
      created_at: booking.created_at || new Date().toISOString()
    };
    await supabase.from('bookings').upsert([dbBooking]);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("orca_store_updated"));
  },

  async cancelBooking(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    await supabase.from('bookings').delete().eq('id', id);
    if (typeof window !== "undefined") window.dispatchEvent(new Event("orca_store_updated"));
  },

  async clearAuditLogs(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('audit_logs').delete().neq('id', '');
      } catch (err) {}
    }
    setLocal(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  async resetAuditLogsToCurrent(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('audit_logs').delete().neq('id', '');
      } catch (err) {}
    }
    const users = getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
    const parents = users.filter(u => u.role === 'parent');
    const children = getLocal<Child[]>(STORAGE_KEYS.CHILDREN, []);

    const freshLogs: AuditLog[] = [];

    parents.forEach(p => {
      const pChildren = children.filter(c => c.parent_id === p.id || c.parent_id === p.user_id);
      const childNameStr = pChildren.length > 0
        ? pChildren.map(c => `${c.full_name} (${c.nickname})`).join(', ')
        : p.name;

      const pHistory = p.payment_history && p.payment_history.length > 0
        ? p.payment_history
        : (p.payment_amount || p.payment_ref_no || p.payment_datetime || p.payment_slip)
        ? [
            {
              id: 'pay_init_' + p.id,
              payment_amount: p.payment_amount,
              payment_ref_no: p.payment_ref_no,
              payment_payer_name: p.payment_payer_name,
              payment_bank: p.payment_bank,
              payment_datetime: p.payment_datetime,
              payment_slip: p.payment_slip,
              purchased_hours: p.purchased_hours || 6,
              created_at: p.payment_datetime || p.created_at || new Date().toISOString(),
            }
          ]
        : [];

      pHistory.forEach((pay, idx) => {
        freshLogs.push({
          id: `audit_curr_${p.id}_${idx}`,
          action_type: idx === 0 ? 'create_parent' : 'topup_hours',
          admin_name: 'เน€เธโฌเน€เธยเนยเธเน€เธโฌเน€เธยเธขยเน€เธเธเธขยเน€เธโฌเน€เธยเนยเธเน€เธโฌเน€เธยเธขยเน€เธโฌเน€เธยเธขยเน€เธโฌเน€เธยเนยเธเน€เธโฌเน€เธยเธขยเน€เธยเนยเธเธขยเน€เธโฌเน€เธยเนยเธเน€เธโฌเน€เธยเธขยเน€เธโฌเน€เธยเธขยเน€เธโฌเน€เธยเนยเธเน€เธโฌเน€เธยเธขยเน€เธโฌเน€เธยเนโฌยเน€เธโฌเน€เธยเนยเธเน€เธโฌเน€เธยเธขยเน€เธเธเธขย Orca',
          parent_name: p.name,
          child_id: pChildren[0]?.id || p.id,
          child_name: childNameStr,
          hours_added: pay.purchased_hours || p.purchased_hours || 6,
          course_name: 'Orca Cubs',
          amount: pay.payment_amount ? Number(pay.payment_amount) : 4100,
          slip_ref: pay.payment_ref_no || '20264587123654',
          slip_url: pay.payment_slip || p.payment_slip,
          bank_name: pay.payment_bank || p.payment_bank || '๏ฟฝ๏ฟฝาค๏ฟฝรก๏ฟฝิก๏ฟฝ๏ฟฝ๏ฟฝ (KBank)',
          payer_name: pay.payment_payer_name || p.payment_payer_name || p.name,
          note: idx === 0 ? '๏ฟฝ๏ฟฝ๏ฟฝาง๏ฟฝัญ๏ฟฝีผ๏ฟฝ้ปก๏ฟฝ๏ฟฝอง๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝ' : '๏ฟฝ๏ฟฝ๏ฟฝ๏ฟฝวต๏ฟฝ๏ฟฝ',
          created_at: pay.payment_datetime || pay.created_at || new Date().toISOString()
        });
      });
    });

    setLocal(STORAGE_KEYS.AUDIT_LOGS, freshLogs);
    if (isSupabaseConfigured && supabase && freshLogs.length > 0) {
      try {
        await supabase.from('audit_logs').insert(freshLogs);
      } catch (err) {}
    }
    return freshLogs;
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('audit_logs').select('*').order('id').order('created_at', { ascending: false });
      if (data) {
        setLocal(STORAGE_KEYS.AUDIT_LOGS, data);
        return data;
      }
    }
    initLocalSeed();
    return getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  },

  async saveAuditLog(log: AuditLog): Promise<void> {
    if (!log.created_at) {
      log.created_at = new Date().toISOString();
    }
    if (isSupabaseConfigured && supabase) {
      await supabase.from('audit_logs').insert([log]);
    }
    const logs = getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    logs.unshift(log);
    setLocal(STORAGE_KEYS.AUDIT_LOGS, logs);
  },

  async getSlotQuotas(): Promise<Record<string, number>> {
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('slot_quotas').select('*');
      if (data) {
        const res: Record<string, number> = {};
        data.forEach(q => {
          res[`${q.booking_date}_${q.time_slot}`] = q.quota;
          if (q.course_name) {
            res[`${q.booking_date}_${q.course_name}_${q.time_slot}`] = q.quota;
          }
        });
        return res;
      }
    }
    return getLocal<Record<string, number>>(STORAGE_KEYS.QUOTAS, {});
  },

  async saveSlotQuota(date: string, timeSlot: string, quota: number, courseName?: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('slot_quotas').upsert([{ booking_date: date, time_slot: timeSlot, quota, course_name: courseName }]);
    }
    const quotas = getLocal<Record<string, number>>(STORAGE_KEYS.QUOTAS, {});
    quotas[`${date}_${timeSlot}`] = quota;
    if (courseName && courseName !== 'All Courses') {
      quotas[`${date}_${courseName}_${timeSlot}`] = quota;
      quotas[`${courseName}_${timeSlot}`] = quota;
    } else {
      quotas[`${date}_Orca Cubs_${timeSlot}`] = quota;
      quotas[`${date}_Mega Orca_${timeSlot}`] = quota;
      quotas[`${date}_${timeSlot}`] = quota;
    }
    setLocal(STORAGE_KEYS.QUOTAS, quotas);
  },

  async getCourses(): Promise<CourseConfig[]> {
    initLocalSeed();
    let courses = getLocal<CourseConfig[]>(STORAGE_KEYS.COURSES, []);
    
    // Auto-fix corrupted courses
    let modified = false;
    courses.forEach(c => {
      if (c.description && c.description.includes('เน€เธ™โ‚ฌ')) {
        if (c.id === 'c_cubs') c.description = 'เปิดประตูสู่การเรียนรู้กับคลาส ORCA Cubs (สำหรับน้องๆ อายุ 6-10 ปี) คลาสเรียนพื้นฐานเบื้องต้นสำหรับเด็กๆ ที่ดีไซน์มาเพื่อเสริมสร้างทักษะทางร่างกายและการเคลื่อนไหวอย่างถูกวิธี สนุกสนาน สมวัย ปูพื้นฐานแน่นเพื่อให้พร้อมต่อยอดในระดับที่สูงขึ้นได้อย่างมั่นใจ';
        if (c.id === 'c_mega') c.description = 'ต่อยอดทักษะสู่ความเป็นเลิศกับคลาส Mega ORCA (สำหรับเด็กอายุ 7-15 ปี) เหมาะสำหรับผู้ที่มีพื้นฐานยิมนาสติกมาแล้ว หรือต้องการพัฒนาทักษะแบบก้าวกระโดด เน้นความแข็งแรง ความยืดหยุ่นขั้นสูง และความอดทน พร้อมปูทางสู่การแข่งขันในอนาคต';
        modified = true;
      }
    });
    if (modified) setLocal(STORAGE_KEYS.COURSES, courses);

    // Fetch from Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('course_configs').select('*');
        if (!error && data && data.length > 0) {
          setLocal(STORAGE_KEYS.COURSES, data);
          return data as CourseConfig[];
        } else if (!error && data && data.length === 0) {
          if (courses && courses.length > 0) {
            await supabase.from('course_configs').upsert(courses);
          }
        }
      } catch (e) {}
    }

    if (!courses || courses.length === 0) {
      courses = [
        {
          id: 'c_cubs',
          internal_name: 'Orca Cubs01',
          display_title: 'Orca Cubs',
          subtitle: 'Class',
          age_range: 'Age 4-10',
          duration_text: '1.5 hrs/time',
          theme_color: 'Blue (Cubs)',
          max_capacity: 10,
          description: 'เปิดประตูสู่การเรียนรู้กับคลาส ORCA Cubs (สำหรับน้องๆ อายุ 6-10 ปี) คลาสเรียนพื้นฐานเบื้องต้นสำหรับเด็กๆ ที่ดีไซน์มาเพื่อเสริมสร้างทักษะทางร่างกายและการเคลื่อนไหวอย่างถูกวิธี สนุกสนาน สมวัย ปูพื้นฐานแน่นเพื่อให้พร้อมต่อยอดในระดับที่สูงขึ้นได้อย่างมั่นใจ',
          pricing_options: [
            { id: 'p1', times: 1, fee: '700 THB', duration: '-', tag: '' },
            { id: 'p2', times: 6, fee: '4,100 THB (683)', duration: '2 Months', tag: '' },
            { id: 'p3', times: 12, fee: '7,800 THB (650)', duration: '4 Months', tag: '' },
            { id: 'p4', times: 24, fee: '14,400 THB (600)', duration: '6 Months', tag: 'free 2' }
          ]
        },
        {
          id: 'c_mega',
          internal_name: 'Mega Orca01',
          display_title: 'Mega Orca',
          subtitle: 'Class',
          age_range: 'Age 7-15',
          duration_text: '2.0 hrs/time',
          theme_color: 'Indigo (Mega)',
          max_capacity: 15,
          description: 'ต่อยอดทักษะสู่ความเป็นเลิศกับคลาส Mega ORCA (สำหรับเด็กอายุ 7-15 ปี) เหมาะสำหรับผู้ที่มีพื้นฐานยิมนาสติกมาแล้ว หรือต้องการพัฒนาทักษะแบบก้าวกระโดด เน้นความแข็งแรง ความยืดหยุ่นขั้นสูง และความอดทน พร้อมปูทางสู่การแข่งขันในอนาคต',
          pricing_options: [
            { id: 'p1', times: 1, fee: '800 THB', duration: '-', tag: '' },
            { id: 'p2', times: 6, fee: '4,300 THB (716)', duration: '2 Months', tag: '' },
            { id: 'p3', times: 12, fee: '8,400 THB (700)', duration: '4 Months', tag: '' },
            { id: 'p4', times: 24, fee: '15,600 THB (650)', duration: '6 Months', tag: 'free 2' }
          ]
        }
      ];
      setLocal(STORAGE_KEYS.COURSES, courses);
    }
    return courses;
  },
  async saveCourse(course: CourseConfig): Promise<void> {
    const courses = getLocal<CourseConfig[]>(STORAGE_KEYS.COURSES, []);
    const idx = courses.findIndex(c => c.id === course.id);
    if (idx !== -1) {
      courses[idx] = course;
    } else {
      courses.push(course);
    }
    setLocal(STORAGE_KEYS.COURSES, courses);
  },

  async updateCourse(id: string, updates: Partial<CourseConfig>): Promise<void> {
    const courses = getLocal<CourseConfig[]>(STORAGE_KEYS.COURSES, []);
    const idx = courses.findIndex(c => c.id === id);
    if (idx !== -1) {
      courses[idx] = { ...courses[idx], ...updates };
      setLocal(STORAGE_KEYS.COURSES, courses);
    }
  },

  async deleteCourse(id: string): Promise<void> {
    let courses = getLocal<CourseConfig[]>(STORAGE_KEYS.COURSES, []);
    courses = courses.filter(c => c.id !== id);
    setLocal(STORAGE_KEYS.COURSES, courses);
  }
};
