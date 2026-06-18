const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

const matched = icons.filter(icon => {
  const text = icon.cellText || '';
  const alt = icon.alt || '';
  return text.includes('이드') || alt.includes('이드') || text.toLowerCase().includes('eid') || alt.toLowerCase().includes('eid');
});

// Let's filter to make sure it's not a generic term or skin that isn't Eid
const cleanMatched = matched.map(m => ({
  cellTextSnippet: m.cellText.length > 60 ? m.cellText.substring(0, 60) + '...' : m.cellText,
  alt: m.alt,
  size: `${m.width}x${m.height}`,
  src: m.src
}));

console.log("Matched icons count:", cleanMatched.length);
console.log(JSON.stringify(cleanMatched.slice(0, 30), null, 2));
