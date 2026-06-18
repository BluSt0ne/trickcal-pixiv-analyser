const fs = require('fs');

const matches = JSON.parse(fs.readFileSync('eshur_matches.json', 'utf8'));

// Find matches where cellTextSnippet contains "에슈르" and does not have the giant list of names
const filtered = matches.filter(m => {
  const text = m.textSnippet;
  // If it's a long list of characters, skip it
  if (text.includes('비비') && text.includes('에르핀') && text.includes('란')) {
    return false;
  }
  return text.includes('에슈르');
});

console.log("Filtered Eshur matches:");
filtered.forEach((f, idx) => {
  console.log(`${idx}: alt="${f.alt}", size=${f.size}, src="${f.src}", text="${f.textSnippet}"`);
});
