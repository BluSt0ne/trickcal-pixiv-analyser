const fs = require('fs');

const meta = JSON.parse(fs.readFileSync('public/char_meta.json', 'utf8'));
const parsed = JSON.parse(fs.readFileSync('parsed_namu_personalities.json', 'utf8'));

// Build reverse map of current personalities
const currentMap = {};
for (const [pName, pData] of Object.entries(meta.personalities)) {
  for (const member of pData.members) {
    currentMap[member] = pName;
  }
}

const mismatches = [];
const missingInNamu = [];

for (const [name, currentP] of Object.entries(currentMap)) {
  const scrapedP = parsed[name];
  if (scrapedP) {
    if (scrapedP !== currentP) {
      mismatches.push({ name, current: currentP, scraped: scrapedP });
    }
  } else {
    missingInNamu.push({ name, current: currentP });
  }
}

console.log("=== MISMATCHES (Current vs Namu.wiki) ===");
console.log(mismatches);

console.log("\n=== MISSING IN NAMU.WIKI PARSED (NPCs or names that didn't match/differ) ===");
console.log(missingInNamu);
