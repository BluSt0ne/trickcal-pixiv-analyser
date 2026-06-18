const fs = require('fs');

const html = fs.readFileSync('scraped_namu_chars.html', 'utf8');

// Find the index of veQQWl
const idx = html.indexOf('veQQWl');
if (idx === -1) {
  console.log("veQQWl not found in scraped HTML!");
} else {
  console.log("Found veQQWl at index:", idx);
  // Print 500 characters before and after
  console.log("Context:");
  console.log(html.substring(Math.max(0, idx - 400), idx + 600));
}
