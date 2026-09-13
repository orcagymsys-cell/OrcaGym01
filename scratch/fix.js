const fs = require('fs');
let p = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
p = p.replace(
  /import \{ store, isSupabaseConfigured \} from '@\/lib\/supabase';/,
  "import { store, isSupabaseConfigured } from '@/lib/supabase';\nimport WeeklyScheduleAdmin from '@/app/components/WeeklyScheduleAdmin';"
);
fs.writeFileSync('app/admin/dashboard/page.tsx', p, 'utf8');
