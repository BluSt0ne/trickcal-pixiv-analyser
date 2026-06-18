const fs = require('fs');

const candidates = JSON.parse(fs.readFileSync('eid_candidates.json', 'utf8'));

const clean = candidates.filter(c => {
  const src = c.src || '';
  return src.startsWith('//i.namu.wiki/i/') && !src.includes('logo') && !src.includes('skin') && !src.includes('svg');
});

console.log("First 50 clean candidates:");
clean.slice(0, 50).forEach((c, idx) => {
  console.log(`${idx}: alt="${c.alt}", size=${c.width}x${c.height}, src="${c.src}"`);
});
