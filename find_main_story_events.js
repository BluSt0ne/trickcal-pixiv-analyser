const fs = require('fs');

const events = JSON.parse(fs.readFileSync('public/events.json', 'utf8'));

const matched = events.filter(e => {
  const title = e.title || '';
  const type = e.type || '';
  return title.includes('메인') || title.includes('스토리') || title.includes('챕터') || type.includes('메인') || title.includes('부');
});

console.log("Matched story events:", matched.length);
matched.forEach((e, idx) => {
  console.log(`${idx}: date="${e.date}", type="${e.type}", title="${e.title}"`);
});
