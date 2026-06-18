const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

const matched = [];
icons.forEach(icon => {
  const text = icon.cellText || '';
  const alt = icon.alt || '';
  
  if (text.includes('에슈르') || alt.toLowerCase().includes('eshur') || text.includes('이드') || alt.toLowerCase().includes('eid')) {
    matched.push({
      textSnippet: text.replace(/\s+/g, ' ').substring(0, 100),
      alt: alt,
      src: icon.src,
      size: `${icon.width}x${icon.height}`
    });
  }
});

fs.writeFileSync('eshur_matches.json', JSON.stringify(matched, null, 2));
console.log("Saved matches to eshur_matches.json");
