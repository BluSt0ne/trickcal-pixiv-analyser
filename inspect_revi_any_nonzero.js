const fs = require('fs');
const history = JSON.parse(fs.readFileSync('public/historical_data.json', 'utf8'));

const targets = ['레비', '키디언', '에슈르', '우로스', '힐데'];

targets.forEach(name => {
  const nonZeroPoints = [];
  history.forEach(day => {
    if (day.data && day.data[name] > 0) {
      nonZeroPoints.push({ date: day.date, count: day.data[name] });
    }
  });
  console.log(`Character [${name}]: total non-zero data points = ${nonZeroPoints.length}`);
  if (nonZeroPoints.length > 0) {
    console.log(`  First non-zero:`, nonZeroPoints[0]);
    console.log(`  Last non-zero:`, nonZeroPoints[nonZeroPoints.length - 1]);
  }
});
