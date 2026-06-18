const fs = require('fs');

const candidates = JSON.parse(fs.readFileSync('eid_candidates.json', 'utf8'));

console.log("Total candidates:", candidates.length);

const filtered = candidates.filter(c => {
  const alt = c.alt.toLowerCase();
  const src = c.src.toLowerCase();
  
  // Look for any image that mentions "이드", "eid", or "id" in alt
  return alt.includes('이드') || alt.includes('eid') || src.includes('eid') || src.includes('id');
});

console.log("Filtered candidates mentioning Eid/이드:", filtered.length);
filtered.forEach((c, idx) => {
  console.log(`${idx}: alt="${c.alt}", size=${c.width}x${c.height}, src="${c.src}"`);
});
