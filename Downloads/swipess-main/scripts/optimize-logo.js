/**
 * Logo optimization script - converts PNG to WebP for 80%+ size reduction
 */
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public/icons');

async function optimizeLogo() {
  const inputPath = path.join(publicDir, 'swipess-logo.png');
  const outputPath = path.join(publicDir, 'swipess-logo.webp');
  
  // Get original size
  const originalStats = fs.statSync(inputPath);
  console.log(`Original PNG size: ${(originalStats.size / 1024 / 1024).toFixed(2)}MB`);
  
  // Convert to WebP with high quality
  await sharp(inputPath)
    .webp({ quality: 85, effort: 6 })
    .toFile(outputPath);
  
  const optimizedStats = fs.statSync(outputPath);
  console.log(`Optimized WebP size: ${(optimizedStats.size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Size reduction: ${((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1)}%`);
  
  // Also create AVIF version (even smaller)
  const avifPath = path.join(publicDir, 'swipess-logo.avif');
  await sharp(inputPath)
    .avif({ quality: 65, effort: 6 })
    .toFile(avifPath);
  
  const avifStats = fs.statSync(avifPath);
  console.log(`AVIF size: ${(avifStats.size / 1024 / 1024).toFixed(2)}MB`);
  console.log(`AVIF reduction: ${((1 - avifStats.size / originalStats.size) * 100).toFixed(1)}%`);
}

optimizeLogo().catch(console.error);