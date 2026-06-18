const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  console.log("Locating Eid's lazy-loaded icon in local HTML...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    const filePath = 'file:///C:/Users/speed/.gemini/antigravity/scratch/trickcal-pixiv-rank/scraped_namu_chars.html';
    await page.goto(filePath, { waitUntil: 'domcontentloaded' });
    
    const matchedIcons = await page.evaluate(() => {
      const tds = Array.from(document.querySelectorAll('td, div, span'));
      const results = [];
      
      const getImgAttrs = (img) => {
        if (!img) return null;
        const attrs = {};
        for (const attr of img.attributes) {
          attrs[attr.name] = attr.value;
        }
        return attrs;
      };
      
      for (const td of tds) {
        const text = td.innerText ? td.innerText.trim() : '';
        if (text === '이드' || text === '이드(재활)' || text === '재활 이드') {
          // Check inside
          const imgs = Array.from(td.querySelectorAll('img'));
          imgs.forEach(img => {
            results.push({
              tag: td.tagName,
              text: text,
              attributes: getImgAttrs(img)
            });
          });
          
          // Check parent
          const parent = td.parentElement;
          if (parent) {
            const parentImgs = Array.from(parent.querySelectorAll('img'));
            parentImgs.forEach(img => {
              results.push({
                tag: 'PARENT_' + parent.tagName,
                text: text,
                attributes: getImgAttrs(img)
              });
            });
          }
        }
      }
      return results;
    });
    
    console.log("Matched icons attributes:");
    console.log(JSON.stringify(matchedIcons, null, 2));
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
