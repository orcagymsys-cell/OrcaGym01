
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://kgwiuvncgxxqghtcodgt.supabase.co', 'sb_publishable_Q-X4sgpdlh-iwDfDLBebsg_dEn0eoP4');

async function fix() {
  const { data: users } = await supabase.from('users').select('*');
  const found = users.filter(u => (u.name || '').toLowerCase().includes('rutairach') || (u.email || '').toLowerCase().includes('rutairach'));
  console.log(found.map(u => ({ id: u.id, name: u.name, email: u.email, h: u.payment_history })));
  if (found.length > 0) {
    const u = found[0];
    if (u.payment_history) {
      u.payment_history.forEach(h => h.course_name = 'MEGA ORCA');
      const { error } = await supabase.from('users').update({ payment_history: u.payment_history }).eq('id', u.id);
      if (error) console.log(error); else console.log('Successfully updated!');
    }
  }
}
fix();

