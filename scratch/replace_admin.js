const fs = require('fs');

let page = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

if (!page.includes("import WeeklyScheduleAdmin")) {
  page = page.replace(
    "import { store } from '@/lib/supabase';",
    "import { store } from '@/lib/supabase';\nimport WeeklyScheduleAdmin from '@/app/components/WeeklyScheduleAdmin';"
  );
}

const tab3Start = "{/* TAB 3: SCHEDULE MATRIX */}\n        {activeTab === 'schedule' && (";
const tab3EndComment = "{/* TAB 4: AUDIT LOG */}";

const startIdx = page.indexOf(tab3Start);
const endIdx = page.indexOf(tab3EndComment);

if (startIdx !== -1 && endIdx !== -1) {
  const newTab3 = `{/* TAB 3: SCHEDULE MATRIX */}
        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <WeeklyScheduleAdmin allBookings={allBookings} />
          </div>
        )}
        
        `;
  
  page = page.substring(0, startIdx) + newTab3 + page.substring(endIdx);
  fs.writeFileSync('app/admin/dashboard/page.tsx', page, 'utf8');
  console.log("Successfully replaced TAB 3!");
} else {
  console.log("Could not find TAB 3 boundaries.");
}
