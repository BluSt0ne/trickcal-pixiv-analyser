const fs = require('fs');
const images = JSON.parse(fs.readFileSync('story_page_images.json', 'utf8'));

console.log("All non-empty alt images:");
images.forEach((img, idx) => {
  const alt = img.alt || '';
  const src = img.src || '';
  if (alt && !src.startsWith('data:')) {
    console.log(`${idx}: alt="${alt}", src="${src.substring(0, 80)}"`);
  }
});
