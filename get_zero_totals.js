const fs = require('fs');

const zeroChars = [
  '힐데',   '리온',
  '요미',   '샤샤',
  '포셔',   '아사나',
  '페스타', '우로스',
  '키디언', '레비',
  '에슈르', '프리클',
  '빅우드', '영춘',
  '교주',   '겨우살이',
  '골디',   '냉장고',
  '니펠',   '마에스트로 2호'
];

async function testQuery(name) {
  const query = encodeURIComponent(`트릭컬 ${name}`);
  const url = `https://www.pixiv.net/ajax/search/artworks/${query}?word=${query}&s_mode=s_tag_full`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    if (!res.ok) return { name, total: -1 };
    const data = await res.json();
    const total = data?.body?.illustManga?.total || 0;
    return { name, total };
  } catch(e) {
    return { name, total: -2 };
  }
}

async function main() {
  const results = [];
  for (const name of zeroChars) {
    const res = await testQuery(name);
    console.log(`${name}: ${res.total}`);
    results.push(res);
    await new Promise(r => setTimeout(r, 300));
  }
}

main();
