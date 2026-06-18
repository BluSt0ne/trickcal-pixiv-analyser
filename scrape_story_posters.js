const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Scraping Trickcal Story page...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%EB%A6%AC%EB%B0%94%EC%9D%B4%EB%B8%8C/%EC%8A%A4%ED%86%A0%EB%A6%AC';
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 40000 });
    
    // Scrape all images with their alt, src and text around them
    const images = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img')).map(img => {
        // Find parent table or text container
        let parentText = '';
        let parent = img.parentElement;
        for (let i = 0; i < 5 && parent; i++) {
          parentText += parent.innerText || '';
          parent = parent.parentElement;
        }
        return {
          src: img.getAttribute('src'),
          alt: img.getAttribute('alt') || '',
          width: img.width,
          height: img.height,
          context: parentText.substring(0, 500)
        };
      });
    });
    
    fs.writeFileSync('story_page_images.json', JSON.stringify(images, null, 2));
    console.log(`Successfully scraped ${images.length} images from Trickcal Story page.`);
    
  } catch(e) {
    console.error("Error:", e);
  } finally {
    await browser.close();
  }
})();
