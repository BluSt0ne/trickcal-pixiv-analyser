const fs = require('fs');
const path = require('path');

const datasetDir = path.join(__dirname, '..', 'dataset');
const needVerifyDir = path.join(__dirname, '..', '검수필요');

if (!fs.existsSync(needVerifyDir)) {
  console.log("검수필요 folder does not exist. Nothing to merge!");
  process.exit(0);
}

const dirs = fs.readdirSync(needVerifyDir).filter(f => fs.statSync(path.join(needVerifyDir, f)).isDirectory());

console.log("===================================================");
console.log("Merging '검수필요' files into 'dataset'");
console.log("===================================================\n");

let movedCount = 0;

for (const dir of dirs) {
  const sourceDir = path.join(needVerifyDir, dir);
  const targetDir = path.join(datasetDir, dir);

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const files = fs.readdirSync(sourceDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  if (files.length > 0) {
    console.log(`Processing "${dir}": moving ${files.length} files...`);
    for (const file of files) {
      const srcFile = path.join(sourceDir, file);
      const destFile = path.join(targetDir, file);
      
      // Move file (overwrite if exists, though names are unique ID hashes so it shouldn't overlap)
      fs.renameSync(srcFile, destFile);
      movedCount++;
    }
  }

  // Delete the character folder in '검수필요' if empty
  try {
    fs.rmdirSync(sourceDir);
  } catch (e) {
    // If it's not empty, it will throw an error, which is fine
  }
}

// Try to remove '검수필요' directory itself if empty
try {
  fs.rmdirSync(needVerifyDir);
  console.log("\nDeleted empty '검수필요' directory.");
} catch (e) {
  console.log("\n'검수필요' directory is not empty yet, some files remain.");
}

console.log(`\n===================================================`);
console.log(`Merge complete! Moved ${movedCount} files.`);
console.log(`===================================================`);
