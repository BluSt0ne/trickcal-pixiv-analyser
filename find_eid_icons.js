const fs = require('fs');

const candidates = JSON.parse(fs.readFileSync('eid_candidates.json', 'utf8'));

// Filter candidates that could be the main face/profile icon
const filtered = candidates.filter(c => {
  const alt = c.alt.toLowerCase();
  const src = c.src.toLowerCase();
  
  const isCandidate = (
    alt.includes('eid') || 
    alt.includes('이드') || 
    alt.includes('ed')
  );
  
  if (!isCandidate) return false;
  
  // Exclude skills, boards, backgrounds, items, etc.
  if (alt.includes('skill') || alt.includes('board') || alt.includes('공간') || alt.includes('피규어') || alt.includes('연회장') || alt.includes('쌀숭이드')) {
    return false;
  }
  
  return true;
});

console.log("Filtered face icon candidates:");
filtered.forEach((c, idx) => {
  console.log(`${idx}: alt="${c.alt}", size=${c.width}x${c.height}, src="${c.src}"`);
});
