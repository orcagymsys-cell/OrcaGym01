const fs = require('fs');
let code = fs.readFileSync('app/components/StudentBookingsRoster.tsx', 'utf8');

// 1. Add Print Button
code = code.replace(
  /<div className="text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-300 self-start sm:self-auto shrink-0">/,
  `<div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <button onClick={() => window.print()} className="print:hidden text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl border border-blue-700 shadow-sm transition-colors cursor-pointer flex items-center gap-2">
            <span>🖨️</span> Save as PDF / พิมพ์
          </button>
          <div className="print:hidden text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-300">
            ทั้งหมด {filteredBookings.length} รายการ
          </div>
        </div>
        <div className="hidden text-xs font-bold text-slate-600 bg-slate-100 px-3.5 py-1.5 rounded-xl border border-slate-300 self-start sm:self-auto shrink-0">`
);

// 2. Hide filters in print
code = code.replace(
  /{[\s]*\/\* Course Filter Pill Bar \*\/[\s]*}/,
  `{/* Course Filter Pill Bar */}
      <div className="print:hidden">`
);
code = code.replace(
  /<\/div>\s*{\/\* Search Bar Row \*\/}/,
  `</div>
      </div>

      {/* Search Bar Row */}`
);

code = code.replace(
  /{\/\* Search Bar Row \*\/}\s*<div className="flex flex-col sm:flex-row/,
  `{/* Search Bar Row */}
      <div className="print:hidden flex flex-col sm:flex-row`
);

// 3. Add Check-in Column & Hide Action Column in print
code = code.replace(
  /<th className="p-3 sm:p-3.5 font-black whitespace-nowrap text-center">จัดการ<\/th>/,
  `<th className="hidden print:table-cell p-3 sm:p-3.5 font-black whitespace-nowrap text-center">เช็คชื่อ</th>
              <th className="print:hidden p-3 sm:p-3.5 font-black whitespace-nowrap text-center">จัดการ</th>`
);

code = code.replace(
  /{\/\* Action \*\/}\s*<td className="p-3 sm:p-3.5 text-center">/,
  `{/* Check-in */}
                    <td className="hidden print:table-cell p-3 sm:p-3.5 text-center">
                      <div className="w-5 h-5 border-2 border-slate-300 rounded mx-auto print:border-black"></div>
                    </td>

                    {/* Action */}
                    <td className="print:hidden p-3 sm:p-3.5 text-center">`
);

code = code.replace(
  /<th className="p-3 sm:p-3.5 font-black whitespace-nowrap text-center">สถานะ<\/th>/,
  `<th className="print:hidden p-3 sm:p-3.5 font-black whitespace-nowrap text-center">สถานะ</th>`
);

code = code.replace(
  /{\/\* Status \*\/}\s*<td className="p-3 sm:p-3.5 text-center">/,
  `{/* Status */}
                    <td className="print:hidden p-3 sm:p-3.5 text-center">`
);

// 4. Make child name bigger
code = code.replace(
  /<div className="font-black text-\[#001a3a\] text-sm">\s*{b.child_nickname \|\| 'ไม่ทราบชื่อ'}\s*<\/div>\s*{b.child_full_name && \(\s*<div className="text-\[11px\] font-medium text-slate-500">\s*{b.child_full_name}\s*<\/div>\s*\)}/g,
  `<div className="font-black text-[#001a3a] text-sm">
                        {b.child_nickname || 'ไม่ทราบชื่อ'}
                      </div>
                      {b.child_full_name && (
                        <div className="text-[13px] font-extrabold text-slate-700 mt-0.5 print:text-black">
                          {b.child_full_name}
                        </div>
                      )}`
);

// Add print layout to container
code = code.replace(
  /className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm mt-8 space-y-5"/,
  `className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-200 shadow-sm mt-8 space-y-5 print:shadow-none print:border-none print:p-0 print:m-0 print:space-y-4"`
);

// Add print class to table container
code = code.replace(
  /className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs"/,
  `className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs print:shadow-none print:border-black print:overflow-visible"`
);

// Fix tr backgrounds for print
code = code.replace(
  /className="bg-\[#001a3a\] text-white border-b border-blue-950 font-black"/,
  `className="bg-[#001a3a] text-white border-b border-blue-950 font-black print:bg-slate-200 print:text-black print:border-black"`
);

code = code.replace(
  /className="border-b border-slate-100 hover:bg-slate-50\/80 transition-colors"/,
  `className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors print:border-slate-300"`
);

fs.writeFileSync('app/components/StudentBookingsRoster.tsx', code, 'utf8');
console.log('PDF export ready');
