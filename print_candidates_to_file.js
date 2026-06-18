const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

const eshurCandidates = icons.filter(icon => {
  const alt = icon.alt.toLowerCase();
  const text = icon.cellText.toLowerCase();
  return alt.includes('eshur') || alt.includes('esur') || text.includes('에슈르');
});

fs.writeFileSync('eshur_candidates.json', JSON.stringify(eshurCandidates, null, 2));
console.log(`Saved ${eshurCandidates.length} candidates to eshur_candidates.json`);
