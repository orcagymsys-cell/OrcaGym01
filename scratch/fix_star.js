const fs = require('fs');
let code = fs.readFileSync('app/pricing/page.tsx', 'utf8');

const oldCode = `{opt.tag && (
                              <span className="text-rose-600 font-black ml-1 text-[11px]">{opt.tag}</span>
                            )}`;

const newCode = `{opt.tag && (
                              <span className="inline-flex items-center justify-center relative ml-3 w-12 h-12 align-middle transform -translate-y-0.5" title={opt.tag}>
                                <svg className="absolute w-full h-full text-amber-400 drop-shadow-md" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} viewBox="0 0 100 100" fill="currentColor">
                                  <polygon points="50,5 61,23 80,18 82,38 100,47 85,61 90,80 71,80 61,96 50,82 39,96 29,80 10,80 15,61 0,47 18,38 20,18 39,23" />
                                </svg>
                                <span className="relative z-10 text-[11px] font-black text-rose-900 uppercase tracking-tighter text-center leading-[1] mt-0.5" style={{ animation: 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                                  {opt.tag.split(' ').map((w,i) => <span key={i} className="block">{w}</span>)}
                                </span>
                              </span>
                            )}`;

if (code.includes('<span className="text-rose-600 font-black ml-1 text-[11px]">{opt.tag}</span>')) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('app/pricing/page.tsx', code, 'utf8');
  console.log('Fixed pricing tag UI');
} else {
  console.log('Could not find old code in app/pricing/page.tsx');
}
