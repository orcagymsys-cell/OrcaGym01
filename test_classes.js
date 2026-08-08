const { createClient } = require('@supabase/supabase-js'); 
const supabase = createClient('https://qgbbqocuuxvdzdnjevzf.supabase.co', 'sb_publishable_Ede0nUhae6K8RbKAZBWZxw_ucjNa1AQ'); 
async function run() { 
  const {data} = await supabase.from('classes').select('*'); 
  console.log(JSON.stringify(data, null, 2)); 
} 
run();
