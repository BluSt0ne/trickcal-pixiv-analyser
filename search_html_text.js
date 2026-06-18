const fs = require('fs');

const html = fs.readFileSync('story_page.html', 'utf8');

// Find all matches of "패러디" and "포스터"
function findMatches(keyword) {
  let idx = 0;
  console.log(`\n--- Matches for "${keyword}" ---`);
  while ((idx = html.indexOf(keyword, idx)) !== -1) {
    console.log(`Found at index ${idx}:`);
    console.log(html.substring(Math.max(0, idx - 150), idx + 200).replace(/\s+/g, ' '));
    idx += keyword.length;
    if (idx > html.length - 10) break;
  }
}

findMatches("패러디");
findMatches("포스터");
