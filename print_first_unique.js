const fs = require('fs');
const matches = JSON.parse(fs.readFileSync('eid_matches.json', 'utf8'));

const unique = [];
const seen = new Set();
matches.forEach(m => {
  const key = `${m.alt}::${m.src}`;
  if (!seen.has(key)) {
    seen.add(key);
    unique.push(m);
  }
});

console.log("Total unique:", unique.length);
unique.slice(0, 30).forEach((m, idx) => {
  console.log(`${idx}: alt="${m.alt}", src="${m.src}", text="${m.textSnippet.substring(0, 80)}"`);
});
