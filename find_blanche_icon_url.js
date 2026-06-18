const puppeteer = require('puppeteer');

(async () => {
  console.log("Scraping Blanche page...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%EB%B8%94%EB%9E%91%EC%85%B0';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const candidates = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map(img => ({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || '',
          width: img.width,
          height: img.height
        }))
        .filter(img => {
          const src = img.src || '';
          const alt = img.alt || '';
          return (src.toLowerCase().includes('blanche') || 
                  alt.toLowerCase().includes('blanche') || 
                  src.includes('%EB%B8%94%EB%9E%91%EC%85%B0') || 
                  alt.includes('블랑셰'));
        });
    });
    
    console.log("Matched Blanche candidates:");
    console.log(candidates);
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
