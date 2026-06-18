const fs = require('fs');
const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

const targets = ['EdRehab', 'Ashur', 'SpeakiMaid'];
const results = {};

targets.forEach(target => {
  const matched = icons.filter(icon => {
    const text = icon.cellText || '';
    const alt = icon.alt || '';
    return alt.toLowerCase().includes(target.toLowerCase()) || text.toLowerCase().includes(target.toLowerCase());
  });
  
  results[target] = [];
  const uniqueSrcs = new Set();
  matched.forEach(m => {
    if (!uniqueSrcs.has(m.src)) {
      uniqueSrcs.add(m.src);
      results[target].push({
        alt: m.alt,
        src: m.src,
        cellTextSnippet: m.cellText ? m.cellText.substring(0, 100) : ''
      });
    }
  });
});

fs.writeFileSync('specific_icon_matches.json', JSON.stringify(results, null, 2));
console.log("Successfully wrote matches to specific_icon_matches.json!");
