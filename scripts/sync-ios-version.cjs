#!/usr/bin/env node
/**
 * Keeps iOS marketing version in sync with package.json (single source of truth).
 * Build number (CURRENT_PROJECT_VERSION) is set separately / by CI.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const pbxPath = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');
const plistPath = path.join(root, 'ios', 'App', 'App', 'Info.plist');

if (!fs.existsSync(pbxPath)) {
  console.log('[sync-ios-version] Xcode project not found — skipping.');
  process.exit(0);
}

const version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
if (!version || typeof version !== 'string') {
  console.error('[sync-ios-version] Invalid package.json version');
  process.exit(1);
}

let pbx = fs.readFileSync(pbxPath, 'utf8');
const before = pbx;
pbx = pbx.replace(/MARKETING_VERSION = [^;]+;/g, `MARKETING_VERSION = ${version};`);
if (pbx === before) {
  console.log(`[sync-ios-version] MARKETING_VERSION already ${version}`);
} else {
  fs.writeFileSync(pbxPath, pbx);
  console.log(`[sync-ios-version] MARKETING_VERSION → ${version}`);
}

// Prefer Xcode vars in Info.plist so archive always matches project settings
if (fs.existsSync(plistPath)) {
  let plist = fs.readFileSync(plistPath, 'utf8');
  const next = plist
    .replace(
      /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/,
      '$1$(MARKETING_VERSION)$2',
    )
    .replace(
      /(<key>CFBundleVersion<\/key>\s*<string>)[^<]+(<\/string>)/,
      '$1$(CURRENT_PROJECT_VERSION)$2',
    );
  if (next !== plist) {
    fs.writeFileSync(plistPath, next);
    console.log('[sync-ios-version] Info.plist now uses $(MARKETING_VERSION) / $(CURRENT_PROJECT_VERSION)');
  }
}
