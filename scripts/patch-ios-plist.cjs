#!/usr/bin/env node
/**
 * Patches ios/App/App/Info.plist with all required NSUsageDescription
 * purpose strings so App Store Connect (ITMS-90683) stops rejecting the build.
 *
 * Capacitor's `ios.infoPlist` in capacitor.config.ts is usually merged on
 * `npx cap sync`, but we run this as a belt-and-suspenders guarantee in the
 * ios:sync pipeline so the strings are always present before archiving.
 */
const fs = require('fs');
const path = require('path');

const PLIST = path.resolve(__dirname, '..', 'ios', 'App', 'App', 'Info.plist');

const REQUIRED = {
  NSPhotoLibraryUsageDescription:
    'Nexus needs access to your photo library to upload profile photos and listing images.',
  NSPhotoLibraryAddUsageDescription:
    'Nexus saves downloaded receipts and QR codes to your photo library.',
  NSCameraUsageDescription:
    'Nexus needs camera access to take profile photos and listing images.',
  NSMicrophoneUsageDescription:
    'Nexus needs microphone access for voice-to-text messaging with the AI concierge.',
  NSLocationWhenInUseUsageDescription:
    'Nexus uses your location to show nearby listings and match you with local services.',
  NSFaceIDUsageDescription:
    'Nexus uses Face ID for secure authentication.',
  NSContactsUsageDescription:
    'Nexus can share listings with your contacts if you choose to.',
};

if (!fs.existsSync(PLIST)) {
  console.log(`[patch-ios-plist] ${PLIST} not found — skipping (run "npx cap add ios" first).`);
  process.exit(0);
}

let plist = fs.readFileSync(PLIST, 'utf8');
let added = 0;
let updated = 0;

for (const [key, value] of Object.entries(REQUIRED)) {
  const keyTag = `<key>${key}</key>`;
  const keyRegex = new RegExp(`<key>${key}</key>\\s*<string>[^<]*</string>`);

  if (plist.includes(keyTag)) {
    const nextPlist = plist.replace(keyRegex, `${keyTag}\n\t<string>${value}</string>`);
    if (nextPlist !== plist) updated++;
    plist = nextPlist;
  } else {
    plist = plist.replace(
      /<\/dict>\s*<\/plist>\s*$/,
      `\t${keyTag}\n\t<string>${value}</string>\n</dict>\n</plist>\n`
    );
    added++;
  }
}

fs.writeFileSync(PLIST, plist, 'utf8');
console.log(`[patch-ios-plist] done — ${added} added, ${updated} updated in Info.plist`);
