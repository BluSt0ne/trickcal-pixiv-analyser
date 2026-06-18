const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  console.log("Opening local scraped HTML file...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const filePath = 'file:///C:/Users/speed/.gemini/antigravity/scratch/trickcal-pixiv-rank/scraped_namu_chars.html';
    await page.goto(filePath, { waitUntil: 'domcontentloaded' });
    
    // Find all images on this page that might be character icons
    const icons = await page.evaluate(() => {
      // Find all tables or list items containing name and image
      const results = [];
      const imgs = Array.from(document.querySelectorAll('img'));
      
      imgs.forEach((img, idx) => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        
        if (src.includes('i.namu.wiki') && !src.includes('logo') && !src.includes('skin')) {
          // Find neighboring text (e.g. parent table cell text or next sibling text)
          let parentCell = img.closest('td');
          let text = '';
          if (parentCell) {
            text = parentCell.innerText ? parentCell.innerText.trim() : '';
          }
          
          results.push({
            index: idx,
            src: src,
            alt: alt,
            cellText: text,
            width: img.width,
            height: img.height
          });
        }
      });
      
      return results;
    });
    
    fs.writeFileSync('extracted_icons.json', JSON.stringify(icons, null, 2));
    console.log(`Extracted ${icons.length} icons. Saved to extracted_icons.json`);
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
