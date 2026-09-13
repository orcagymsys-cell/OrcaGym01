const fs = require('fs');

const charToByte = {};
for (let b = 0xA1; b <= 0xFB; b++) charToByte[0x0E00 + b - 0xA0] = b;
for (let b = 0x00; b <= 0xFF; b++) charToByte[b] = b; // Map ALL 0x00-0xFF bytes directly to themselves!
// Because powershell Get-Content mapped bytes 0x80-0xFF to U+0080-U+00FF!

// Wait, did it? What about U+017E? Let's map everything just in case!
const cp1252 = {
    0x80: 0x20AC, 0x81: 0x0081, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
    0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8D: 0x008D, 0x8E: 0x017D, 0x8F: 0x008F,
    0x90: 0x0090, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9D: 0x009D, 0x9E: 0x017E, 0x9F: 0x0178,
    0xA0: 0x00A0
};
for (let b in cp1252) charToByte[cp1252[b]] = parseInt(b);

let finalContent = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');
let newText = '';
let i = 0;
while(i < finalContent.length) {
    let code1 = finalContent.charCodeAt(i);
    let code2 = i+1 < finalContent.length ? finalContent.charCodeAt(i+1) : 0;
    let code3 = i+2 < finalContent.length ? finalContent.charCodeAt(i+2) : 0;
    
    let b1 = charToByte[code1];
    let b2 = charToByte[code2];
    let b3 = charToByte[code3];
    
    if (b1 === 0xE0 && (b2 === 0xB8 || b2 === 0xB9) && b3 !== undefined) {
        let buf = Buffer.from([b1, b2, b3]);
        let decoded = buf.toString('utf8');
        if (!decoded.includes('\ufffd')) {
            newText += decoded;
            i += 3;
            continue;
        }
    }
    newText += finalContent[i];
    i++;
}
fs.writeFileSync('app/admin/dashboard/page.tsx', newText, 'utf8');
console.log('Fixed for real');
