const fs = require('fs');
const mapping = fs.readFileSync('mapping.txt', 'utf8').trim().split('\n');
const charToByte = {};
mapping.forEach(line => {
    if(!line) return;
    const [b, c] = line.trim().split(':');
    charToByte[parseInt(c)] = parseInt(b);
});

const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// Function to decode a corrupted mojibake string
function decodeMojibake(str) {
    let bytes = [];
    for(let i=0; i<str.length; i++) {
        let code = str.charCodeAt(i);
        if(code < 128) {
            bytes.push(code);
        } else {
            let b = charToByte[code];
            if(b !== undefined) {
                bytes.push(b);
            } else {
                // If it's a valid Thai character that was NOT in the mapping (e.g. it was typed natively AFTER corruption),
                // we can't decode it! It should fail.
                return null;
            }
        }
    }
    const buf = Buffer.from(bytes);
    const decoded = buf.toString('utf8');
    if(decoded.includes('\ufffd')) return null; // Failed
    return decoded;
}

let finalContent = content.replace(/[\u0E00-\u0E7F\s\(\)\-\.\/:\u2000-\u206F\u0080-\u00FF]+/g, (match) => {
    // We only want to replace blocks that actually contain 'เธ' or 'เน'
    if (match.includes('เธ') || match.includes('เน')) {
        let fixed = decodeMojibake(match);
        if (fixed) return fixed;
    }
    return match;
});

fs.writeFileSync('app/admin/dashboard/page_fixed2.tsx', finalContent, 'utf8');
