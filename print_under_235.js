const fs = require('fs');
const html = fs.readFileSync('main_story_page.html', 'utf8');

const key = '2.3.5. 챕터 5: 정원에 드리운 어둠';
const idx = html.indexOf(key);
if (idx === -1) {
  console.log("Heading not found!");
} else {
  console.log("Found heading at index:", idx);
  console.log("HTML following heading:");
  console.log(html.substring(idx, idx + 3000));
}
