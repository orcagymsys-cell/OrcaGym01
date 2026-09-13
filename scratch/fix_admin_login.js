const fs = require('fs');

const files = [
  'app/admin/dashboard/page.tsx',
  'app/audit/page.tsx',
  'components/AppLayoutWrapper.tsx',
  'components/Header.tsx',
  'components/MenuDrawer.tsx',
  'components/Sidebar.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace redirects
    content = content.replace(/router\.push\('\/admin\/login'\)/g, "router.push('/')");
    
    // Remove from auth page checks
    content = content.replace(/ \|\| pathname === '\/admin\/login'/g, "");
    
    // Menu Drawer Link: We can just remove that specific link or point it to '/' 
    // Wait, if MenuDrawer has a direct link to admin login, maybe we remove the whole Link block?
    // Let's just point it to '/' for now if it exists, or let's look at it.
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated:', file);
  }
});
