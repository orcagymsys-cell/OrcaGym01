const fs = require('fs');
let lines = fs.readFileSync('app/student/[id]/page.tsx', 'utf8').split('\n');

const declareIdx = lines.findIndex(l => l.includes('const activeBookings = bookings.filter'));
if (declareIdx !== -1) {
    const declareLine = lines[declareIdx];
    lines.splice(declareIdx, 1);
    
    const useIdx = lines.findIndex(l => l.includes('const remaining = child.total_hours - activeBookings.length;'));
    if (useIdx !== -1) {
        lines.splice(useIdx, 0, declareLine);
    }
}

fs.writeFileSync('app/student/[id]/page.tsx', lines.join('\n'), 'utf8');
console.log('Fixed block scope error in student page');
