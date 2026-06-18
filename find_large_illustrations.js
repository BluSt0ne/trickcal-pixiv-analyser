const fs = require('fs');

const candidates = JSON.parse(fs.readFileSync('eid_candidates.json', 'utf8'));

// Filter candidates that are larger, typical of the main infobox character illustration
const filtered = candidates.filter(c => {
  return c.width >= 200 && c.width <= 400;
});

console.log("Filtered large illustration candidates:");
filtered.forEach((c, idx) => {
  console.log(`${idx}: alt="${c.alt}", size=${c.width}x${c.height}, src="${c.src}"`);
});
