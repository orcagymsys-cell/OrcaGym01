const fs = require('fs');
let code = fs.readFileSync('lib/supabase.ts', 'utf8');

const oldSaveUser = code.substring(code.indexOf('async saveUser(user: UserProfile) {'), code.indexOf('async updateUser('));
const newSaveUser = `async saveUser(user: UserProfile) {
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
      delete (dbUser as any).payment_history;
      supabase.from('profiles').upsert([dbUser]).catch(() => {});
    }
  },

  `;

const oldSaveChild = code.substring(code.indexOf('async saveChild(child: Child): Promise<Child> {'), code.indexOf('async updateChild('));
const newSaveChild = `async saveChild(child: Child): Promise<Child> {
    const cLocal = getLocal<Child[]>(STORAGE_KEYS.CHILDREN, []);
    const ei = cLocal.findIndex(c => c.id === child.id);
    if (ei !== -1) { cLocal[ei] = child; } else { cLocal.push(child); }
    setLocal(STORAGE_KEYS.CHILDREN, cLocal);

    if (isSupabaseConfigured && supabase) {
      const childForDB = { ...child };
      delete (childForDB as any).photo_url;
      supabase.from('children').upsert([childForDB]).catch(() => {});
    }
    
    return child;
  },

  `;

code = code.replace(oldSaveUser, newSaveUser);
code = code.replace(oldSaveChild, newSaveChild);
fs.writeFileSync('lib/supabase.ts', code, 'utf8');
console.log('Optimized store operations');
