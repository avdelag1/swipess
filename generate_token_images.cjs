const puppeteer = require('puppeteer');
const fs = require('fs');

const packages = [
  { name: 'STARTER', tokens: 20, price: '9.99', ppt: '0.50', color: '#14b8a6', filename: 'starter_promo.png' },
  { name: 'PLUS', tokens: 50, price: '19.99', ppt: '0.40', color: '#3b82f6', filename: 'plus_promo.png' },
  { name: 'POWER', tokens: 100, price: '39.99', ppt: '0.40', color: '#a855f7', filename: 'power_promo.png' },
];

const htmlTemplate = (pkg) => `
<!DOCTYPE html>
<html>
<head>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #111111;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-family: 'Montserrat', sans-serif;
    color: white;
  }
  .container {
    width: 600px;
    text-align: center;
  }
  .logo {
    letter-spacing: 12px;
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 40px;
  }
  .title {
    font-size: 48px;
    font-weight: 700;
    margin: 0;
    letter-spacing: 4px;
  }
  .subtitle {
    font-size: 20px;
    letter-spacing: 6px;
    margin-top: 10px;
    margin-bottom: 40px;
    color: #eeeeee;
  }
  .card {
    border: 2px solid ${pkg.color};
    border-radius: 24px;
    padding: 50px 40px;
    background: linear-gradient(180deg, rgba(20,20,20,1) 0%, rgba(10,10,10,1) 100%);
    box-shadow: 0 0 40px ${pkg.color}40, inset 0 0 20px ${pkg.color}10;
    position: relative;
    margin-bottom: 40px;
  }
  .price {
    font-size: 64px;
    font-weight: 700;
    margin: 0;
  }
  .currency {
    font-size: 32px;
    font-weight: 600;
  }
  .ppt {
    font-size: 22px;
    color: #cccccc;
    margin-top: 10px;
    margin-bottom: 30px;
  }
  .divider {
    height: 1px;
    background-color: #333;
    margin: 30px 0;
  }
  .perk {
    font-size: 24px;
    margin-bottom: 40px;
  }
  .button {
    border: 2px solid white;
    border-radius: 40px;
    padding: 20px 0;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 4px;
    cursor: pointer;
  }
  .footer {
    color: #888;
    font-size: 18px;
    line-height: 1.5;
    padding: 0 40px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">SWIPESS</div>
    
    <div class="title">${pkg.name}</div>
    <div class="subtitle">${pkg.tokens} TOKENS</div>
    
    <div class="card">
      <div class="price">$${pkg.price} <span class="currency">USD</span></div>
      <div class="ppt">$${pkg.ppt} / token</div>
      <div class="divider"></div>
      <div class="perk">${pkg.tokens} new conversations</div>
      <div class="button">GET OFFER</div>
    </div>
    
    <div class="footer">
      Tokens are used to message owners or unlock chat actions. One token = one new conversation.
    </div>
  </div>
</body>
</html>
`;

(async () => {
  const browser = await puppeteer.launch();
  for (const pkg of packages) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1284, height: 2778, deviceScaleFactor: 2 });
    await page.setContent(htmlTemplate(pkg));
    await page.screenshot({ path: '/Users/estelaselvamistica/.gemini/antigravity/brain/745b0031-6599-420b-8f3b-cdf33d4b7dcd/' + pkg.filename });
    console.log('Saved', pkg.filename);
  }
  await browser.close();
})();
