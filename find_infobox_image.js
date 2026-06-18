const puppeteer = require('puppeteer');

(async () => {
  console.log("Searching for main infobox image of Eid...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%EC%9D%B4%EB%93%9C(%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%EB%A6%AC%EB%B0%94%EC%9D%B4%EB%B8%8C)';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Let's get the first image within the infobox. Infobox tables usually have class like 'wiki-table' or are the first tables.
    const infoboxImg = await page.evaluate(() => {
      // Find the first table on the page (infobox)
      const tables = document.querySelectorAll('table');
      for (const table of tables) {
        // Look for images inside the table
        const img = table.querySelector('img');
        if (img) {
          const src = img.getAttribute('src');
          // Skip small icons or layout svgs
          if (src && src.includes('i.namu.wiki') && !src.includes('logo') && img.width > 100) {
            return {
              src: src,
              alt: img.getAttribute('alt') || '',
              width: img.width,
              height: img.height
            };
          }
        }
      }
      return null;
    });
    
    console.log("Infobox Image found:");
    console.log(infoboxImg);
    
    // Also let's print the first 5 images on the page that are from i.namu.wiki
    const firstImgs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img'))
        .map(img => ({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || '',
          width: img.width,
          height: img.height
        }))
        .filter(img => img.src && img.src.includes('i.namu.wiki'))
        .slice(0, 15);
    });
    
    console.log("\nFirst 15 images on page:");
    console.log(firstImgs);
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
