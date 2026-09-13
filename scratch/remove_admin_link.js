const fs = require('fs');
let content = fs.readFileSync('components/MenuDrawer.tsx', 'utf8');
content = content.replace(/<Link href=\"\/admin\/login\"[\s\S]*?<\/Link>/g, '');
fs.writeFileSync('components/MenuDrawer.tsx', content, 'utf8');
