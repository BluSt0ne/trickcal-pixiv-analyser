const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Scraping Eid page...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%EC%9D%B4%EB%93%9C(%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%EB%A6%AC%EB%B0%94%EC%9D%B4%EB%B8%8C)';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map(img => ({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || '',
          width: img.width,
          height: img.height
        }));
    });
    
    fs.writeFileSync('eid_page_images.json', JSON.stringify(images, null, 2));
    console.log(`Successfully scraped ${images.length} images from Eid page.`);
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
