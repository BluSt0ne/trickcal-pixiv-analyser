const fs = require('fs');
const html = fs.readFileSync('main_story_page.html', 'utf8');

// Find all matches for headings like "2.3.X" or "시즌 3"
const headings = [];
let match;
const regex = /<(h[1-6])\b[^>]*>(.*?)<\/h[1-6]>/gi;
while ((match = regex.exec(html)) !== null) {
  const text = match[2].replace(/<[^>]*>/g, '').trim();
  if (text.includes('시즌 3') || text.includes('2.3.')) {
    headings.push(text);
  }
}

console.log("Season 3 headings found:");
console.log(headings);
