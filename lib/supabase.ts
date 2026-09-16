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
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
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

function setLocal(key: string, val: any) {
  if (typeof window === 'undefined') return;
  const newVal = JSON.stringify(val);
  const oldVal = localStorage.getItem(key);
  
  // Prevents infinite SWR background fetch re-render loops
  if (newVal === oldVal) return;
  
  try {
    localStorage.setItem(key, newVal);
    window.dispatchEvent(new CustomEvent('orca_store_updated', { detail: { key, value: val } }));
    if (syncChannel) {
      try {
        syncChannel.postMessage({ key, value: val });
      } catch (err) {}
    }
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      // localStorage full — clear stale diagnostic and cache keys, then retry
      const staleKeys = [
        'CHILDREN_CACHE', 'BOOKINGS_CACHE', 'USERS_CACHE',
        'ORCA_KIDS_ERR', 'ORCA_KIDS_DATA_LEN', 'ORCA_KIDS_DUMP', 'ORCA_FILTER_DEBUG',
        'CHILDREN_ERROR'
      ];
      staleKeys.forEach(k => { try { localStorage.removeItem(k); } catch(_) {} });
      // Also clear any large base64 images stored in users
      try {
        const rawUsers = localStorage.getItem(STORAGE_KEYS.USERS);
        if (rawUsers) {
          const users = JSON.parse(rawUsers);
          const cleaned = users.map((u: any) => { const {payment_slip, ...rest} = u; return rest; });
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cleaned));
        }
      } catch(_) {}
      // Retry write
      try { localStorage.setItem(key, newVal); } catch(_) {}
    } else {
      console.error('LocalStorage write error:', e);
    }
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
  listeners: new Set<() => void>(),
  
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  },
  
  notify() {
    this.listeners.forEach(l => l());
  },
  
  getLocal<T>(key: string, fallback: T): T {
    return getLocal<T>(key, fallback);
  },

  setLocal(key: string, val: any) {
    setLocal(key, val);
  },

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

  getUsersSync(): UserProfile[] { return getLocal(STORAGE_KEYS.USERS, []); },
  getChildrenSync(): Child[] { 
    const myKids = getLocal<Child[]>('ORCA_MY_KIDS', []);
    if (myKids.length > 0) return myKids;
    return getLocal<Child[]>(STORAGE_KEYS.CHILDREN, []); 
  },
  getBookingsSync(): Booking[] { 
    const myBookings = getLocal<Booking[]>('ORCA_MY_BOOKINGS', []);
    if (myBookings.length > 0) return myBookings;
    return getLocal<Booking[]>(STORAGE_KEYS.BOOKINGS, []); 
  },
  getAuditLogsSync(): AuditLog[] { return getLocal(STORAGE_KEYS.AUDIT_LOGS, []); },
  getSlotQuotasSync(): Record<string, any> { return getLocal(STORAGE_KEYS.QUOTAS, {}); },

  async getUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('id,user_id,name,phone,email,role,payment_amount,payment_ref_no,payment_payer_name,payment_bank,payment_datetime,payment_slip,payment_history,purchased_hours,created_at,pdpa_accepted,media_consent,pdpa_accepted_at').order('created_at', { ascending: false });
        if (!error) {
          // Always use Supabase data (even empty array) and overwrite local cache
          // This handles deletions without causing flicker
          const freshData = data || [];
          setLocal(STORAGE_KEYS.USERS, freshData);
          return freshData;
        }
      } catch (e) {
        // Network error only: clear stale cache so ghost data doesn't appear
        if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEYS.USERS);
        return [];
      }
    }
    initLocalSeed();
    return getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
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
        const { data, error } = await supabase.from('children').select('id,parent_id,full_name,nickname,dob,gender,avatar,status,course_name,total_hours,used_hours,expiry_date,created_at').order('id');
        if (!error) {
          const freshData = data || [];
          setLocal(STORAGE_KEYS.CHILDREN, freshData);
          
          // Auto-update ORCA_MY_KIDS cache for parents so navigation is instantly fast
          if (typeof window !== 'undefined') {
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.role !== 'admin') {
              const resolvedUserId = (currentUser.id || currentUser.user_id)?.trim();
              if (resolvedUserId) {
                const myKids = freshData.filter(c => c.parent_id?.trim() === resolvedUserId);
                setLocal('ORCA_MY_KIDS', myKids);
              }
            }
          }
          
          return parentId ? freshData.filter(c => c.parent_id?.trim() === parentId?.trim()) : freshData;
        }
      } catch (e) {
        if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEYS.CHILDREN);
        return [];
      }
    }
    initLocalSeed();
    let children = getLocal<Child[]>(STORAGE_KEYS.CHILDREN, []);
    if (parentId) {
      children = children.filter(c => c.parent_id?.trim() === parentId?.trim());
    }
    return children;
  },

  async getChildById(id: string): Promise<Child | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('children').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch(e) {}
    }
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
        if (!error) {
          const freshData = data || [];
          const children = await this.getChildren();
          const childrenMap = new Map<string, any>(children.map(c => [c.id, c]));
          const mapped = freshData.map(b => {
            const c = childrenMap.get(b.child_id);
            return {
              ...b,
              child_nickname: c?.nickname,
              child_full_name: c?.full_name,
              course_name: c?.course_name || 'Orca Cubs'
            };
          });
          
          if (!childId && !date) setLocal(STORAGE_KEYS.BOOKINGS, mapped);
          
          // Auto-update ORCA_MY_BOOKINGS cache for parents
          if (typeof window !== 'undefined') {
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.role !== 'admin') {
               const resolvedUserId = (currentUser.id || currentUser.user_id)?.trim();
               if (resolvedUserId) {
                 // Get parent's children IDs to filter bookings
                 const myKidIds = new Set(children.filter(c => c.parent_id?.trim() === resolvedUserId).map(c => c.id));
                 const myBookings = mapped.filter(b => myKidIds.has(b.child_id));
                 setLocal('ORCA_MY_BOOKINGS', myBookings);
               }
            }
          }
          
          return mapped;
        }
      } catch (e) {
        if (typeof window !== 'undefined' && !childId && !date) localStorage.removeItem('BOOKINGS_CACHE');
        return [];
      }
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
          internal_name: 'Orca Cubs',
          display_title: 'ORCA CUBS',
          subtitle: 'FOUNDATION CLASS',
          age_range: 'AGE 6-10',
          duration_text: '1.5 HRS / TIME',
          theme_color: 'Blue (Cubs)',
          max_capacity: 10,
          description: 'เปิดประตูสู่การเรียนรู้กับคลาส ORCA Cubs (สำหรับน้องๆ อายุ 6-10 ปี) คลาสเรียนพื้นฐานเบื้องต้นสำหรับเด็กๆ ที่ดีไซน์มาเพื่อสร้างทักษะทางร่างกายและการเคลื่อนไหวอย่างถูกวิธี สนุกสนาน สมวัย ปูพื้นฐานแน่นเพื่อให้พร้อมต่อยอดในระดับที่สูงขึ้นได้อย่างมั่นใจ',
          pricing_options: [
            { id: 'p_free', times: 2, fee: '0 THB (ฟรี)', duration: '1 Month', tag: 'Free Trial' },
            { id: 'p_1', times: 1, fee: '700 THB', duration: '-', tag: '' },
            { id: 'p_6', times: 6, fee: '4,100 THB (683/time)', duration: '2 MONTHS', tag: '' },
            { id: 'p_12', times: 12, fee: '7,800 THB (650/time)', duration: '4 MONTHS', tag: '' },
            { id: 'p_24', times: 24, fee: '14,400 THB (600/time)', duration: '6 MONTHS', tag: 'FREE 2 TIMES' }
          ],
          schedule_groups: [
            { id: 'sg_tue_fri', day_label: 'Tuesday - Friday', time_slots: ['10:30-12:00', '14:30-16:00', '16:00-17:30'], highlight_tag: '', highlight_slot_no: null },
            { id: 'sg_tue_wed', day_label: 'Tuesday - Wednesday', time_slots: ['17:30-19:00'], highlight_tag: '', highlight_slot_no: null },
            { id: 'sg_sat_sun', day_label: 'Saturday - Sunday', time_slots: ['9:00-10:30', '10:30-12:00', '13:00-14:30', '14:30-16:00'], highlight_tag: '', highlight_slot_no: null }
          ]
        },
        {
          id: 'c_flip',
          internal_name: 'Orca Flip',
          display_title: 'ORCA FLIP',
          subtitle: 'TUMBLING CLASS',
          age_range: 'AGE 6-15+',
          duration_text: '1.5 HRS / TIME',
          theme_color: 'Amber (Flip)',
          max_capacity: 10,
          description: 'พัฒนาทักษะการตีลังกาอย่างเป็นระบบ ตั้งแต่พื้นฐานสู่ท่าที่ยากและสวยงาม คลาสที่เน้นการฝึกทักษะการตีลังกาโดยเฉพาะ เพิ่มความแข็งแรง ความยืดหยุ่น และความมั่นใจ เรียนสนุก ปลอดภัย เหมาะสำหรับทุกคนที่อยากพัฒนาทักษะการเคลื่อนไหวขั้นสูง',
          pricing_options: [
            { id: 'p_free', times: 2, fee: '0 THB (ฟรี)', duration: '1 Month', tag: 'Free Trial' },
            { id: 'p_1', times: 1, fee: '750 THB', duration: '-', tag: '' },
            { id: 'p_6', times: 6, fee: '4,200 THB (700/time)', duration: '2 MONTHS', tag: '' },
            { id: 'p_12', times: 12, fee: '8,100 THB (675/time)', duration: '4 MONTHS', tag: '' },
            { id: 'p_24', times: 24, fee: '15,000 THB (625/time)', duration: '6 MONTHS', tag: 'FREE 2 TIMES' }
          ],
          schedule_groups: [
            { id: 'sg_thu_fri', day_label: 'Thursday - Friday', time_slots: ['17:30-19:00'], highlight_tag: '', highlight_slot_no: null },
            { id: 'sg_sat_sun', day_label: 'Saturday - Sunday', time_slots: ['13:00-14:30'], highlight_tag: '', highlight_slot_no: null }
          ]
        },
        {
          id: 'c_mega',
          internal_name: 'Mega Orca',
          display_title: 'MEGA ORCA',
          subtitle: 'COMPETITIVE CLASS',
          age_range: 'AGE 5-15',
          duration_text: '2 HRS / TIME',
          theme_color: 'Purple (Mega)',
          max_capacity: 10,
          description: 'ก้าวสู่ความท้าทายขั้นกว่ากับคลาส MEGA Orca (สำหรับนักกีฬา เลเวล 1 ขึ้นไป) คลาสยกระดับทักษะสำหรับนักกีฬารุ่นเยาว์ เน้นการฝึกซ้อมที่เข้มข้น พัฒนาเทคนิคขั้นสูง เสริมสร้างสมรรถภาพทางร่างกายและความทนทาน เพื่อเตรียมความพร้อมสู่การแข่งขันอย่างเต็มศักยภาพ',
          pricing_options: [
            { id: 'p_free', times: 2, fee: '0 THB (ฟรี)', duration: '1 Month', tag: 'Free Trial' },
            { id: 'p_1', times: 1, fee: '800 THB', duration: '-', tag: '' },
            { id: 'p_6', times: 6, fee: '4,300 THB (716/time)', duration: '2 MONTHS', tag: '' },
            { id: 'p_12', times: 12, fee: '8,400 THB (700/time)', duration: '4 MONTHS', tag: '' },
            { id: 'p_24', times: 24, fee: '15,600 THB (650/time)', duration: '6 MONTHS', tag: 'FREE 2 TIMES' }
          ],
          schedule_groups: [
            { id: 'sg_tue_fri', day_label: 'Tuesday - Friday', time_slots: ['10:30-12:30', '17:30-19:30'], highlight_tag: '', highlight_slot_no: null },
            { id: 'sg_sat_sun', day_label: 'Saturday - Sunday', time_slots: ['14:30-16:30', '16:00-18:00'], highlight_tag: '', highlight_slot_no: null }
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
    if (isSupabaseConfigured && supabase) {
      await supabase.from('course_configs').upsert([course]);
    }
  },

  async updateCourse(id: string, updates: Partial<CourseConfig>): Promise<void> {
    const courses = getLocal<CourseConfig[]>(STORAGE_KEYS.COURSES, []);
    const idx = courses.findIndex(c => c.id === id);
    if (idx !== -1) {
      courses[idx] = { ...courses[idx], ...updates };
      setLocal(STORAGE_KEYS.COURSES, courses);
      if (isSupabaseConfigured && supabase) {
        await supabase.from('course_configs').update(updates).eq('id', id);
      }
    }
  },

  async deleteCourse(id: string): Promise<void> {
    let courses = getLocal<CourseConfig[]>(STORAGE_KEYS.COURSES, []);
    courses = courses.filter(c => c.id !== id);
    setLocal(STORAGE_KEYS.COURSES, courses);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('course_configs').delete().eq('id', id);
    }
  }
};

let realtimeChannel: any = null;
export function setupRealtimeSubscriptions(onUpdate: () => void) {
  if (!isSupabaseConfigured || !supabase || typeof window === 'undefined') return () => {};
  if (realtimeChannel) realtimeChannel.unsubscribe();
  realtimeChannel = supabase.channel('global-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'children' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, onUpdate)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, onUpdate)
    .subscribe();
  return () => {
    if (realtimeChannel) { realtimeChannel.unsubscribe(); realtimeChannel = null; }
  };
}
