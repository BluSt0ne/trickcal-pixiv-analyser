const puppeteer = require('puppeteer');

(async () => {
  console.log("Extracting images from the first table (infobox)...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%EC%9D%B4%EB%93%9C(%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%EB%A6%AC%EB%B0%94%EC%9D%B4%EB%B8%8C)';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const tableImages = await page.evaluate(() => {
      // Find the first table on the page
      const firstTable = document.querySelector('table');
      if (!firstTable) return [];
      
      // Get all cells inside this table
      const cells = Array.from(firstTable.querySelectorAll('td'));
      
      const result = [];
      cells.forEach((td, cellIdx) => {
        const text = td.innerText ? td.innerText.trim() : '';
        const imgs = Array.from(td.querySelectorAll('img')).map(img => ({
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || '',
          width: img.width,
          height: img.height
        }));
        
        if (imgs.length > 0) {
          result.push({
            cellIndex: cellIdx,
            cellText: text,
            images: imgs
          });
        }
      });
      return result;
    });
    
    console.log("Images found in the first table cells:");
    console.log(JSON.stringify(tableImages, null, 2));
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
