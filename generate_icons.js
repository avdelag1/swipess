import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC = 'public/icons/Swipess-logo-transparent.png';
const DEST_DIR = 'public/icons';

const SIZES = [16, 32, 48, 96, 114, 120, 144, 152, 167, 180, 192, 512, 1024];

async function generate() {
  if (!fs.existsSync(SRC)) {
    console.error(`Source file not found: ${SRC}`);
    return;
  }

  for (const size of SIZES) {
    console.log(`Generating ${size}x${size}...`);
    
    // Regular icon
    await sharp(SRC)
      .resize(size, size)
      .toFile(path.join(DEST_DIR, `icon-${size}.png`));
      
    // Apple touch icon
    await sharp(SRC)
      .resize(size, size)
      .extend({
        top: Math.floor(size * 0.1),
        bottom: Math.floor(size * 0.1),
        left: Math.floor(size * 0.1),
        right: Math.floor(size * 0.1),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .resize(size, size) // Back to original size after padding if needed, but actually Apple icons usually don't need padding if it's transparent
      .toFile(path.join(DEST_DIR, `apple-touch-icon-${size}x${size}.png`));
  }

  // Favicons
  await sharp(SRC).resize(32, 32).toFile(path.join(DEST_DIR, 'favicon.png'));
  
  // Maskable icons (add a background if needed, but PWA spec prefers it)
  // Actually the user said "no layers around", so maybe they want it transparent even in maskable?
  // PWA maskable usually needs to fill the area.
  await sharp(SRC)
    .resize(384, 384)
    .extend({
      top: 64,
      bottom: 64,
      left: 64,
      right: 64,
      background: { r: 0, g: 0, b: 0, alpha: 1 } // Black background for maskable
    })
    .toFile(path.join(DEST_DIR, 'maskable-512.png'));

  console.log('Done!');
}

generate();
