const fs = require('fs');

async function testQuery(name) {
  const query = encodeURIComponent(name);
  const url = `https://www.pixiv.net/ajax/search/artworks/${query}?word=${query}&s_mode=s_tag_full`;
  console.log(`Searching for "${name}" -> ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    if (!res.ok) {
      console.log(`Failed with status: ${res.status}`);
      return;
    }
    const data = await res.json();
    const total = data?.body?.illustManga?.total || 0;
    console.log(`Total count for "${name}": ${total}`);
  } catch(e) {
    console.error(`Error searching for ${name}:`, e);
  }
}

async function main() {
  await testQuery("트릭컬 레비");
  await testQuery("레비(트릭컬 리바이브)");
  await testQuery("레비(트릭컬)");
}

main();
