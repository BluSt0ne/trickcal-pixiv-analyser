const fs = require('fs');

const events = JSON.parse(fs.readFileSync('public/events.json', 'utf8'));
const banners = JSON.parse(fs.readFileSync('scraped_banners.json', 'utf8'));

// Build a map of clean banner links
const bannerMap = {};

for (const b of banners) {
  if (!b.src || b.src.startsWith('data:')) continue; // Skip placeholders/SVGs
  
  let key = '';
  // Check anchorHref
  if (b.anchorHref) {
    try {
      const decoded = decodeURIComponent(b.anchorHref);
      // Extracts the last part after / or #
      const parts = decoded.split('/');
      const lastPart = parts[parts.length - 1];
      const subParts = lastPart.split('#');
      key = subParts[subParts.length - 1].trim();
    } catch(e) {}
  }
  
  if (!key && b.alt) {
    // If alt contains "배너" or similar, use it
    key = b.alt.replace('배너', '').replace('테마극장', '').trim();
  }
  
  if (key) {
    let cleanSrc = b.src;
    if (cleanSrc.startsWith('//')) {
      cleanSrc = 'https:' + cleanSrc;
    }
    bannerMap[key] = cleanSrc;
    // Also store by partial matching
    const cleanKey = key.replace(/[^가-힣a-zA-Z0-9]/g, '');
    if (cleanKey) {
      bannerMap[cleanKey] = cleanSrc;
    }
  }
}

console.log("Banner map size:", Object.keys(bannerMap).length);

// Now update events
let matchCount = 0;
let totalThemes = 0;

const updatedEvents = events.map(e => {
  if (e.type === '테마극장') {
    totalThemes++;
    const cleanTitle = e.title.replace(/[^가-힣a-zA-Z0-9]/g, '');
    let bannerUrl = bannerMap[e.title] || bannerMap[cleanTitle];
    
    if (!bannerUrl) {
      // Try fuzzy matching
      for (const [key, url] of Object.entries(bannerMap)) {
        if (key.includes(e.title) || e.title.includes(key)) {
          bannerUrl = url;
          break;
        }
      }
    }
    
    if (bannerUrl) {
      matchCount++;
      return { ...e, banner: bannerUrl };
    } else {
      console.log(`Failed to match banner for: ${e.title}`);
    }
  }
  return e;
});

console.log(`Successfully matched ${matchCount} out of ${totalThemes} theme theaters.`);

fs.writeFileSync('public/events.json', JSON.stringify(updatedEvents, null, 2));
console.log("Saved updated events to public/events.json");
