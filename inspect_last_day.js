const fs = require('fs');
const history = JSON.parse(fs.readFileSync('public/historical_data.json', 'utf8'));

const lastDay = history[history.length - 1];
console.log("Last date:", lastDay.date);
console.log("Data:", lastDay.data);
