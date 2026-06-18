const fs = require('fs');
const images = JSON.parse(fs.readFileSync('main_story_images.json', 'utf8'));

console.log("Last 20 images on page:");
images.slice(-20).forEach((img, idx) => {
  const realIdx = images.length - 20 + idx;
  console.log(`${realIdx}: heading="${img.heading || ''}", alt="${img.alt || ''}", src="${img.src ? img.src.substring(0, 80) : ''}"`);
  console.log(`  context: ${img.context ? img.context.substring(0, 100).replace(/\s+/g, ' ') : ''}`);
});
