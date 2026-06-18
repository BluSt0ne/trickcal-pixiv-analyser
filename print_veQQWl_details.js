const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

const match = icons.find(e => e.src && e.src.includes('veQQWl'));

console.log("veQQWl details:");
console.log(JSON.stringify(match, null, 2));
