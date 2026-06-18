const fs = require('fs');

const charMeta = JSON.parse(fs.readFileSync('public/char_meta.json', 'utf8'));
const iconMap = JSON.parse(fs.readFileSync('public/icon_map.json', 'utf8'));
const extracted = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

console.log("Analyzing mappings against extracted namu.wiki icons...\n");

function findAlt(url) {
  if (!url) return "N/A";
  // Extract hash from URL
  const match = url.match(/\/i\/([^\.]+)/);
  if (!match) return "Unknown URL format";
  const hash = match[1];
  
  // Find in extracted
  const found = extracted.find(e => e.src && e.src.includes(hash));
  if (found) {
    return `alt="${found.alt}" (cellText="${found.cellText.substring(0, 40).replace(/\n/g, ' ')}")`;
  }
  return "Not found in character list page";
}

console.log("=== char_meta.json iconMap ===");
for (const [name, url] of Object.entries(charMeta.iconMap)) {
  if (name === '이드' || name === '에슈르' || name === '스피키' || name === '블랑셰') {
    console.log(`${name}:`);
    console.log(`  URL: ${url}`);
    console.log(`  Namu: ${findAlt(url)}`);
  }
}

console.log("\n=== icon_map.json ===");
for (const [name, url] of Object.entries(iconMap)) {
  if (name === '이드' || name === '에슈르' || name === '스피키' || name === '블랑셰') {
    console.log(`${name}:`);
    console.log(`  URL: ${url}`);
    console.log(`  Namu: ${findAlt(url)}`);
  }
}
