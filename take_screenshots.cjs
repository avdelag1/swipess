const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const dir = 'd:/swipess/play_store_screenshots';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Google Play Console requires EXACTLY 1080x1920 (9:16)
  await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

  console.log("Navigating to local app...");
  await page.goto('http://localhost:8082', { waitUntil: 'networkidle2' });

  // Hide any scrollbars to make it look native
  await page.addStyleTag({content: '::-webkit-scrollbar { display: none; } * { -ms-overflow-style: none; scrollbar-width: none; }'});

  // Wait a bit for animations/images to load fully
  await new Promise(r => setTimeout(r, 2000));

  console.log("Taking Screenshot 1: Home/Discovery...");
  await page.screenshot({ path: `${dir}/screenshot_1.png` });

  // Navigate to AI Concierge or Filters
  console.log("Taking Screenshot 2: AI Concierge / Filters...");
  try {
    // Attempt to open AI Concierge if there's a button
    // The button might have an aria-label or specific icon. 
    // Let's just click the bottom navigation middle button.
    const buttons = await page.$$('button');
    if (buttons.length > 2) {
      await buttons[2].click();
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch(e) {}
  await page.screenshot({ path: `${dir}/screenshot_2.png` });

  // Navigate somewhere else (e.g., Radio or Profile)
  console.log("Taking Screenshot 3: Secondary Page...");
  try {
    const buttons = await page.$$('button');
    if (buttons.length > 3) {
      await buttons[3].click();
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch(e) {}
  await page.screenshot({ path: `${dir}/screenshot_3.png` });

  console.log("Done! Screenshots saved to " + dir);
  await browser.close();
})();
