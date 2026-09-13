const fs = require('fs');
let lines = fs.readFileSync('app/pricing/page.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('Student Bookings Roster Section'));

if(start !== -1) {
  let depth = 0;
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].includes('<div')) depth += (lines[i].match(/<div/g) || []).length;
    if (lines[i].includes('</div')) depth -= (lines[i].match(/<\/div/g) || []).length;
    if (depth <= 0 && lines[i].includes('</div>')) {
      end = i;
      break;
    }
  }

  if (end !== -1) {
    lines.splice(start, end - start + 1);
    fs.writeFileSync('app/pricing/page.tsx', lines.join('\n'), 'utf8');
    console.log('Removed Roster from pricing');
  } else {
    console.log('Could not find end of block');
  }
} else {
  console.log('Could not find start of block');
}
