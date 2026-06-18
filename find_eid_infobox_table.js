const puppeteer = require('puppeteer');

(async () => {
  console.log("Searching for character infobox table on Eid's page...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%EC%9D%B4%EB%93%9C(%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%EB%A6%AC%EB%B0%94%EC%9D%B4%EB%B8%8C)';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    const matchedTables = await page.evaluate(() => {
      const tables = Array.from(document.querySelectorAll('table'));
      const results = [];
      
      tables.forEach((table, idx) => {
        const html = table.innerHTML || '';
        const text = table.innerText || '';
        
        // The infobox table for Eid should contain '냉정' (personality) and '이드' (name) and probably '사도' or '성우' (voice actor)
        if (text.includes('이드') && text.includes('냉정') && (text.includes('출시') || text.includes('성우') || text.includes('클래스'))) {
          // Get all images in this table
          const imgs = Array.from(table.querySelectorAll('img')).map(img => ({
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt') || '',
            width: img.width,
            height: img.height
          }));
          
          results.push({
            tableIndex: idx,
            textSnippet: text.substring(0, 200),
            images: imgs
          });
        }
      });
      
      return results;
    });
    
    console.log("Matched Tables count:", matchedTables.length);
    console.log(JSON.stringify(matchedTables, null, 2));
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
