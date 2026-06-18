const fs = require('fs');
const posters = JSON.parse(fs.readFileSync('matched_main_story_posters.json', 'utf8'));

console.log("Total matched posters:", posters.length);

posters.forEach((p, idx) => {
  let cleanSrc = p.src;
  if (cleanSrc.startsWith('//')) {
    cleanSrc = 'https:' + cleanSrc;
  }
  console.log(`${idx}: alt="${p.alt}"`);
  console.log(`  src="${cleanSrc}"`);
  console.log(`  context: ${p.contextSnippet}`);
});
