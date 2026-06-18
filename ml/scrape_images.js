const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// Helper to download an image with Pixiv referer headers
async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.pixiv.net/'
      }
    });

    if (!res.ok) {
      console.error(`      ❌ Failed to download image (HTTP ${res.status}): ${url}`);
      return false;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`      ❌ Error downloading image ${url}:`, err.message);
    return false;
  }
}

// Convert search thumbnail URL to master1200 URL (full aspect ratio, high res)
function getMasterUrl(thumbUrl) {
  if (!thumbUrl) return null;
  const idx = thumbUrl.indexOf('img-master/');
  if (idx === -1) return thumbUrl; // Return original if not in expected format
  const pathPart = thumbUrl.substring(idx);
  const masterPath = pathPart.replace('_square1200', '_master1200');
  return `https://i.pximg.net/${masterPath}`;
}

async function main() {
  const limit = parseInt(process.argv[2]) || 100; // Number of images per character target
  console.log(`===================================================`);
  console.log(`Starting Pixiv Image Downloader (Target: '검수필요' folder)`);
  console.log(`Target Limit: ${limit} images total per character (dataset + 검수필요)`);
  console.log(`===================================================`);

  const jNamesMapPath = path.join(__dirname, '..', 'public', 'japanese_names.json');
  if (!fs.existsSync(jNamesMapPath)) {
    console.error(`❌ Missing public/japanese_names.json`);
    process.exit(1);
  }

  const jNamesMap = JSON.parse(fs.readFileSync(jNamesMapPath, 'utf8'));
  let charNames = Object.keys(jNamesMap);

  const filterNames = process.argv.slice(3);
  if (filterNames.length > 0) {
    charNames = charNames.filter(name => filterNames.includes(name));
    console.log(`Filtering search to specific characters: ${charNames.join(', ')}`);
  }
  
  const datasetDir = path.join(__dirname, '..', 'dataset');
  const needVerifyDir = path.join(__dirname, '..', '검수필요');

  if (!fs.existsSync(needVerifyDir)) {
    fs.mkdirSync(needVerifyDir, { recursive: true });
  }

  if (process.env.PIXIV_COOKIE) {
    console.log("✅ PIXIV_COOKIE detected. Using authenticated search.");
  } else {
    console.log("⚠️ No PIXIV_COOKIE detected. Search results may be limited.");
  }

  // Load download history / blacklist
  const historyPath = path.join(__dirname, 'download_history.json');
  let downloadHistory = {};
  if (fs.existsSync(historyPath)) {
    try {
      downloadHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (e) {
      console.error("⚠️ Failed to parse download_history.json, starting fresh.", e.message);
    }
  }

  // Synchronize history with both 'dataset' (verified) and '검수필요' (unverified) directories
  console.log("\nSynchronizing download history with files in dataset/ and 검수필요/ ...");
  for (const name of charNames) {
    if (!downloadHistory[name]) {
      downloadHistory[name] = {};
    }

    const charDirVerified = path.join(datasetDir, name);
    const charDirUnverified = path.join(needVerifyDir, name);

    const currentIds = new Set();

    // Scan dataset (verified) folder
    if (fs.existsSync(charDirVerified)) {
      const files = fs.readdirSync(charDirVerified).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
      for (const f of files) {
        currentIds.add(path.basename(f, path.extname(f)));
      }
    }

    // Scan 검수필요 (unverified) folder
    if (fs.existsSync(charDirUnverified)) {
      const files = fs.readdirSync(charDirUnverified).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
      for (const f of files) {
        currentIds.add(path.basename(f, path.extname(f)));
      }
    }

    // 1. Mark files that exist in either directory as 'downloaded' in history
    for (const id of currentIds) {
      downloadHistory[name][id] = 'downloaded';
    }

    // 2. Identify files that were 'downloaded' in history but are now missing (manually deleted)
    for (const id of Object.keys(downloadHistory[name])) {
      if (downloadHistory[name][id] === 'downloaded' && !currentIds.has(id)) {
        downloadHistory[name][id] = 'deleted';
        console.log(`  -> Detected manual deletion for "${name}" image ID: ${id}. Added to blacklist.`);
      }
    }
  }
  fs.writeFileSync(historyPath, JSON.stringify(downloadHistory, null, 2));
  console.log("Sync complete! Saved to ml/download_history.json\n");

  for (let i = 0; i < charNames.length; i++) {
    const name = charNames[i];
    console.log(`\n[${i + 1}/${charNames.length}] Processing character: "${name}"...`);

    const charDirVerified = path.join(datasetDir, name);
    const charDirUnverified = path.join(needVerifyDir, name);

    // Count how many verified images we have in dataset/
    let verifiedCount = 0;
    if (fs.existsSync(charDirVerified)) {
      verifiedCount = fs.readdirSync(charDirVerified).filter(f => f.match(/\.(jpg|jpeg|png)$/i)).length;
    }

    // Count how many unverified images we already have in 검수필요/
    let unverifiedCount = 0;
    if (fs.existsSync(charDirUnverified)) {
      unverifiedCount = fs.readdirSync(charDirUnverified).filter(f => f.match(/\.(jpg|jpeg|png)$/i)).length;
    }

    const currentTotal = verifiedCount + unverifiedCount;
    if (currentTotal >= limit) {
      console.log(`  -> Already have ${currentTotal} images total (Verified: ${verifiedCount}, Unverified: ${unverifiedCount}, which is >= ${limit}). Skipping.`);
      continue;
    }

    const needed = (limit + 15) - currentTotal;
    console.log(`  -> Total: ${currentTotal} (Verified: ${verifiedCount}, Unverified: ${unverifiedCount}). Target raised to ${limit + 15}. Downloading ${needed} new images into '검수필요/${name}'...`);

    if (!fs.existsSync(charDirUnverified)) {
      fs.mkdirSync(charDirUnverified, { recursive: true });
    }

    // Search query terms
    const jNames = jNamesMap[name] || [];
    const searchTerms = [name, ...jNames];
    let downloadedCount = 0;
    const charHistory = downloadHistory[name];

    for (const term of searchTerms) {
      if (downloadedCount >= needed) break;

      let page = 1;
      let hasMore = true;
      const prefix = term === name ? "트릭컬" : "トリッカル";

      while (hasMore && downloadedCount < needed) {
        console.log(`  - Searching with tag: "${prefix} ${term}" (Page ${page})...`);
        const query = encodeURIComponent(`${prefix} ${term}`);
        const url = `https://www.pixiv.net/ajax/search/artworks/${query}?word=${query}&s_mode=s_tag_full&p=${page}`;

        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': process.env.PIXIV_COOKIE || ''
            }
          });

          if (!res.ok) {
            console.error(`    ❌ Search failed (HTTP ${res.status}) for term "${term}" page ${page}.`);
            hasMore = false;
            break;
          }

          const data = await res.json();
          if (data.error) {
            console.error(`    ❌ Pixiv API error: ${data.message}`);
            hasMore = false;
            break;
          }

          const artworks = data.body?.illustManga?.data || [];
          const total = data.body?.illustManga?.total || 0;
          const maxPage = Math.ceil(total / 60);

          console.log(`    Found ${artworks.length} artworks on page ${page} (Total: ${total}).`);

          if (artworks.length === 0 || page >= maxPage) {
            hasMore = false;
          }

          for (const art of artworks) {
            if (downloadedCount >= needed) break;

            // Skip if already downloaded or manually deleted (blacklisted)
            const status = charHistory[art.id];
            if (status === 'downloaded' || status === 'deleted') {
              continue;
            }

            // Skip AI-generated
            if (art.aiType === 2) {
              continue;
            }

            const masterUrl = getMasterUrl(art.url);
            if (!masterUrl) continue;

            const ext = path.extname(new URL(masterUrl).pathname) || '.jpg';
            const destPath = path.join(charDirUnverified, `${art.id}${ext}`);

            console.log(`    [${downloadedCount + 1}/${needed}] Downloading image ID ${art.id}...`);
            const success = await downloadImage(masterUrl, destPath);

            if (success) {
              downloadedCount++;
              charHistory[art.id] = 'downloaded';
              fs.writeFileSync(historyPath, JSON.stringify(downloadHistory, null, 2));
              await sleep(1500); // 1.5s delay
            }
          }

          page++;
          await sleep(2000); // 2s delay between pages

        } catch (err) {
          console.error(`    ❌ Error searching for term "${term}" page ${page}:`, err.message);
          hasMore = false;
        }
      }
    }

    console.log(`  -> Finished "${name}". Total downloaded this session: ${downloadedCount}`);
    if (fs.existsSync(charDirUnverified)) {
      const files = fs.readdirSync(charDirUnverified);
      if (files.length === 0) {
        fs.rmdirSync(charDirUnverified);
      }
    }
    await sleep(2000); // 2s delay between characters
  }

  // Clean up parent directory if empty
  try {
    if (fs.existsSync(needVerifyDir) && fs.readdirSync(needVerifyDir).length === 0) {
      fs.rmdirSync(needVerifyDir);
    }
  } catch (e) {
    // Ignore error
  }

  console.log(`\n===================================================`);
  console.log(`Pixiv Image Downloader Complete!`);
  console.log(`===================================================`);
}

main();
