const fs = require('fs');

const candidates = JSON.parse(fs.readFileSync('eid_candidates.json', 'utf8'));

console.log("Total candidates:", candidates.length);

const clean = candidates.filter(c => {
  const src = c.src || '';
  return src.startsWith('//i.namu.wiki/i/') && !src.includes('logo') && !src.includes('skin') && !src.includes('svg');
});

console.log("Clean candidates:", clean.length);

// Print the first 100 clean candidates
clean.slice(0, 100).forEach((c, idx) => {
  console.log(`${idx}: alt="${c.alt}", size=${c.width}x${c.height}, src="${c.src}"`);
});
