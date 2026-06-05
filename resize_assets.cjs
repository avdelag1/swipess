const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = 'C:\\Users\\delag\\.gemini\\antigravity\\brain\\8ede60cf-f16e-4cab-8ba6-d5b9b873e344';
const outputDir = 'D:\\swipess\\play-store-assets';

if (!fs.existsSync(outputDir)){
    fs.mkdirSync(outputDir, { recursive: true });
}

// Resize App Icon to 512x512
sharp(path.join(inputDir, 'swipess_app_icon_1780683478587.png'))
  .resize(512, 512)
  .toFile(path.join(outputDir, 'app_icon_512x512.png'))
  .then(() => console.log('App Icon resized successfully!'))
  .catch(err => console.error('Error resizing app icon:', err));

// Resize Feature Graphic to 1024x500 (Crop the center)
sharp(path.join(inputDir, 'swipess_feature_graphic_1780683488658.png'))
  .resize(1024, 500, {
    fit: sharp.fit.cover,
    position: sharp.strategy.attention
  })
  .toFile(path.join(outputDir, 'feature_graphic_1024x500.png'))
  .then(() => console.log('Feature Graphic resized successfully!'))
  .catch(err => console.error('Error resizing feature graphic:', err));
