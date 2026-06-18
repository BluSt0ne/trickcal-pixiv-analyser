const fs = require('fs');

const history = JSON.parse(fs.readFileSync('public/historical_data.json', 'utf8'));

console.log("History records:", history.length);

const sampleDates = history.slice(0, 10).map(h => h.date);
console.log("First 10 dates:", sampleDates);

const reviData = [];
history.forEach(day => {
  if (day.data && day.data['레비'] !== undefined) {
    reviData.push({ date: day.date, count: day.data['레비'] });
  }
});

console.log("Revi data points count:", reviData.length);
if (reviData.length > 0) {
  console.log("First 5 data points:", reviData.slice(0, 5));
  console.log("Last 5 data points:", reviData.slice(-5));
} else {
  // Let's print keys from the first day to see what names are present
  console.log("Keys in first day data:", Object.keys(history[0].data));
}
