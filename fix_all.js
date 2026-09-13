const fs = require('fs');

const charToByte = {};
for (let b = 0xA1; b <= 0xFB; b++) charToByte[0x0E00 + b - 0xA0] = b;
const cp1252 = {
    0x80: 0x20AC, 0x81: 0x0081, 0x82: 0x201A, 0x83: 0x0192, 0x84: 0x201E, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
    0x88: 0x02C6, 0x89: 0x2030, 0x8A: 0x0160, 0x8B: 0x2039, 0x8C: 0x0152, 0x8D: 0x008D, 0x8E: 0x017D, 0x8F: 0x008F,
    0x90: 0x0090, 0x91: 0x2018, 0x92: 0x2019, 0x93: 0x201C, 0x94: 0x201D, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014,
    0x98: 0x02DC, 0x99: 0x2122, 0x9A: 0x0161, 0x9B: 0x203A, 0x9C: 0x0153, 0x9D: 0x009D, 0x9E: 0x017E, 0x9F: 0x0178,
    0xA0: 0x00A0
};
for (let b in cp1252) charToByte[cp1252[b]] = parseInt(b);
for (let b = 0x00; b <= 0x7F; b++) charToByte[b] = b;

function processFile(filePath) {
    let finalContent = fs.readFileSync(filePath, 'utf8');
    let newText = '';
    let i = 0;
    while(i < finalContent.length) {
        let matched = false;
        
        // Try to match 4 bytes (Emoji)
        if (i + 3 < finalContent.length) {
            let c1 = finalContent.charCodeAt(i);
            let c2 = finalContent.charCodeAt(i+1);
            let c3 = finalContent.charCodeAt(i+2);
            let c4 = finalContent.charCodeAt(i+3);
            
            let b1 = charToByte[c1];
            let b2 = charToByte[c2];
            let b3 = charToByte[c3];
            let b4 = charToByte[c4];
            
            // Emoji utf8 starts with 0xF0
            if (b1 === 0xF0 && b2 !== undefined && b3 !== undefined && b4 !== undefined) {
                let buf = Buffer.from([b1, b2, b3, b4]);
                let decoded = buf.toString('utf8');
                if (!decoded.includes('\ufffd') && decoded.length === 2) { // Emojis have length 2 (surrogate pair)
                    newText += decoded;
                    i += 4;
                    matched = true;
                }
            }
        }
        
        // Try to match 3 bytes (Thai)
        if (!matched && i + 2 < finalContent.length) {
            let c1 = finalContent.charCodeAt(i);
            let c2 = finalContent.charCodeAt(i+1);
            let c3 = finalContent.charCodeAt(i+2);
            
            let b1 = charToByte[c1];
            let b2 = charToByte[c2];
            let b3 = charToByte[c3];
            
            // Thai utf8 starts with 0xE0
            if (b1 === 0xE0 && b2 !== undefined && b3 !== undefined) {
                let buf = Buffer.from([b1, b2, b3]);
                let decoded = buf.toString('utf8');
                if (!decoded.includes('\ufffd') && decoded.length === 1) { // 3 bytes = 1 Thai character
                    newText += decoded;
                    i += 3;
                    matched = true;
                }
            }
        }
        
        if (!matched) {
            newText += finalContent[i];
            i++;
        }
    }
    
    if (newText !== finalContent) {
        fs.writeFileSync(filePath, newText, 'utf8');
        console.log('Fixed ' + filePath);
    }
}

['app/home/page.tsx', 'app/audit/page.tsx', 'app/admin/dashboard/page.tsx', 'app/pricing/page.tsx', 'app/coaches/page.tsx', 'app/page.tsx'].forEach(file => {
    if (fs.existsSync(file)) {
        processFile(file);
    }
});
console.log('Done!');
