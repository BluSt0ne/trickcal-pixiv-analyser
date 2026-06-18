/**
 * scrape_fast.js — 검수 없이 dataset/ 에 직접 저장하는 빠른 스크래퍼
 * 
 * 사용법:
 *   node ml/scrape_fast.js [목표장수=200]
 * 
 * 기존 download_history.json 과 완전히 호환됩니다.
 * 이미 dataset/ 에 있는 파일은 skip 합니다.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.pixiv.net/'
      }
    });
    if (!res.ok) {
      console.error(`      ❌ HTTP ${res.status}: ${url}`);
      return false;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`      ❌ 다운로드 실패: ${err.message}`);
    return false;
  }
}

function getMasterUrl(thumbUrl) {
  if (!thumbUrl) return null;
  const idx = thumbUrl.indexOf('img-master/');
  if (idx === -1) return thumbUrl;
  const pathPart = thumbUrl.substring(idx);
  const masterPath = pathPart.replace('_square1200', '_master1200');
  return `https://i.pximg.net/${masterPath}`;
}

async function main() {
  const TARGET_PER_CHAR = parseInt(process.argv[2]) || 200;
  console.log(`=== Trickcal Fast Scraper (Target: ${TARGET_PER_CHAR} images/char, direct to dataset/) ===`);

  if (!process.env.PIXIV_COOKIE) {
    console.warn('⚠️  PIXIV_COOKIE 없음. 제한된 결과만 나올 수 있습니다.');
  } else {
    console.log('✅ PIXIV_COOKIE 사용 중');
  }

  const jNamesMapPath = path.join(__dirname, '..', 'public', 'japanese_names.json');
  const jNamesMap = JSON.parse(fs.readFileSync(jNamesMapPath, 'utf8'));
  const datasetDir = path.join(__dirname, '..', 'dataset');

  // Build set of already-downloaded artwork IDs from dataset/
  console.log('\n📂 기존 dataset 파일 스캔 중...');
  const globalDownloaded = new Set();
  for (const charName of Object.keys(jNamesMap)) {
    const charDir = path.join(datasetDir, charName);
    if (fs.existsSync(charDir)) {
      for (const f of fs.readdirSync(charDir)) {
        if (/\.(jpg|jpeg|png)$/i.test(f)) {
          globalDownloaded.add(path.basename(f, path.extname(f)));
        }
      }
    }
  }
  console.log(`   → 기존 이미지 ID 수: ${globalDownloaded.size}`);

  // Build blacklist from download_history.json (deleted entries)
  const histPath = path.join(__dirname, 'download_history.json');
  const blacklist = new Set();
  if (fs.existsSync(histPath)) {
    try {
      const hist = JSON.parse(fs.readFileSync(histPath, 'utf8'));
      // New format: { charName: { artworkId: 'deleted'|'downloaded' } }
      for (const [charName, entries] of Object.entries(hist)) {
        if (typeof entries === 'object' && entries !== null) {
          for (const [artId, status] of Object.entries(entries)) {
            if (status === 'deleted') blacklist.add(artId);
          }
        }
      }
      console.log(`   → 블랙리스트 수: ${blacklist.size}`);
    } catch (e) {
      console.warn('   ⚠️  download_history.json 파싱 실패, 무시합니다.');
    }
  }

  const charNames = Object.keys(jNamesMap);
  let totalNew = 0;
  let skipped = 0;

  for (let ci = 0; ci < charNames.length; ci++) {
    const name = charNames[ci];
    const charDir = path.join(datasetDir, name);

    // Count existing images
    let existing = 0;
    if (fs.existsSync(charDir)) {
      existing = fs.readdirSync(charDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f)).length;
    }

    if (existing >= TARGET_PER_CHAR) {
      skipped++;
      process.stdout.write(`[${ci+1}/${charNames.length}] ${name}: ${existing}장 (skip)\n`);
      continue;
    }

    const needed = TARGET_PER_CHAR - existing;
    console.log(`\n[${ci+1}/${charNames.length}] ${name}: 현재 ${existing}장 → ${needed}장 추가 필요`);

    if (!fs.existsSync(charDir)) fs.mkdirSync(charDir, { recursive: true });

    const jNames = jNamesMap[name] || [];
    const searchTerms = [name, ...jNames];
    let downloadedThisChar = 0;

    for (const term of searchTerms) {
      if (downloadedThisChar >= needed) break;

      let page = 1;
      let hasMore = true;
      const prefix = term === name ? '트릭컬' : 'トリッカル';

      while (hasMore && downloadedThisChar < needed) {
        const query = encodeURIComponent(`${prefix} ${term}`);
        const url = `https://www.pixiv.net/ajax/search/artworks/${query}?word=${query}&s_mode=s_tag_full&p=${page}`;

        try {
          const res = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Cookie': process.env.PIXIV_COOKIE || ''
            }
          });

          if (!res.ok) { hasMore = false; break; }

          const data = await res.json();
          if (data.error) { hasMore = false; break; }

          const artworks = data.body?.illustManga?.data || [];
          const total = data.body?.illustManga?.total || 0;
          const maxPage = Math.ceil(total / 60);

          console.log(`  "트리:${term}" p${page} → ${artworks.length}개 (총 ${total})`);

          if (artworks.length === 0 || page >= maxPage) hasMore = false;

          for (const art of artworks) {
            if (downloadedThisChar >= needed) break;

            // Skip if already in dataset or blacklisted
            if (globalDownloaded.has(String(art.id)) || blacklist.has(String(art.id))) continue;

            // Skip AI-generated
            if (art.aiType === 2) continue;

            const masterUrl = getMasterUrl(art.url);
            if (!masterUrl) continue;

            const ext = path.extname(new URL(masterUrl).pathname) || '.jpg';
            const destPath = path.join(charDir, `${art.id}${ext}`);

            process.stdout.write(`    [${downloadedThisChar+1}/${needed}] ID:${art.id} ... `);
            const ok = await downloadImage(masterUrl, destPath);
            if (ok) {
              downloadedThisChar++;
              totalNew++;
              globalDownloaded.add(String(art.id));
              process.stdout.write(`✅\n`);
              await sleep(1200);
            } else {
              process.stdout.write(`❌\n`);
            }
          }

          page++;
          if (page <= maxPage) await sleep(1500);

        } catch (err) {
          console.error(`  ❌ 검색 오류: ${err.message}`);
          hasMore = false;
        }
      }
    }

    console.log(`  → ${name} 완료: +${downloadedThisChar}장 (누적: ${totalNew}장)`);
    await sleep(1500);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`스크래핑 완료!`);
  console.log(`  신규 다운로드: ${totalNew}장`);
  console.log(`  목표 이미 달성하여 스킵: ${skipped}개 캐릭터`);
  console.log(`${'='.repeat(60)}`);
}

main();
