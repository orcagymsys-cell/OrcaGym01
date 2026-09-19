const fs = require('fs');
let text = fs.readFileSync('lib/supabase.ts', 'utf8');

text = text.replace(
  /if \(!error && data && data\.length > 0\) \{\n\s*setLocal\(STORAGE_KEYS\.USERS, data\);\n\s*return data;\n\s*\}/g,
  `if (!error && data) {\n      setLocal(STORAGE_KEYS.USERS, data);\n      return data;\n    }`
);

text = text.replace(
  /if \(data && data\.length > 0\) return data;/g,
  `if (data) {\n        setLocal(STORAGE_KEYS.AUDIT_LOGS, data);\n        return data;\n      }`
);

text = text.replace(
  /\} else if \(!error && data && data\.length === 0\) \{[\s\S]*?\}\n\s*\}/g,
  `}`
);

text = text.replace(
  /if \(!error && data && data\.length > 0\) \{\n\s*setLocal\(STORAGE_KEYS\.COURSES, data\);\n\s*return data;\n\s*\}/g,
  `if (!error && data) {\n          setLocal(STORAGE_KEYS.COURSES, data);\n          return data;\n        }`
);

fs.writeFileSync('lib/supabase.ts', text, 'utf8');
console.log('Fixed cache');
