const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

const matched = icons.filter(icon => {
  const alt = icon.alt.toLowerCase();
  const text = icon.cellText;
  return alt === 'eshur' || alt.includes('eshur') || text === '에슈르';
});

console.log("Matched icons for Eshur/에슈르:", matched.length);
matched.forEach((m, idx) => {
  console.log(`${idx}: cellText="${m.cellText}", alt="${m.alt}", size=${m.width}x${m.height}, src="${m.src}"`);
});
