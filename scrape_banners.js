const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Starting banner scrape...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%ED%8B%80:%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%ED%85%8C%EB%A7%88%20%EA%B7%B9%EC%9E%A5';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Expand folding
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent && (el.textContent.includes('펼치기') || el.textContent.includes('접기'))) {
          if (typeof el.click === 'function') {
            try { el.click(); } catch(e) {}
          }
        }
      }
    });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Extract image elements and their surrounding details
    const data = await page.evaluate(() => {
      const results = [];
      const imgs = Array.from(document.querySelectorAll('img'));
      for (const img of imgs) {
        // Find nearest text or anchor text
        let parent = img.parentElement;
        let contextText = '';
        let anchorHref = '';
        
        // Walk up to 4 levels to find text/links
        for (let i = 0; i < 4; i++) {
          if (!parent) break;
          if (parent.tagName === 'A') {
            anchorHref = parent.getAttribute('href');
          }
          if (parent.textContent && parent.textContent.trim().length > 0 && parent.textContent.trim().length < 100) {
            contextText = parent.textContent.trim();
          }
          parent = parent.parentElement;
        }
        
        results.push({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || '',
          contextText,
          anchorHref
        });
      }
      return results;
    });
    
    fs.writeFileSync('scraped_banners.json', JSON.stringify(data, null, 2));
    console.log(`Saved ${data.length} scraped image candidate records to scraped_banners.json`);
    
  } catch (error) {
    console.error("Error scraping banners:", error);
  } finally {
    await browser.close();
  }
})();
