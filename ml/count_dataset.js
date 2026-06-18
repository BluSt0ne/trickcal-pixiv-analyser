const fs = require('fs');
const path = require('path');

const datasetDir = path.join(__dirname, '..', 'dataset');
const needVerifyDir = path.join(__dirname, '..', '검수필요');

if (!fs.existsSync(datasetDir)) {
  console.error("dataset folder does not exist!");
  process.exit(1);
}

const jNamesMapPath = path.join(__dirname, '..', 'public', 'japanese_names.json');
let charNames = [];
if (fs.existsSync(jNamesMapPath)) {
  charNames = Object.keys(JSON.parse(fs.readFileSync(jNamesMapPath, 'utf8')));
} else {
  charNames = fs.readdirSync(datasetDir).filter(f => fs.statSync(path.join(datasetDir, f)).isDirectory());
}

charNames.sort((a, b) => a.localeCompare(b, 'ko'));

console.log("===============================================================");
console.log("Trickcal Dataset Character Image Counts");
console.log("===============================================================\n");

let totalVerified = 0;
let totalUnverified = 0;
const counts = [];

for (const name of charNames) {
  const verifiedPath = path.join(datasetDir, name);
  const unverifiedPath = path.join(needVerifyDir, name);

  let verified = 0;
  if (fs.existsSync(verifiedPath)) {
    verified = fs.readdirSync(verifiedPath).filter(f => f.match(/\.(jpg|jpeg|png)$/i)).length;
  }

  let unverified = 0;
  if (fs.existsSync(unverifiedPath)) {
    unverified = fs.readdirSync(unverifiedPath).filter(f => f.match(/\.(jpg|jpeg|png)$/i)).length;
  }

  counts.push({ name, verified, unverified, total: verified + unverified });
  totalVerified += verified;
  totalUnverified += unverified;
}

// Print in 2 columns for readability with detailed counts
const columns = 2;
const rows = Math.ceil(counts.length / columns);

for (let r = 0; r < rows; r++) {
  let line = "";
  for (let c = 0; c < columns; c++) {
    const idx = r + c * rows;
    if (idx < counts.length) {
      const item = counts[idx];
      const nameStr = item.name.padEnd(12, ' ');
      const verifiedStr = String(item.verified).padStart(3, ' ') + "검수";
      const unverifiedStr = String(item.unverified).padStart(3, ' ') + "대기";
      const totalStr = String(item.total).padStart(3, ' ') + "총";
      line += `| ${nameStr}: [${verifiedStr}/${unverifiedStr}] -> ${totalStr}   `;
    }
  }
  console.log(line);
}

console.log("\n===============================================================");
console.log(`Total Characters: ${counts.length}`);
console.log(`Verified (dataset/): ${totalVerified}장`);
console.log(`Unverified (검수필요/): ${totalUnverified}장`);
console.log(`Combined Total: ${totalVerified + totalUnverified}장`);
console.log("===============================================================");
