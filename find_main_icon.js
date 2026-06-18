const fs = require('fs');

const candidates = JSON.parse(fs.readFileSync('eid_candidates.json', 'utf8'));

console.log("Total candidates:", candidates.length);

// Let's filter candidates that are square-ish and are NOT graduate skins or general game UI items
const filtered = candidates.filter(c => {
  const alt = c.alt;
  const src = c.src;
  
  // Exclude obviously unrelated elements
  if (alt.includes('TR보드') || alt.includes('ItemSlot') || alt.includes('Graduate') || alt.includes('연회장') || alt.includes('쌀숭이드') || alt.includes('기억조각') || alt.includes('전기양')) {
    return false;
  }
  
  // We want square-ish images that are candidates for profile picture
  // Often size is 120x120 or 100x100 or something similar
  return c.width > 50 && c.width < 300 && Math.abs(c.width - c.height) < 5;
});

console.log("Filtered clean square candidates:", filtered.length);
filtered.forEach((c, idx) => {
  console.log(`${idx}: alt="${c.alt}", size=${c.width}x${c.height}, src="${c.src}"`);
});
