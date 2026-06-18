const fs = require('fs');
const history = JSON.parse(fs.readFileSync('public/historical_data.json', 'utf8'));

const lastDay = history[history.length - 1];
const zeroChars = [];

for (const [name, count] of Object.entries(lastDay.data)) {
  if (count === 0) {
    zeroChars.push(name);
  }
}

console.log("Characters with 0 count on the last day:", zeroChars.length);
console.log(zeroChars);
