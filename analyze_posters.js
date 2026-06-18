const fs = require('fs');
const images = JSON.parse(fs.readFileSync('story_page_images.json', 'utf8'));

console.log("Analyzing Trickcal Revive images:");

images.forEach((img, idx) => {
  const alt = img.alt || '';
  const src = img.src || '';
  
  if (alt.startsWith('Trickcal') || alt.includes('챕터') || alt.includes('시즌') || alt.includes('스토리')) {
    console.log(`${idx}: alt="${alt}"`);
    console.log(`  src="${src}"`);
    console.log(`  context: ${img.context ? img.context.substring(0, 150).replace(/\n/g, ' ') : ''}`);
  }
});
