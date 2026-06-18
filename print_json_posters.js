const fs = require('fs');
const posters = JSON.parse(fs.readFileSync('all_story_posters.json', 'utf8'));

console.log("Found posters:");
posters.forEach((p, idx) => {
  console.log(`${idx}: heading="${p.heading}", alt="${p.alt}"`);
  console.log(`  src="${p.src}"`);
});
