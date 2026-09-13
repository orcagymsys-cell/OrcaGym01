const fs = require('fs');
const iconv = require('iconv-lite');

const filePath = 'app/admin/dashboard/page.tsx';
const content = fs.readFileSync(filePath, 'utf8');

// Function to decode mojibake
function fixMojibake(text) {
    // If it has 'เธ' or 'เน' it's likely mojibake.
    // Encode to win874 bytes, then decode as utf8
    try {
        const buf = iconv.encode(text, 'win874');
        const fixed = buf.toString('utf8');
        // A simple check: if fixed string still contains replacement characters (ufffd) 
        // it means it wasn't pure mojibake.
        if (fixed.includes('\ufffd')) {
            return text;
        }
        return fixed;
    } catch(e) {
        return text;
    }
}

// We need to carefully replace only the mojibake parts.
// Because I added some VALID Thai text after the corruption!
// Let's use a regex to find all Thai words (and some punctuation) and check if they are mojibake.
let fixedContent = content.replace(/[\u0E00-\u0E7F\s\(\)\-\.]+/g, (match) => {
    if (match.includes('เธ') || match.includes('เน')) {
        return fixMojibake(match);
    }
    return match;
});

fs.writeFileSync('app/admin/dashboard/page_fixed.tsx', fixedContent, 'utf8');
console.log('Fixed saved to page_fixed.tsx');
