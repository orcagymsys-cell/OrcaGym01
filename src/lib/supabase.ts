import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qgbbqocuuxvdzdnjevzf.supabase.co';
const supabaseAnonKey = 'sb_publishable_Ede0nUhae6K8RbKAZBWZxw_ucjNa1AQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
