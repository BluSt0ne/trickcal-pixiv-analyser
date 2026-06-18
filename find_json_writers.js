const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.endsWith('.js'));

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('historical_data.json')) {
    console.log(`Found reference in: ${file}`);
  }
});
