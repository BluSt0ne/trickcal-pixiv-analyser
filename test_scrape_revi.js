const fs = require('fs');

async function main() {
  const name = "레비";
  const query = encodeURIComponent(`트릭컬 ${name}`);
  const url = `https://www.pixiv.net/ajax/search/artworks/${query}?word=${query}&s_mode=s_tag_full&p=1`;
  
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    if (!res.ok) {
      console.log(`HTTP Error: ${res.status}`);
      return;
    }
    const data = await res.json();
    const artworks = data?.body?.illustManga?.data || [];
    const total = data?.body?.illustManga?.total || 0;
    console.log(`Total count reported: ${total}`);
    console.log(`Artworks array length on page 1: ${artworks.length}`);
    
    if (artworks.length > 0) {
      console.log("Sample artwork keys:", Object.keys(artworks[0]));
      console.log("Sample artwork title:", artworks[0].title);
      console.log("Sample artwork createDate:", artworks[0].createDate);
      console.log("Sample artwork updateDate:", artworks[0].updateDate);
    } else {
      console.log("No artworks returned in data array.");
      console.log("Full body keys:", Object.keys(data?.body || {}));
      console.log("IllustManga keys:", Object.keys(data?.body?.illustManga || {}));
    }
  } catch(e) {
    console.error("Error:", e);
  }
}

main();
