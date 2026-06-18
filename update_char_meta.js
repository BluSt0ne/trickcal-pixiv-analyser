const fs = require('fs');

const meta = JSON.parse(fs.readFileSync('public/char_meta.json', 'utf8'));
const parsed = JSON.parse(fs.readFileSync('parsed_namu_personalities.json', 'utf8'));
const history = JSON.parse(fs.readFileSync('public/historical_data.json', 'utf8'));

// Build list of all characters from historical_data.json
const allChars = new Set();
history.forEach(day => {
  Object.keys(day.data).forEach(c => allChars.add(c));
});

// Rebuild the members lists
const newPersonalities = {
  "순수": { "color": "#4CAF50", "members": [] },
  "냉정": { "color": "#2196F3", "members": [] },
  "광기": { "color": "#F44336", "members": [] },
  "활발": { "color": "#FF9800", "members": [] },
  "우울": { "color": "#9C27B0", "members": [] },
  "공명": { "color": "#FFEB3B", "members": [] }
};

for (const char of allChars) {
  // Find current personality if any
  let currentP = null;
  for (const [pName, pData] of Object.entries(meta.personalities)) {
    if (pData.members.includes(char)) {
      currentP = pName;
      break;
    }
  }
  
  // Decide target personality
  let targetP = parsed[char];
  if (!targetP) {
    if (char === '마에스트로 2호') {
      targetP = '공명';
    } else {
      // Fallback
      targetP = currentP || '공명';
    }
  }
  
  newPersonalities[targetP].members.push(char);
}

// Sort members
for (const pName of Object.keys(newPersonalities)) {
  newPersonalities[pName].members.sort();
}

const newMeta = {
  personalities: newPersonalities,
  iconMap: meta.iconMap
};

fs.writeFileSync('public/char_meta.json', JSON.stringify(newMeta, null, 2));
console.log("Successfully rebuilt char_meta.json with history characters!");
