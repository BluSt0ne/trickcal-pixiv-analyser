const fs = require('fs');

const html = fs.readFileSync('story_page.html', 'utf8');

// Find all headings and images in chronological order of HTML
const regex = /<(h[1-6]|img|tr|td|div)\b([^>]*)>/gi;
let match;
let currentHeading = 'None';
let currentTableContext = '';
let inTable = false;

const results = [];

// We will do a simple scan
let pos = 0;
while (pos < html.length) {
  // Find next heading or image tag
  const tagMatch = html.substring(pos).match(/<(h[1-6]|img)\b([^>]*)>/i);
  if (!tagMatch) break;
  
  const tagIndex = pos + tagMatch.index;
  const tagName = tagMatch[1].toLowerCase();
  const tagAttrs = tagMatch[2];
  
  if (tagName.startsWith('h')) {
    // It's a heading. Let's find its text
    const closeTag = `</${tagName}>`;
    const closeIndex = html.indexOf(closeTag, tagIndex);
    if (closeIndex !== -1) {
      const headingText = html.substring(tagIndex + tagMatch[0].length, closeIndex)
        .replace(/<[^>]*>/g, '') // strip HTML tags
        .trim();
      currentHeading = `${tagName}: ${headingText}`;
    }
  } else if (tagName === 'img') {
    // It's an image. Let's extract src and alt
    const srcMatch = tagAttrs.match(/src="([^"]*)"/i);
    const altMatch = tagAttrs.match(/alt="([^"]*)"/i);
    
    if (srcMatch) {
      const src = srcMatch[1];
      const alt = altMatch ? altMatch[1] : '';
      
      // Let's get some context before/after this image (e.g. 200 chars)
      const contextText = html.substring(Math.max(0, tagIndex - 300), Math.min(html.length, tagIndex + 500))
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
        
      if (!src.startsWith('data:') && (alt.includes('Trickcal') || alt.includes('포스터') || alt.includes('챕터') || contextText.includes('챕터') || contextText.includes('포스터') || contextText.includes('패러디'))) {
        results.push({
          heading: currentHeading,
          alt,
          src,
          context: contextText.substring(0, 300)
        });
      }
    }
  }
  
  pos = tagIndex + tagMatch[0].length;
}

fs.writeFileSync('parsed_story_posters.json', JSON.stringify(results, null, 2));
console.log(`Extracted ${results.length} images with context!`);
// Print first 20 to see
results.slice(0, 30).forEach((r, idx) => {
  console.log(`${idx}: heading="${r.heading}", alt="${r.alt}"`);
  console.log(`  src="${r.src}"`);
  console.log(`  context: ${r.context.substring(0, 150)}`);
});
