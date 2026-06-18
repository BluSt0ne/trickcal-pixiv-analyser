const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Scraping silver shell page...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%EB%A6%AC%EB%B0%94%EC%9D%B4%EB%B8%8C/%EC%9D%B4%EB%B2%A4%ED%8A%B8/%EC%9D%80%EB%B9%9B%20%EA%BA%B9%EC%A7%88%20%EC%86%8D%EC%9D%98%20%EB%84%88%EC%9D%98%20%EC%A7%84%EC%8B%AC';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Find the first main image (typically the banner inside the wiki table)
    const src = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      // Find image that has "BannerBg" or is inside a table and has a width > 200
      const mainImg = imgs.find(img => {
        const urlStr = img.getAttribute('src') || '';
        return urlStr.includes('namu.wiki') && !urlStr.includes('logo') && !urlStr.includes('skin');
      });
      return mainImg ? mainImg.getAttribute('src') : null;
    });
    
    console.log("Found image src:", src);
    
    if (src) {
      // Update events.json directly for this event
      const events = JSON.parse(fs.readFileSync('public/events.json', 'utf8'));
      let cleanSrc = src;
      if (cleanSrc.startsWith('//')) {
        cleanSrc = 'https:' + cleanSrc;
      }
      
      const updated = events.map(e => {
        if (e.title === '은빛 껍질 속의 너의 진심') {
          return { ...e, banner: cleanSrc };
        }
        return e;
      });
      fs.writeFileSync('public/events.json', JSON.stringify(updated, null, 2));
      console.log("Successfully updated events.json with silver shell banner!");
    }
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
