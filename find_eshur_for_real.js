const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

// Filter icons that are candidates for Eshur (에슈르)
const eshurCandidates = icons.filter(icon => {
  const alt = icon.alt.toLowerCase();
  const text = icon.cellText.toLowerCase();
  return alt.includes('eshur') || alt.includes('esur') || text.includes('에슈르');
});

console.log("Eshur candidates found:", eshurCandidates.length);
eshurCandidates.forEach((c, idx) => {
  console.log(`${idx}: alt="${c.alt}", size=${c.width}x${c.height}, src="${c.src}"`);
});
