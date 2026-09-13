const fs = require('fs');

// 1. Fix saveUser in lib/supabase.ts
let supabaseTs = fs.readFileSync('lib/supabase.ts', 'utf8');
supabaseTs = supabaseTs.replace(
  /async saveUser\(user: UserProfile\) \{([\s\S]*?)if \(isSupabaseConfigured && supabase\) \{([\s\S]*?)try \{([\s\S]*?)await supabase\.from\('profiles'\)\.upsert\(\[user\]\);([\s\S]*?)\} catch \(err\) \{\}([\s\S]*?)\}/,
  \`async saveUser(user: UserProfile) {
    const dbUser = { ...user };
    delete (dbUser as any).payment_history;
    
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('profiles').upsert([dbUser]);
        if (error) console.error('Supabase save error:', error);
      } catch (err) {
        console.error('Supabase save catch:', err);
      }
    }\`
);
fs.writeFileSync('lib/supabase.ts', supabaseTs, 'utf8');

// 2. Fix UI refresh in components/ServiceTermsModal.tsx
let modalTsx = fs.readFileSync('components/ServiceTermsModal.tsx', 'utf8');
modalTsx = modalTsx.replace(
  /showToast\('ขอบคุณที่ยอมรับข้อตกลงและนโยบาย PDPA'\);\s*\}/,
  \`showToast('ขอบคุณที่ยอมรับข้อตกลงและนโยบาย PDPA');
        window.location.reload();
      }\`
);
fs.writeFileSync('components/ServiceTermsModal.tsx', modalTsx, 'utf8');

console.log('Fixed supabase.ts and ServiceTermsModal.tsx');
