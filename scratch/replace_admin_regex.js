const fs = require('fs');

let page = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

if (!page.includes("import WeeklyScheduleAdmin")) {
  page = page.replace(
    "import { store } from '@/lib/supabase';",
    "import { store } from '@/lib/supabase';\nimport WeeklyScheduleAdmin from '@/app/components/WeeklyScheduleAdmin';"
  );
}

const tab3Regex = /\{\/\*\s*TAB 3: SCHEDULE MATRIX\s*\*\/\}([\s\S]*?)\{\/\*\s*TAB 4: AUDIT LOG\s*\*\/\}/g;

const newTab3 = `{/* TAB 3: SCHEDULE MATRIX */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <WeeklyScheduleAdmin allBookings={allBookings} />
          </div>
        )}
        
        {/* TAB 4: AUDIT LOG */}`;

page = page.replace(tab3Regex, newTab3);

fs.writeFileSync('app/admin/dashboard/page.tsx', page, 'utf8');
console.log("Successfully replaced TAB 3 with Regex!");
