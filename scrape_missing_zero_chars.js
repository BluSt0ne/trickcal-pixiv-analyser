const fs = require('fs');
const path = require('path');
require('C:\\Users\\speed\\.gemini\\antigravity\\scratch\\trickcal-pixiv-rank\\node_modules\\dotenv').config();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Helper to check if we are currently rate-limited by querying a popular character (Erpin)
async function checkRateLimit() {
  const query = encodeURIComponent('트릭컬 에르핀');
  const url = `https://www.pixiv.net/ajax/search/artworks/${query}?word=${query}&s_mode=s_tag_full&p=1`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': process.env.PIXIV_COOKIE || ''
      }
    });
    if (!res.ok) return true;
    const data = await res.json();
    const total = data?.body?.illustManga?.total || 0;
    return total === 0; // If Erpin returns 0, we are rate-limited!
  } catch (e) {
    return true; // Assume rate-limited on error
  }
}

async function main() {
  console.log("Starting scrape for missing zero-count characters with rate-limit protection...");

  const historyPath = path.join(__dirname, 'public', 'historical_data.json');
  const jNamesMapPath = path.join(__dirname, 'public', 'japanese_names.json');
  
  if (!fs.existsSync(historyPath)) {
    console.error("historical_data.json not found!");
    process.exit(1);
  }
  
  const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
  const jNamesMap = JSON.parse(fs.readFileSync(jNamesMapPath, 'utf8'));
  
  // Find characters that currently have 0 count in the latest entry
  const latestEntry = history[history.length - 1];
  const zeroChars = Object.entries(latestEntry.data)
    .filter(([name, count]) => count === 0 && name !== '마에스트로 2호') // Exclude Maestro 2 as it is verified 0
    .map(([name]) => name);
    
  console.log(`Identified ${zeroChars.length} characters with 0 counts:`, zeroChars.join(', '));
  
  const dailyDeltas = {};
  
  for (const name of zeroChars) {
    console.log(`\n[${name}] Scraping...`);
    dailyDeltas[name] = {};
    
    const jNames = jNamesMap[name] || [];
    const searchTerms = [name, ...jNames];
    const seenArtworks = new Set();
    
    for (const term of searchTerms) {
      console.log(`  - [${name}] Subtag "${term}" starting...`);
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const query = encodeURIComponent(`트릭컬 ${term}`);
        const url = `https://www.pixiv.net/ajax/search/artworks/${query}?word=${query}&s_mode=s_tag_full&p=${page}`;
        
        try {
          console.log(`    - Page ${page}...`);
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': process.env.PIXIV_COOKIE || ''
            }
          });
          
          if (!res.ok) {
            console.error(`    ❌ HTTP error ${res.status}. Sleeping 1 minute...`);
            await sleep(60000);
            continue;
          }
          
          const data = await res.json();
          if (data?.error || !data?.body) {
            console.error(`    ❌ Pixiv API error: ${data?.message || 'body is missing'}. Sleeping 1 minute...`);
            await sleep(60000);
            continue;
          }
          
          const artworks = data.body.illustManga.data || [];
          const total = data.body.illustManga.total || 0;
          const maxPage = Math.ceil(total / 60);
          
          // Rate limit check: if page 1 returns 0 results, verify if we are rate-limited
          if (page === 1 && artworks.length === 0 && total === 0) {
            console.log(`    ⚠️ Received 0 results. Checking if rate-limited...`);
            const isBlocked = await checkRateLimit();
            if (isBlocked) {
              console.log(`    🚫 Rate limit detected! Sleeping 2 minutes to recover...`);
              await sleep(120000);
              continue; // Retry this page
            } else {
              console.log(`    ✅ Confirmed 0 actual results for "${term}".`);
              hasMore = false;
              break;
            }
          }
          
          if (artworks.length === 0 || page >= maxPage) {
            hasMore = false;
          }
          
          for (const art of artworks) {
            if (seenArtworks.has(art.id)) continue;
            seenArtworks.add(art.id);
            
            const createDate = art.createDate;
            if (createDate) {
              const day = createDate.substring(0, 10);
              if (!dailyDeltas[name][day]) {
                dailyDeltas[name][day] = 0;
              }
              dailyDeltas[name][day]++;
            }
          }
          
          page++;
        } catch (err) {
          console.error(`    ❌ Fetch error:`, err.message);
          await sleep(5000);
        }
        
        await sleep(2000); // 2s delay between pages to prevent triggering rate limits
      }
    }
    
    const totalScraped = Object.values(dailyDeltas[name]).reduce((a, b) => a + b, 0);
    console.log(`[${name}] Done. Total artworks found: ${totalScraped}`);
  }
  
  console.log("\nAll missing characters scraped. Merging into historical_data.json...");
  
  for (const name of zeroChars) {
    const charDeltas = dailyDeltas[name] || {};
    const deltaDates = Object.keys(charDeltas).sort();
    
    let deltaIdx = 0;
    let cumulative = 0;
    
    for (let i = 0; i < history.length; i++) {
      const currentDate = history[i].date;
      while (deltaIdx < deltaDates.length && deltaDates[deltaIdx] <= currentDate) {
        cumulative += charDeltas[deltaDates[deltaIdx]];
        deltaIdx++;
      }
      history[i].data[name] = cumulative;
    }
    
    console.log(`Merged [${name}]. Final count on ${history[history.length - 1].date}: ${cumulative}`);
  }
  
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  console.log("Successfully updated public/historical_data.json!");
}

main();
