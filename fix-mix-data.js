const fs = require('fs');
const path = require('path');

// Read current mix submissions
const dataFile = path.join(process.cwd(), 'data/mixSubmissions.json');
const mixes = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log(`Found ${mixes.length} mix records`);

// Remove duplicates by keeping the latest version of each ID
const uniqueMixes = [];
const seenIds = new Set();

// Sort by submittedAt descending to keep the latest
mixes.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

for (const mix of mixes) {
  if (!seenIds.has(mix.id)) {
    uniqueMixes.push(mix);
    seenIds.add(mix.id);
  }
}

console.log(`After deduplication: ${uniqueMixes.length} unique mixes`);

// Backfill status field based on boolean flags
const fixedMixes = uniqueMixes.map(mix => {
  // Determine correct status based on boolean flags
  let status = 'pending';
  if (mix.featureOnSite) {
    status = 'featured';
  } else if (mix.pushToAzura) {
    status = 'approved';
  }
  
  // Add or update status field
  return {
    ...mix,
    status
  };
});

// Sort by ID for consistency
fixedMixes.sort((a, b) => a.id - b.id);

// Backup original
const backupFile = `${dataFile}.backup-${Date.now()}`;
fs.writeFileSync(backupFile, fs.readFileSync(dataFile));
console.log(`Backed up original to: ${backupFile}`);

// Write fixed data
fs.writeFileSync(dataFile, JSON.stringify(fixedMixes, null, 2));

console.log('Fixed mix data:');
fixedMixes.forEach(mix => {
  console.log(`ID ${mix.id}: status="${mix.status}" (featureOnSite=${mix.featureOnSite}, pushToAzura=${mix.pushToAzura})`);
});

console.log('✅ Mix data backfill complete!');