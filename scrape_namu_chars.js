const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  console.log("Starting scrape...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set User-Agent to avoid simple bot detection
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
  try {
    const url = 'https://namu.wiki/w/%ED%8A%B8%EB%A6%AD%EC%BB%AC%20%EB%A6%AC%EB%B0%94%EC%9D%B4%EB%B8%8C/%EC%BA%90%EB%A6%AD%ED%84%B0';
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log("Expanding folding elements...");
    await page.evaluate(() => {
      // Find and click all fold/unfold elements
      const elements = Array.from(document.querySelectorAll('*'));
      for (const el of elements) {
        if (el.textContent && (el.textContent.includes('펼치기') || el.textContent.includes('접기'))) {
          // If it's a clickable element or button, click it
          if (typeof el.click === 'function') {
            try { el.click(); } catch(e) {}
          }
        }
      }
    });
    
    // Give it a moment to expand
    await new Promise(r => setTimeout(r, 2000));

    console.log("Looking for '성격별' button/tab and clicking it...");
    const clickedTab = await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('a'))
        .find(e => e.textContent && e.textContent.includes('성격별'));
      if (el) {
        try {
          el.click();
          return true;
        } catch(e) {
          return 'error: ' + e.message;
        }
      }
      return false;
    });
    console.log("Click result for '성격별':", clickedTab);

    // Wait for tab transition
    await new Promise(r => setTimeout(r, 2000));

    // Get the HTML content
    const content = await page.content();
    fs.writeFileSync('scraped_namu_chars.html', content);
    console.log("Saved HTML to scraped_namu_chars.html");
    
    // Also extract clean text
    const textContent = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('scraped_namu_chars.txt', textContent);
    console.log("Saved clean text to scraped_namu_chars.txt");

  } catch (error) {
    console.error("Error scraping:", error);
  } finally {
    await browser.close();
  }
})();
