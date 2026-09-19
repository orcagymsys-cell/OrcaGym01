const fs = require('fs');
let text = fs.readFileSync('lib/supabase.ts', 'utf8');

text = text.replace(
  /async getUsers\(\): Promise<UserProfile\[\]> \{[\s\S]*?async saveUser/m,
  `async getUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          setLocal(STORAGE_KEYS.USERS, data);
          return data;
        }
      } catch (e) {}
    }
    initLocalSeed();
    return getLocal<UserProfile[]>(STORAGE_KEYS.USERS, []);
  },

  async saveUser`
);

text = text.replace(
  /async getChildren\(parentId\?: string\): Promise<Child\[\]> \{[\s\S]*?async getChildById/m,
  `async getChildren(parentId?: string): Promise<Child[]> {
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

  async getChildById`
);

text = text.replace(
  /async getBookings\(childId\?: string, date\?: string\): Promise<Booking\[\]> \{[\s\S]*?async saveBooking/m,
  `async getBookings(childId?: string, date?: string): Promise<Booking[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase.from('bookings').select('*').order('id');
        if (childId) query = query.eq('child_id', childId);
        if (date) query = query.eq('booking_date', date);
        const { data, error } = await query;
        if (!error && data) {
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

  async saveBooking`
);

fs.writeFileSync('lib/supabase.ts', text, 'utf8');
console.log('Fixed sync issues');
