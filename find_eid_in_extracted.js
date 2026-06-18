const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

console.log("Total icons:", icons.length);

const matched = icons.filter(icon => {
  const text = icon.cellText || '';
  const alt = icon.alt || '';
  
  // Look for "이드" in text or alt
  return text.includes('이드') || alt.includes('이드') || text.toLowerCase().includes('eid') || alt.toLowerCase().includes('eid');
});

console.log("Matched icons:", matched.length);
matched.forEach((m, idx) => {
  console.log(`${idx}: cellText="${m.cellText}", alt="${m.alt}", size=${m.width}x${m.height}, src="${m.src}"`);
});
