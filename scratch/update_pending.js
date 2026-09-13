const fs = require('fs');
let code = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

code = code.replace(
  /<span>👶 {c\.full_name} <span className="text-sky-700 font-bold">\({c\.nickname}\)<\/span><\/span>/,
  `<div className="flex items-center gap-1.5">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.nickname} className="w-5 h-5 rounded-full object-cover border border-amber-200" />
                    ) : (
                      <span>👶</span>
                    )}
                    <span>{c.full_name} <span className="text-sky-700 font-bold">({c.nickname})</span></span>
                  </div>`
);

fs.writeFileSync('app/admin/dashboard/page.tsx', code, 'utf8');
