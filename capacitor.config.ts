import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.swipess.app',
  appName: 'Nexus Discovery',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*.supabase.co'],
  },
  ios: {
    contentInset: 'always',
    backgroundColor: '#000000',
    scrollEnabled: false,
    allowsLinkPreviews: false,
    limitsNavigationsToAppBoundDomains: true,
    infoPlist: {
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
    },
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
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
      resize: "body",
      scrollAssist: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
