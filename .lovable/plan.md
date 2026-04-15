

## Fix ITMS-90683: Missing Purpose Strings in Info.plist

Apple rejected the build because `Info.plist` is missing `NSPhotoLibraryUsageDescription`. After auditing the full codebase, the app uses **five** protected resources that all need purpose strings.

---

### Root Cause

Capacitor 7 generates a bare `Info.plist` during `cap add ios`. The app uses Camera, Photo Library, Microphone, Location, and Push Notifications -- all require iOS privacy purpose strings. None are currently declared.

### Solution

Add all required purpose strings to `capacitor.config.ts` using the Capacitor 7 `ios.infoPlist` property. This automatically merges into `Info.plist` on `npx cap sync`.

**File: `capacitor.config.ts`** -- Add to the `ios` block:

```typescript
ios: {
  contentInset: 'always',
  backgroundColor: '#000000',
  scrollEnabled: false,
  allowsLinkPreviews: false,
  limitsNavigationsToAppBoundDomains: true,
  infoPlist: {
    NSPhotoLibraryUsageDescription:
      'Swipess needs access to your photo library to upload profile photos and listing images.',
    NSCameraUsageDescription:
      'Swipess needs camera access to take profile photos and listing images.',
    NSMicrophoneUsageDescription:
      'Swipess needs microphone access for voice-to-text messaging with the AI concierge.',
    NSLocationWhenInUseUsageDescription:
      'Swipess uses your location to show nearby listings and match you with local services.',
    NSFaceIDUsageDescription:
      'Swipess uses Face ID for secure authentication.',
  },
},
```

These six keys cover every protected API the app references:
- **NSPhotoLibraryUsageDescription** -- Photo uploads (the one Apple flagged)
- **NSCameraUsageDescription** -- `PhotoCamera.tsx`, `@capacitor/camera`
- **NSMicrophoneUsageDescription** -- Voice-to-text in `ConciergeChat.tsx`
- **NSLocationWhenInUseUsageDescription** -- Location detection in swipe containers
- **NSFaceIDUsageDescription** -- Future-proofing for biometric auth

No other files need changes. After this, run `npx cap sync ios` locally and re-upload to App Store Connect.

