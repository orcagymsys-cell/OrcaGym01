const fs = require('fs');
let code = fs.readFileSync('lib/supabase.ts', 'utf8');

// Remove photo_url deletion
code = code.replace(/delete \(childForDB as any\)\.photo_url;\s*/g, '');

// Add uploadAvatar function
const uploadFunc = `
  async uploadAvatar(file: File, prefix: string): Promise<string | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = \`\${prefix}_\${Date.now()}.\${ext}\`;
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

  async getChildren`;

if (!code.includes('uploadAvatar')) {
  code = code.replace('async getChildren', uploadFunc);
}

fs.writeFileSync('lib/supabase.ts', code, 'utf8');
console.log('Fixed lib/supabase.ts');
