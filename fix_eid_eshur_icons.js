const fs = require('fs');

const metaPath = 'public/char_meta.json';
const mapPath = 'public/icon_map.json';

const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
const iconMap = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const eidUrl = 'https://i.namu.wiki/i/WEs9JEoskbfl9orHD7PkQ9bcI2dkrmZ30oy18Q5WR28Mel9vKrnhrGgQ7MrnfkHTorZvepEMe3C2FTdGL2jp9W7NzyIHmGQD4aS5dMGx473two5G64PY0Cf4wOt2bQAuBc4YVwp7qxQsHV1aCtH11g.webp';
const eshurUrl = 'https://i.namu.wiki/i/ATEbWQwTs44S9lbSR12A4-_4eWI-L1e8iBR3eDKW-p1XH6YeMO7tRV7B2px3HRw_1YRhsItNDveZufJYhIMoEXMN8hcdPPwgdLACE2gmpRVdgoqy8wNPejSxmSIEKeV1V7Q5FM2xxcYDcz9iof2Plg.webp';

// Update char_meta.json
meta.iconMap['이드'] = eidUrl;
meta.iconMap['에슈르'] = eshurUrl;

// Update icon_map.json
iconMap['이드'] = eidUrl;
iconMap['에슈르'] = eshurUrl;

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
fs.writeFileSync(mapPath, JSON.stringify(iconMap, null, 2));

console.log("Successfully fixed 이드 and 에슈르 profile pictures in char_meta.json and icon_map.json!");
