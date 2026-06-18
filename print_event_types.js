const fs = require('fs');

const events = JSON.parse(fs.readFileSync('public/events.json', 'utf8'));

console.log("Total events:", events.length);
const types = {};
events.forEach(e => {
  types[e.type] = (types[e.type] || 0) + 1;
});
console.log("Event types:", types);

// Let's print the first 10 events
console.log("\nFirst 10 events:");
console.log(events.slice(0, 10));
