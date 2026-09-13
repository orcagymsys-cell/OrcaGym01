const fs = require('fs');

const charToByte = {};
for (let b = 0xA1; b <= 0xFB; b++) charToByte[0x0E00 + b - 0xA0] = b;
const cp1252 = {
    0x80: 0x20AC, 0x81: 0x0081, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
    0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8D: 0x008D, 0x8E: 0x017D, 0x8F: 0x008F,
    0x90: 0x0090, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9D: 0x009D, 0x9E: 0x017E, 0x9F: 0x0178,
    0xA0: 0x00A0 // non-breaking space
};

for (let b in cp1252) charToByte[cp1252[b]] = parseInt(b);
for (let b = 0x00; b <= 0x7F; b++) charToByte[b] = b;

const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

function decodeMojibake(str) {
    let bytes = [];
    for(let i=0; i<str.length; i++) {
        let code = str.charCodeAt(i);
        let b = charToByte[code];
        // If it's undefined, just output the bytes we have so far, and append the character
        if (b === undefined) return null;
        bytes.push(b);
    }
    const buf = Buffer.from(bytes);
    const decoded = buf.toString('utf8');
    if(decoded.includes('\ufffd')) return null;
    return decoded;
}

// Regex to capture ANY sequence of characters that contains 'เ' or 'เน'
// Let's just look for any sequence of 3 characters where the first two map to 0xE0 0xB8 or 0xE0 0xB9
let finalContent = content;
// Let's just scan through the text manually!
let newText = '';
let i = 0;
while(i < finalContent.length) {
    let code1 = finalContent.charCodeAt(i);
    let code2 = i+1 < finalContent.length ? finalContent.charCodeAt(i+1) : 0;
    let code3 = i+2 < finalContent.length ? finalContent.charCodeAt(i+2) : 0;
    
    let b1 = charToByte[code1];
    let b2 = charToByte[code2];
    let b3 = charToByte[code3];
    
    // A Thai UTF-8 character is exactly 3 bytes: 
    // E0 B8 xx or E0 B9 xx
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
