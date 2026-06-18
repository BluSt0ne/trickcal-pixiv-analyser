const fs = require('fs');
const matches = JSON.parse(fs.readFileSync('eid_matches.json', 'utf8'));

const summary = [];
const seen = new Set();

matches.forEach(m => {
  const key = `${m.alt}::${m.src}`;
  if (!seen.has(key)) {
    seen.add(key);
    summary.push(m);
  }
});

console.log("Unique matches:");
summary.forEach((m, idx) => {
  console.log(`${idx}: alt="${m.alt}", src="${m.src}", textSnippet="${m.textSnippet.substring(0, 50)}"`);
});
