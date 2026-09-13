const fs = require('fs');
['app/admin/dashboard/page.tsx', 'app/admin/dashboard/page_fixed.tsx', 'app/admin/dashboard/page_fixed2.tsx'].forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('$\\le$')) {
      content = content.split('$\\le$').join('≤');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
});
