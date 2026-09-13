const fs = require('fs');
let code = fs.readFileSync('lib/supabase.ts', 'utf8');

// Update saveUser
code = code.replace(
  /async saveUser\(user: UserProfile\) \{[\s\S]*?if \(isSupabaseConfigured && supabase\) \{[\s\S]*?try \{[\s\S]*?const dbUser = \{ \.\.\.user \}; delete \(dbUser as any\)\.payment_history; await \n?supabase\.from\('profiles'\)\.upsert\(\[dbUser\]\);[\s\S]*?\} catch \(err\) \{\}[\s\S]*?\}/,
  `async saveUser(user: UserProfile) {
    // 1. Save to Local Storage First
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

    // 2. Save to Supabase Async (Non-blocking)
    if (isSupabaseConfigured && supabase) {
      const dbUser = { ...user };
      delete (dbUser as any).payment_history;
      supabase.from('profiles').upsert([dbUser]).catch(() => {});
    }
    return;`
);

// We need to also clean up the duplicate local storage logic below the old replace if any exists.
// I'll just use a smarter replace.
