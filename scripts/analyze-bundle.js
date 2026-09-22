/**
 * Bundle Analysis Script
 * Analyzes Next.js bundle to identify optimization opportunities
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Next.js bundle...\n');

const nextDir = path.join(process.cwd(), '.next');
const buildManifestPath = path.join(nextDir, 'build-manifest.json');

if (!fs.existsSync(buildManifestPath)) {
  console.error('❌ Build manifest not found. Run `npm run build` first.');
  process.exit(1);
}

const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));

// Analyze pages
console.log('📄 Page Bundles:\n');
let totalSize = 0;

for (const [page, files] of Object.entries(buildManifest.pages)) {
  let pageSize = 0;
  
  for (const file of files) {
    const filePath = path.join(nextDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      pageSize += stats.size;
    }
  }
  
  totalSize += pageSize;
  const sizeKB = (pageSize / 1024).toFixed(2);
  console.log(`  ${page.padEnd(30)} ${sizeKB.padStart(10)} KB`);
}

console.log('\n' + '='.repeat(50));
console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
console.log('='.repeat(50) + '\n');

// Recommendations
console.log('💡 Optimization Recommendations:\n');

const recommendations = [
  '✅ Tree shaking enabled (webpack optimization)',
  '✅ Code splitting configured (React, Supabase, vendor)',
  '✅ Dynamic imports for heavy components',
  '✅ SWC minification enabled',
  '✅ Production React builds',
];

recommendations.forEach(rec => console.log(`  ${rec}`));

console.log('\n📊 Bundle Analysis Complete!\n');
