const fs = require('fs');
const iconv = require('iconv-lite');
const content = fs.readFileSync('app/admin/dashboard/page.tsx', 'utf8');

// I will just decode the ENTIRE file from utf8 to win874 bytes, and see if it looks like valid utf8.
const buf = iconv.encode(content, 'win874');
// Now decode as utf8
const fixedContent = buf.toString('utf8');

// The problem is that valid ASCII characters (like 'import { useState }') 
// will be perfectly preserved because win874 and ascii overlap!
// Wait! If the file contains valid Thai text (like the one I just added 'Username สำหรับเข้าสู่ระบบ:'), 
// that valid Thai text will be encoded to win874 bytes (0xA1 - 0xFB) and then decoded as UTF-8, which will cause \uFFFD !!
// So I MUST NOT decode the valid Thai text!
// I must ONLY decode the corrupted Thai text!

// How to distinguish?
// Corrupted Thai text is actually UTF-8 interpreted as Win874.
// This means every Thai character (3 bytes in UTF-8) became 3 Thai characters!
// So it consists almost entirely of 'เ', 'ธ', 'เน', and other specific characters.
// Let's use a regex to find blocks of text that consist ONLY of Thai characters and whitespace/punctuation, 
// AND contain 'เธ' or 'เน'.
let finalContent = content.replace(/[\u0E00-\u0E7F\s\(\)\-\.\/:]+/g, (match) => {
    if (match.includes('เธ') || match.includes('เน')) {
        try {
            const tempBuf = iconv.encode(match, 'win874');
            const fixedStr = tempBuf.toString('utf8');
            if (!fixedStr.includes('\ufffd')) {
                return fixedStr;
            }
        } catch(e) {}
    }
    return match;
});

fs.writeFileSync('app/admin/dashboard/page_fixed.tsx', finalContent, 'utf8');
