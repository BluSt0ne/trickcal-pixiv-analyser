const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  console.log("Analyzing character list page for Eid and Eshur...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const filePath = 'file:///C:/Users/speed/.gemini/antigravity/scratch/trickcal-pixiv-rank/scraped_namu_chars.html';
    await page.goto(filePath, { waitUntil: 'domcontentloaded' });
    
    const mappings = await page.evaluate(() => {
      // Find all cells (td) that contain text. We want cells that contain a character's name and an image.
      const tds = Array.from(document.querySelectorAll('td'));
      const results = [];
      
      tds.forEach((td, idx) => {
        const text = td.innerText ? td.innerText.trim() : '';
        const imgs = Array.from(td.querySelectorAll('img')).map(img => {
          const attrs = {};
          for (const attr of img.attributes) {
            attrs[attr.name] = attr.value;
          }
          return attrs;
        });
        
        // Let's filter for tds containing names of interest
        if (text.includes('이드') || text.includes('에슈르') || text.includes('스피키')) {
          results.push({
            tdIndex: idx,
            cellText: text,
            images: imgs
          });
        }
      });
      return results;
    });
    
    console.log("Found matches:");
    console.log(JSON.stringify(mappings, null, 2));
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
