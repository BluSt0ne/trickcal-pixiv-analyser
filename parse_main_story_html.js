const fs = require('fs');

const html = fs.readFileSync('main_story_page.html', 'utf8');

let pos = 0;
let currentHeading = 'None';
const results = [];

while (pos < html.length) {
  const tagMatch = html.substring(pos).match(/<(h[1-6]|img)\b([^>]*)>/i);
  if (!tagMatch) break;
  
  const tagIndex = pos + tagMatch.index;
  const tagName = tagMatch[1].toLowerCase();
  const tagAttrs = tagMatch[2];
  
  if (tagName.startsWith('h')) {
    const closeTag = `</${tagName}>`;
    const closeIndex = html.indexOf(closeTag, tagIndex);
    if (closeIndex !== -1) {
      const headingText = html.substring(tagIndex + tagMatch[0].length, closeIndex)
        .replace(/<[^>]*>/g, '')
        .trim();
      currentHeading = headingText;
    }
  } else if (tagName === 'img') {
    const srcMatch = tagAttrs.match(/src="([^"]*)"/i);
    const altMatch = tagAttrs.match(/alt="([^"]*)"/i);
    
    if (srcMatch) {
      const src = srcMatch[1];
      const alt = altMatch ? altMatch[1] : '';
      
      const contextText = html.substring(Math.max(0, tagIndex - 400), Math.min(html.length, tagIndex + 600))
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (!src.startsWith('data:') && alt.startsWith('ChapterImage')) {
        results.push({
          heading: currentHeading,
          alt,
          src: src.startsWith('//') ? 'https:' + src : src,
          context: contextText.substring(0, 300)
        });
      }
    }
  }
  
  pos = tagIndex + tagMatch[0].length;
}

fs.writeFileSync('all_story_posters.json', JSON.stringify(results, null, 2));
console.log(`Extracted ${results.length} story posters!`);
results.forEach((r, idx) => {
  console.log(`${idx}: heading="${r.heading}"`);
  console.log(`  alt="${r.alt}"`);
  console.log(`  src="${r.src}"`);
  console.log(`  context: ${r.context.substring(0, 150)}`);
});
