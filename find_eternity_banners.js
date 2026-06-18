const fs = require('fs');
const html = fs.readFileSync('story_page.html', 'utf8');

const sections = [
  { name: '스스로 선택한 어둠의 길', id: 's-9.3', nextId: 'id="s-9.4"' },
  { name: '영원을 꿈꾸는 전기양', id: 's-9.4', nextId: 'id="s-9.5"' },
  { name: '맺혀 떨어진 기억의 연못', id: 's-9.5', nextId: 'id="s-9.6"' },
  { name: '낙원을 향한 바느질', id: 's-9.6', nextId: 'id="s-9.7"' },
  { name: '얼어붙은 너의 이름 위에', id: 's-9.7', nextId: 'id="s-10"' }
];

sections.forEach(s => {
  console.log(`\n=================== SECTION: ${s.name} ===================`);
  const startIdx = html.indexOf(`id="${s.id}"`);
  if (startIdx === -1) {
    console.log(`Start ID "${s.id}" not found`);
    return;
  }
  
  let endIdx = html.indexOf(s.nextId, startIdx);
  if (endIdx === -1) {
    endIdx = html.indexOf('h3', startIdx);
  }
  
  const content = html.substring(startIdx, endIdx);
  const regex = /<img[^>]+>/g;
  let match;
  const seen = new Set();
  
  while ((match = regex.exec(content)) !== null) {
    const img = match[0];
    if (img.includes('namu.wiki') && !img.includes('국기') && !img.includes('지도') && !img.includes('yXhIagatzXt') && !img.includes('ErN6wXF7ps')) {
      // Extract data-src or src URL
      const urlMatch = img.match(/src="([^"]+)"/) || img.match(/data-src="([^"]+)"/);
      if (urlMatch) {
        let url = urlMatch[1];
        if (url.startsWith('//')) {
          url = 'https:' + url;
        }
        if (!seen.has(url)) {
          seen.add(url);
          console.log(`  - URL: ${url}`);
          // Print alt text
          const altMatch = img.match(/alt="([^"]+)"/);
          if (altMatch) {
            console.log(`    Alt: ${altMatch[1]}`);
          }
        }
      }
    }
  }
});
