# iOS App Store upload — Swipess

## App Store Connect version ≠ uploaded build

| Thing | What it is | Example |
|--------|------------|---------|
| **ASC Version** | The release page in App Store Connect | `1.2.34` |
| **Binary / Build** | The `.ipa` you upload (TestFlight) | Version `1.2.34`, Build `500+` |

The empty **Build** box (“Upload your builds using…”) means **no processed IPA is available to attach yet**. Creating another ASC version alone will not fill it — you must **archive → upload → wait for processing → select the build**.

## Do NOT upload marketing versions 1.2.32 or 1.2.33 again

Apple already returned:

- **90186** — pre-release train `1.2.32` / `1.2.33` closed for new build submissions  
- **90062** — `CFBundleShortVersionString` must be higher than the closed/approved train  
- **90382** — daily upload limit (wait if still blocked)

Xcode Cloud builds **494** and **496** archived successfully, then failed **Prepare Build for App Store Connect** for this reason (confirmed by re-uploading the 496 IPA with `altool`).

This repo is set to:

- **Marketing version:** `1.2.34`
- **Build number:** `500` (Xcode Cloud may stamp its own higher CI build number)
- **Bundle ID:** `com.swipess.mobile`

ASC already has version **1.2.34** in **Prepare for Submission**. After a new IPA processes in TestFlight, attach that build and **Add for Review**.

> Existing TestFlight build **492** (`1.2.33`) remains valid for internal testing, but cannot be used for a new `1.2.33` App Store upload train.

## Produce + upload the IPA (Xcode)

1. Pull latest `main` (includes `1.2.34` / `500`).
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
   - **Version** = `1.2.34`
   - **Build** = `500` (or higher if already used)
   - Destination: **Any iOS Device (arm64)**
5. **Product → Archive**
6. Organizer → select the archive → **Distribute App**
   - **App Store Connect** → **Upload**
   - Keep defaults (bitcode off / upload symbols as prompted)
7. Wait until App Store Connect → **TestFlight** shows the build as **Ready to Submit** (often 5–30+ minutes). Email: “The following build has completed processing.”
8. App Store Connect → app → version **1.2.34** → **Build** → **+** → select **1.2.34 (…) ** → Save → **Add for Review**.

## CLI alternative (same machine, signed)

```bash
cd ios/App
xcodebuild -workspace App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath "$HOME/Desktop/Swipess-1.2.34-500.xcarchive" \
  MARKETING_VERSION=1.2.34 \
  CURRENT_PROJECT_VERSION=500 \
  archive

xcodebuild -exportArchive \
  -archivePath "$HOME/Desktop/Swipess-1.2.34-500.xcarchive" \
  -exportOptionsPlist ExportOptions.plist \
  -exportPath "$HOME/Desktop/Swipess-1.2.34-500-export"
```

Then upload the IPA with **Transporter** or:

```bash
xcrun altool --upload-app \
  --type ios \
  --file "$HOME/Desktop/Swipess-1.2.34-500-export/App.ipa" \
  --apiKey YOUR_KEY --apiIssuer YOUR_ISSUER
```

## Why TestFlight/App Store felt “old”

ASC version **1.2.31** was shipping **build 446** whose binary still reported marketing **1.2.32**. Newer TestFlight builds were never attached to the live/review ASC version. Always confirm the **Build** row on the version you are releasing matches the build you just uploaded.
