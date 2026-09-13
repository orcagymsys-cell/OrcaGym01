const fs = require('fs');

function replaceInFile(filePath, regex, replacement) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.match(regex)) {
      content = content.replace(regex, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  }
}

// 1. In add-child
replaceInFile('app/add-child/page.tsx', 
  /expiry_date:\s*'02\/02\/2070'/g, 
  `expiry_date: (() => {
        let months = 2;
        const p = user.purchased_hours || 6;
        if (p === 12) months = 4;
        else if (p === 24) months = 6;
        else if (p >= 48) months = 12;
        const d = new Date(user.payment_datetime || user.created_at || new Date().toISOString().replace(' ', 'T'));
        const validD = isNaN(d.getTime()) ? new Date() : d;
        validD.setMonth(validD.getMonth() + months);
        return \`\${String(validD.getDate()).padStart(2, '0')}/\${String(validD.getMonth() + 1).padStart(2, '0')}/\${validD.getFullYear()}\`;
      })()`
);

// 2. In student/[id]/page.tsx
replaceInFile('app/student/[id]/page.tsx', 
  /วันหมดอายุ:\s*\{child\.expiry_date\s*\|\|\s*'02\/02\/2070'\}/g, 
  'วันหมดอายุ: {formattedPkgExpiryDate}'
);

// 3. In student/[id]/edit/page.tsx
replaceInFile('app/student/[id]/edit/page.tsx', 
  /expiry_date:\s*'02\/02\/2070'/g, 
  "expiry_date: ''"
);

// 4. Admin top up hours
replaceInFile('app/admin/dashboard/page.tsx', 
  /expiry_date:\s*'02\/02\/2070'/g, 
  `expiry_date: (() => {
          let months = 2;
          const p = newTotal;
          if (p === 12) months = 4;
          else if (p === 24) months = 6;
          else if (p >= 48) months = 12;
          const validD = new Date();
          validD.setMonth(validD.getMonth() + months);
          return \`\${String(validD.getDate()).padStart(2, '0')}/\${String(validD.getMonth() + 1).padStart(2, '0')}/\${validD.getFullYear()}\`;
        })()`
);

replaceInFile('app/admin/dashboard/page_fixed.tsx', 
  /const expiryDate\s*=\s*'02\/02\/2070';/g, 
  `const expiryDate = (() => {
      let months = 2;
      if (newTotal === 12) months = 4;
      else if (newTotal === 24) months = 6;
      else if (newTotal >= 48) months = 12;
      const validD = new Date();
      validD.setMonth(validD.getMonth() + months);
      return \`\${String(validD.getDate()).padStart(2, '0')}/\${String(validD.getMonth() + 1).padStart(2, '0')}/\${validD.getFullYear()}\`;
    })();`
);
replaceInFile('app/admin/dashboard/page_fixed2.tsx', 
  /const expiryDate\s*=\s*'02\/02\/2070';/g, 
  `const expiryDate = (() => {
      let months = 2;
      if (newTotal === 12) months = 4;
      else if (newTotal === 24) months = 6;
      else if (newTotal >= 48) months = 12;
      const validD = new Date();
      validD.setMonth(validD.getMonth() + months);
      return \`\${String(validD.getDate()).padStart(2, '0')}/\${String(validD.getMonth() + 1).padStart(2, '0')}/\${validD.getFullYear()}\`;
    })();`
);
