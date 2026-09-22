#!/usr/bin/env node

/**
 * Image Optimization Script
 * Compresses PNG images and creates WebP versions for better performance
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const rootDir = path.join(__dirname, '..');

const images = [
  { input: path.join(publicDir, 'snitch.png'), name: 'snitch' },
  { input: path.join(publicDir, 'quid.png'), name: 'quid' },
  { input: path.join(rootDir, 'snitch.png'), name: 'snitch-root' },
  { input: path.join(rootDir, 'quid.png'), name: 'quid-root' }
];

async function optimizeImage(imagePath, name) {
  if (!fs.existsSync(imagePath)) {
    console.log(`⏭️  Skipping ${name} - file not found`);
    return;
  }

  const stats = fs.statSync(imagePath);
  const originalSize = (stats.size / 1024).toFixed(2);
  console.log(`\n📸 Processing ${name}...`);
  console.log(`   Original: ${originalSize} KB`);

  try {
    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    
    // Optimize PNG with better compression
    const pngBuffer = await sharp(imagePath)
      .png({
        quality: 85,
        compressionLevel: 9,
        palette: true,
        effort: 10
      })
      .toBuffer();

    // Create WebP version (much smaller)
    const webpBuffer = await sharp(imagePath)
      .webp({
        quality: 90,
        effort: 6
      })
      .toBuffer();

    // Save optimized PNG (backup original first)
    const backupPath = imagePath.replace('.png', '.png.backup');
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(imagePath, backupPath);
      console.log(`   ✅ Backup saved: ${path.basename(backupPath)}`);
    }

    fs.writeFileSync(imagePath, pngBuffer);
    const newSize = (pngBuffer.length / 1024).toFixed(2);
    const savings = ((1 - pngBuffer.length / stats.size) * 100).toFixed(1);
    console.log(`   ✅ PNG optimized: ${newSize} KB (saved ${savings}%)`);

    // Save WebP version
    const webpPath = imagePath.replace('.png', '.webp');
    fs.writeFileSync(webpPath, webpBuffer);
    const webpSize = (webpBuffer.length / 1024).toFixed(2);
    const webpSavings = ((1 - webpBuffer.length / stats.size) * 100).toFixed(1);
    console.log(`   ✅ WebP created: ${webpSize} KB (saved ${webpSavings}%)`);

  } catch (error) {
    console.error(`   ❌ Error processing ${name}:`, error.message);
  }
}

async function main() {
  console.log('🎨 Starting image optimization...\n');
  console.log('━'.repeat(50));

  for (const image of images) {
    await optimizeImage(image.input, image.name);
  }

  console.log('\n' + '━'.repeat(50));
  console.log('\n✨ Image optimization complete!');
  console.log('\n💡 Tips:');
  console.log('   - WebP images are much smaller and modern browsers support them');
  console.log('   - Original images backed up as *.png.backup');
  console.log('   - Update code to use WebP with PNG fallback for best results');
}

main().catch(console.error);
