const fs = require('fs');
const images = JSON.parse(fs.readFileSync('story_page_images.json', 'utf8'));

console.log("First 20 images:");
images.slice(0, 20).forEach((img, idx) => {
  console.log(`${idx}: alt="${img.alt}", src="${img.src ? img.src.substring(0, 80) : ''}", contextLength=${img.context ? img.context.length : 0}`);
});
