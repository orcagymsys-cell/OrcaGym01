const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Missing env'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);

async function compressBase64(base64Str) {
  if (!base64Str || !base64Str.startsWith('data:image/')) return base64Str;
  try {
    const parts = base64Str.split(',');
    if (parts.length !== 2) return base64Str;
    const buffer = Buffer.from(parts[1], 'base64');
    
    if (buffer.length < 100 * 1024) return base64Str;
    
    const resizedBuffer = await sharp(buffer)
      .resize(600, null, { withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();
      
    return 'data:image/jpeg;base64,' + resizedBuffer.toString('base64');
  } catch (e) {
    console.error('Compression error:', e.message);
    return base64Str;
  }
}

async function run() {
  console.log('Fetching children...');
  const { data: children, error: errC } = await supabase.from('children').select('id, photo_url').not('photo_url', 'is', null);
  if (errC) return console.error(errC);
  
  for (const c of children) {
    if (c.photo_url && c.photo_url.length > 200000) { // roughly > 150KB
      console.log('Compressing child ' + c.id + ' photo (length ' + c.photo_url.length + ')...');
      const newUrl = await compressBase64(c.photo_url);
      if (newUrl !== c.photo_url) {
        await supabase.from('children').update({ photo_url: newUrl }).eq('id', c.id);
        console.log(' -> Compressed child ' + c.id + ' to length ' + newUrl.length);
      }
    }
  }

  console.log('Fetching profiles...');
  const { data: profiles, error: errP } = await supabase.from('profiles').select('id, payment_slip').not('payment_slip', 'is', null);
  if (errP) return console.error(errP);
  
  for (const p of profiles) {
    if (p.payment_slip && p.payment_slip.length > 200000) {
      console.log('Compressing profile ' + p.id + ' slip (length ' + p.payment_slip.length + ')...');
      const newUrl = await compressBase64(p.payment_slip);
      if (newUrl !== p.payment_slip) {
        await supabase.from('profiles').update({ payment_slip: newUrl }).eq('id', p.id);
        console.log(' -> Compressed profile ' + p.id + ' to length ' + newUrl.length);
      }
    }
  }
  
  console.log('Done!');
}
run();
