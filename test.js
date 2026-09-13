const text = 'เธงเธฑเธ™-เน€เธงเธฅเธฒเธ—เธตเนˆเน‚เธญเธ™ (เธฃเธนเธ›เน เธšเธšเธ›เธ เธดเธ—เธดเธ™)';
let bytes = [];
for (let i = 0; i < text.length; i++) {
    let code = text.charCodeAt(i);
    if (code >= 0x0E01 && code <= 0x0E5B) {
        bytes.push(code - 0x0E00 + 0xA0);
    } else {
        bytes.push(code); // ASCII
    }
}
const buf = Buffer.from(bytes);
console.log(buf.toString('utf8'));
