const fs = require('fs');
const images = JSON.parse(fs.readFileSync('main_story_images.json', 'utf8'));

console.log("Analyzing Main Story page images:");

const matched = [];
images.forEach((img, idx) => {
  const alt = img.alt || '';
  const src = img.src || '';
  const context = img.context || '';
  
  if (src.startsWith('data:')) return;
  
  // Clean up context spacing for printing
  const cleanContext = context.replace(/\s+/g, ' ').trim();
  
  // Look for markers
  const isPoster = (
    alt.toLowerCase().includes('chapter') ||
    alt.toLowerCase().includes('season') ||
    alt.toLowerCase().includes('poster') ||
    cleanContext.includes('시즌') ||
    cleanContext.includes('챕터') ||
    alt.includes('시즌') ||
    alt.includes('챕터')
  );
  
  if (isPoster) {
    matched.push({
      index: idx,
      alt,
      src,
      contextSnippet: cleanContext.substring(0, 150)
    });
  }
});

fs.writeFileSync('matched_main_story_posters.json', JSON.stringify(matched, null, 2));
console.log(`Found ${matched.length} potential poster images.`);

matched.forEach((m, idx) => {
  console.log(`${idx}: alt="${m.alt}", src="${m.src.substring(0, 80)}"`);
  console.log(`  context: ${m.contextSnippet}`);
});
