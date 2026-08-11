import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swipess.mobile',
  appName: 'Swipess',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    // Allow Mapbox tiles/styles/workers + Supabase from the native WebView.
    // Without these, WKWebView can block mapbox.com while Chrome PWA still works.
    allowNavigation: [
      '*.supabase.co',
      '*.mapbox.com',
      'api.mapbox.com',
      'events.mapbox.com',
    ],
  },
  ios: {
    // Edge-to-edge: web CSS owns safe-area insets (StatusBar overlays WebView).
    contentInset: 'never',
    backgroundColor: '#000000',
    scrollEnabled: false,
    allowsLinkPreviews: false,
    // NOTE: do NOT set `limitsNavigationsToAppBoundDomains: true` here. That flag
    // locks the WKWebView to the domains listed under `WKAppBoundDomains` in
    // Info.plist — which we do not declare — so on the device every request to
    // external hosts (Supabase REST/Auth/Realtime, OAuth providers) gets
    // restricted and hangs to timeout, while the browser preview works fine.
    // It is not required for the App Store and was never load-bearing. Leaving it
    // unset (Capacitor default = false) lets the webview reach *.supabase.co.
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'Swipess needs access to your photo library to upload profile photos and listing images.',
      NSPhotoLibraryAddUsageDescription:
        'Swipess saves downloaded receipts and QR codes to your photo library.',
      NSCameraUsageDescription:
        'Swipess needs camera access to take profile photos and listing images.',
      NSMicrophoneUsageDescription:
        "Swipess uses the microphone so you can dictate messages to the AI concierge and record voice notes on listings. For example, say 'Show me 2-bedroom apartments under $1500' and Swipess will search for you.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        'Swipess uses your location to show nearby listings and match you with local services.',
      NSLocationWhenInUseUsageDescription:
        'Swipess uses your location to show nearby listings and match you with local services.',
      NSFaceIDUsageDescription:
        'Swipess uses Face ID for secure authentication.',
      NSContactsUsageDescription:
        'Swipess can share listings with your contacts if you choose to.',
      NSCalendarsUsageDescription:
        'Swipess adds events to your calendar so you never miss experiences, workshops, or ceremonies.',
      NSRemindersUsageDescription:
        'Swipess can add event reminders to help you prepare for upcoming experiences.',
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#000000",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
    },
    Keyboard: {
      // App lifts UI via --keyboard-height; avoid body resize jank in WKWebView
      resize: "none",
      resizeOnFullScreen: true,
      scrollAssist: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
