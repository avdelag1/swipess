#!/usr/bin/env node
/**
 * Keeps ios/App MARKETING_VERSION in sync with package.json — single source of truth.
 * Codemagic still sets CURRENT_PROJECT_VERSION (build number) via agvtool + BUILD_NUMBER.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pkgPath = path.join(root, 'package.json');
const pbxPath = path.join(root, 'ios', 'App', 'App.xcodeproj', 'project.pbxproj');

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