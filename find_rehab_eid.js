const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

const matched = icons.filter(icon => {
  const text = icon.cellText || '';
  const alt = icon.alt || '';
  return text.includes('재활') || alt.includes('Rehab');
});

console.log("Matched icons containing '재활' or 'Rehab':", matched.length);
matched.forEach((m, idx) => {
  console.log(`${idx}: cellTextSnippet="${m.cellText.substring(0, 80)}", alt="${m.alt}", size=${m.width}x${m.height}, src="${m.src}"`);
});
