const fs = require('fs');

const icons = JSON.parse(fs.readFileSync('extracted_icons.json', 'utf8'));

const matched = [];
icons.forEach(icon => {
  const alt = icon.alt || '';
  const text = icon.cellText || '';
  
  const isCandidate = (
    alt.toLowerCase().includes('eid') || 
    alt.toLowerCase().includes('ed') || 
    text.includes('이드')
  );
  
  if (!isCandidate) return;
  
  // Filter out other characters
  if (alt.toLowerCase().includes('speaki') || alt.toLowerCase().includes('vivi') || alt.toLowerCase().includes('erpin') || alt.toLowerCase().includes('ran') || alt.toLowerCase().includes('sherum') || alt.toLowerCase().includes('delia') || alt.toLowerCase().includes('laika') || alt.toLowerCase().includes('mayo') || alt.toLowerCase().includes('haley') || alt.toLowerCase().includes('daya') || alt.toLowerCase().includes('kathy') || alt.toLowerCase().includes('naia') || alt.toLowerCase().includes('ayla') || alt.toLowerCase().includes('opal') || alt.toLowerCase().includes('mute') || alt.toLowerCase().includes('kyarot') || alt.toLowerCase().includes('rohne') || alt.toLowerCase().includes('bigwood') || alt.toLowerCase().includes('gabia') || alt.toLowerCase().includes('mago') || alt.toLowerCase().includes('ashur') || alt.toLowerCase().includes('allet') || alt.toLowerCase().includes('canta') || alt.toLowerCase().includes('patula') || alt.toLowerCase().includes('lazy') || alt.toLowerCase().includes('shasha') || alt.toLowerCase().includes('risty') || alt.toLowerCase().includes('polan') || alt.toLowerCase().includes('marie') || alt.toLowerCase().includes('sist') || alt.toLowerCase().includes('jade') || alt.toLowerCase().includes('arnet') || alt.toLowerCase().includes('aragnia') || alt.toLowerCase().includes('pira') || alt.toLowerCase().includes('silphir') || alt.toLowerCase().includes('festa') || alt.toLowerCase().includes('barie') || alt.toLowerCase().includes('veroo') || alt.toLowerCase().includes('chopi')) {
    return;
  }
  
  matched.push({
    alt: alt,
    src: icon.src,
    size: `${icon.width}x${icon.height}`,
    textSnippet: text.replace(/\s+/g, ' ').substring(0, 80)
  });
});

fs.writeFileSync('eid_matches.json', JSON.stringify(matched, null, 2));
console.log(`Saved ${matched.length} candidates to eid_matches.json`);
