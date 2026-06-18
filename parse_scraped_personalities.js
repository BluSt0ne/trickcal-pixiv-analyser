const fs = require('fs');

const txt = fs.readFileSync('scraped_namu_chars.txt', 'utf8');

const personalities = ['순수', '냉정', '광기', '활발', '우울'];

const pIndices = personalities.map(p => ({
  name: p,
  index: txt.indexOf(p)
})).sort((a, b) => a.index - b.index);

const blocks = {};
for (let i = 0; i < pIndices.length; i++) {
  const current = pIndices[i];
  if (current.index === -1) continue;
  
  const next = pIndices[i + 1];
  const endIndex = next ? next.index : txt.indexOf('공명');
  
  blocks[current.name] = txt.substring(current.index, endIndex !== -1 ? endIndex : txt.length);
}

const parsedMapping = {};

for (const [pName, blockText] of Object.entries(blocks)) {
  const lines = blockText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line !== pName);
  
  for (const line of lines) {
    // Ignore alternate versions (they contain parenthesis)
    if (line.includes('(')) {
      continue;
    }
    
    let charName = line;
    // Map specific name variations
    if (charName === '시온 더 다크불릿') {
      charName = '시온';
    }
    
    const excludes = ['전열', '중열', '후열', '모든열', '딜러', '탱커', '서포터', '엘다인', '사도 목록'];
    if (!excludes.includes(charName) && charName.match(/^[가-힣\s]{1,15}$/)) {
      parsedMapping[charName] = pName;
    }
  }
}

// Explicitly add special/NPC cases and the only 공명 character
parsedMapping['우로스'] = '공명';

// Write the parsed mapping to a file for comparison
fs.writeFileSync('parsed_namu_personalities.json', JSON.stringify(parsedMapping, null, 2));
console.log("Saved parsed mapping to parsed_namu_personalities.json");
