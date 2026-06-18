const fs = require('fs');

const candidates = JSON.parse(fs.readFileSync('eid_candidates.json', 'utf8'));

const match = candidates.find(c => c.src && c.src.includes('c7K1Ho'));

if (match) {
  console.log("Found c7K1Ho match:");
  console.log(match);
} else {
  console.log("No c7K1Ho match found in candidates.");
}
