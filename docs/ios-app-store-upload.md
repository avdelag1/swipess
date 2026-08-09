# iOS App Store upload — Swipess

## App Store Connect version ≠ uploaded build

| Thing | What it is | Example |
|--------|------------|---------|
| **ASC Version** | The release page in App Store Connect | `1.2.33` |
| **Binary / Build** | The `.ipa` you upload (TestFlight) | Version `1.2.33`, Build `490` |

The empty **Build** box (“Upload your builds using…”) means **no processed IPA is available to attach yet**. Creating another ASC version alone will not fill it — you must **archive → upload → wait for processing → select the build**.

## Do NOT upload marketing version 1.2.32 again

Apple already returned:

- **90186** — pre-release train `1.2.32` closed  
- **90062** — `CFBundleShortVersionString` must be higher than `1.2.32`  
- **90382** — daily upload limit (wait if still blocked)

This repo is set to:

- **Marketing version:** `1.2.33`
- **Build number:** `490`
- **Bundle ID:** `com.swipess.mobile`

So in App Store Connect you need an ASC version **1.2.33** (not another empty 1.2.32), then attach build **490**.

> If ASC `1.2.32` is still empty: open **Build → +**. If old TestFlight builds `457–479` appear, you can attach one of those to finish `1.2.32`. If the picker is empty, that train is done — use **1.2.33 + build 490**.

## Produce + upload the IPA (Xcode)

1. Pull latest `main` (includes `1.2.33` / `490`).
2. From repo root (optional but recommended before archive):

```bash
npm ci
npm run build
npx cap sync ios
node scripts/sync-ios-version.cjs
```

3. Open workspace (Pods required):

```bash
open ios/App/App.xcworkspace
```

4. In Xcode:
   - Target **App** → **General**
   - **Version** = `1.2.33`
   - **Build** = `490` (or higher if 490 was already used)
   - Destination: **Any iOS Device (arm64)**
5. **Product → Archive**
6. Organizer → select the archive → **Distribute App**
   - **App Store Connect** → **Upload**
   - Keep defaults (bitcode off / upload symbols as prompted)
7. Wait until App Store Connect → **TestFlight** shows the build as **Ready to Submit** (often 5–30+ minutes). Email: “The following build has completed processing.”
8. App Store Connect → app → version **1.2.33** → **Build** → **+** → select **1.2.33 (490)** → Save → **Add for Review**.

## CLI alternative (same machine, signed)

```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$HOME/Desktop/Swipess-1.2.33-490.xcarchive" \
  MARKETING_VERSION=1.2.33 \
  CURRENT_PROJECT_VERSION=490 \
  archive

xcodebuild -exportArchive \
  -archivePath "$HOME/Desktop/Swipess-1.2.33-490.xcarchive" \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath "$HOME/Desktop/Swipess-1.2.33-490-export"
```

Then upload the IPA with **Transporter** or:

```bash
xcrun altool --upload-app \
  --type ios \
  --file "$HOME/Desktop/Swipess-1.2.33-490-export/App.ipa" \
  --apiKey YOUR_KEY --apiIssuer YOUR_ISSUER
```

## Why TestFlight/App Store felt “old”

ASC version **1.2.31** was shipping **build 446** whose binary still reported marketing **1.2.32**. Newer TestFlight builds were never attached to the live/review ASC version. Always confirm the **Build** row on the version you are releasing matches the build you just uploaded.
