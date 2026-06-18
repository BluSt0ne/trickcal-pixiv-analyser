const fs = require('fs');
const images = JSON.parse(fs.readFileSync('eid_page_images.json', 'utf8'));

const candidates = images.filter(img => {
  const src = img.src || '';
  const alt = img.alt || '';
  return alt.toLowerCase().includes('eid') || 
         alt.toLowerCase().includes('rehab') || 
         alt.includes('이드');
});

console.log("Found candidates on Eid page:");
candidates.forEach((c, idx) => {
  console.log(`${idx}: alt="${c.alt}", src="${c.src}", size=${c.width}x${c.height}`);
});
