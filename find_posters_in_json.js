const fs = require('fs');

const images = JSON.parse(fs.readFileSync('story_page_images.json', 'utf8'));

console.log("Total images scraped:", images.length);

const matched = [];

images.forEach((img, idx) => {
  const alt = img.alt || '';
  const context = img.context || '';
  const src = img.src || '';
  
  if (src.startsWith('data:')) return;
  
  // Look for headings or text like "1챕터", "2챕터", "시즌 1", "시즌 2", "시즌 3", "패러디", "포스터"
  const isPoster = (
    alt.toLowerCase().includes('poster') || 
    context.includes('포스터') || 
    context.includes('패러디') ||
    context.includes('챕터') ||
    alt.includes('챕터') ||
    alt.includes('시즌') ||
    context.includes('시즌')
  );
  
  if (isPoster) {
    matched.push({
      index: idx,
      alt,
      src,
      contextSnippet: context.replace(/\s+/g, ' ').substring(0, 200)
    });
  }
});

fs.writeFileSync('matched_posters.json', JSON.stringify(matched, null, 2));
console.log(`Found ${matched.length} potential poster images. Saved to matched_posters.json`);
