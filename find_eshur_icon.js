const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

// Search for Eshur
const matched = icons.filter(icon => {
  const alt = icon.alt.toLowerCase();
  const cellText = icon.cellText.toLowerCase();
  return alt.includes('eshur') || cellText.includes('에슈르');
});

console.log("Matched icons for Eshur/에슈르:");
matched.forEach((m, idx) => {
  console.log(`${idx}: cellTextSnippet="${m.cellText.substring(0, 80).replace(/\n/g, ' ')}", alt="${m.alt}", size=${m.width}x${m.height}, src="${m.src}"`);
});
