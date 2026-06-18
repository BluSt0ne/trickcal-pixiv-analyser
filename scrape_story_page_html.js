const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Scraping Trickcal Story page raw HTML...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%EB%A6%AC%EB%B0%94%EC%9D%B4%EB%B8%8C/%EC%8A%A4%ED%86%A0%EB%A6%AC';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 50000 });
    
    const html = await page.content();
    fs.writeFileSync('story_page.html', html, 'utf8');
    console.log("Successfully saved raw HTML to story_page.html");
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
