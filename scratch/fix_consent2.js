const fs = require('fs');

// 1. Fix saveUser in lib/supabase.ts
let supabaseTs = fs.readFileSync('lib/supabase.ts', 'utf8');

// I'll manually replace the exact block
const oldSaveUser = `  async saveUser(user: UserProfile) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').upsert([user]);
      } catch (err) {}
    }`;

const newSaveUser = `  async saveUser(user: UserProfile) {
    const dbUser = { ...user };
    delete dbUser.payment_history;
    
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').upsert([dbUser]);
        if (error) console.error('Supabase save error:', error);
      } catch (err) {
        console.error('Supabase save catch:', err);
      }
    }`;

if (supabaseTs.includes(oldSaveUser)) {
  supabaseTs = supabaseTs.replace(oldSaveUser, newSaveUser);
  fs.writeFileSync('lib/supabase.ts', supabaseTs, 'utf8');
  console.log('Fixed supabase.ts');
} else {
  console.log('Could not find exact oldSaveUser block');
}

// 2. Fix UI refresh in components/ServiceTermsModal.tsx
let modalTsx = fs.readFileSync('components/ServiceTermsModal.tsx', 'utf8');
const oldToast = `showToast('ขอบคุณที่ยอมรับข้อตกลงและนโยบาย PDPA');
      }`;
const newToast = `showToast('ขอบคุณที่ยอมรับข้อตกลงและนโยบาย PDPA');
        window.location.reload();
      }`;

if (modalTsx.includes(oldToast)) {
  modalTsx = modalTsx.replace(oldToast, newToast);
  fs.writeFileSync('components/ServiceTermsModal.tsx', modalTsx, 'utf8');
  console.log('Fixed ServiceTermsModal.tsx');
} else {
  console.log('Could not find exact oldToast block');
}
