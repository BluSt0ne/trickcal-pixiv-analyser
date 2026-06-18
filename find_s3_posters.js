const fs = require('fs');
const posters = JSON.parse(fs.readFileSync('all_story_posters.json', 'utf8'));

console.log("All extracted posters for Season 3:");
posters.forEach((p, idx) => {
  if (p.heading.includes('2.3.')) {
    console.log(`${idx}: heading="${p.heading}", src="${p.src}"`);
  }
});
