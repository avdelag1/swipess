import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const targets = [
  'public/cassette-skin.png',
  'public/images/cassette-player-bg.png',
  'public/images/retro-cassette-hd.png'
];

async function compress() {
  for (const target of targets) {
    const fullPath = path.resolve(process.cwd(), target);
    if (fs.existsSync(fullPath)) {
      console.log(`Compressing ${target}...`);
      const { size: originalSize } = fs.statSync(fullPath);
      
      const buffer = await sharp(fullPath)
        .png({ quality: 80, compressionLevel: 9 })
        .toBuffer();
      
      fs.writeFileSync(fullPath, buffer);
      const { size: newSize } = fs.statSync(fullPath);
      console.log(`- Original: ${(originalSize / 1024).toFixed(2)} KB`);
      console.log(`- New: ${(newSize / 1024).toFixed(2)} KB`);
      console.log(`- Savings: ${((1 - newSize / originalSize) * 100).toFixed(2)}%`);
    } else {
      console.warn(`File not found: ${target}`);
    }
  }
}

compress();
