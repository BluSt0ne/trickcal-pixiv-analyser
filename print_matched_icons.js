const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

// Filter specifically for "이드" as a standalone word or name in cellText, or "eid" in alt
const matched = icons.filter(icon => {
  const text = (icon.cellText || '').trim();
  const alt = (icon.alt || '').trim();
  
  // Look for cells that end with "이드" or match "이드" exactly
  return text.endsWith('이드') || text === '이드' || alt.toLowerCase() === 'eid' || alt === '이드';
});

console.log("Matched icons for Eid/이드:", matched.length);
matched.forEach((m, idx) => {
  console.log(`${idx}: cellText="${m.cellText}", alt="${m.alt}", size=${m.width}x${m.height}, src="${m.src}"`);
});
