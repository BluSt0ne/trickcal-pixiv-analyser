const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Scraping Blanche icon...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%EB%B8%94%EB%9E%91%EC%85%B0';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const imgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => ({
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
        width: img.width,
        height: img.height
      }));
    });
    
    console.log("Found images on Blanche page:");
    console.log(imgs);
    
    // Look for the icon. The face icon on namu.wiki is typically smaller (e.g. 50x50, 100x100, or has "icon" or "face" or "볼따구" or "Blanche" in alt text).
    // Or it might be the only WebP image that is square.
    // Let's filter candidates
    const candidates = imgs.filter(img => {
      const src = img.src || '';
      return src.includes('i.namu.wiki') && !src.includes('logo') && !src.includes('skin');
    });
    
    console.log("\nCandidates:");
    console.log(candidates);
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
