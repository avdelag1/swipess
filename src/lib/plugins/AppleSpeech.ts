import { registerPlugin } from '@capacitor/core';

export interface AppleSpeechPlugin {
  /**
   * Starts on-device speech recognition using Apple's Speech framework.
   * Records from the microphone and returns the final transcript when the user stops speaking.
   * Requires iOS 10+ and microphone/speech recognition permissions.
   * @param options Optional locale (BCP-47, e.g. "en-US", "es-MX"). Defaults to device locale.
   */
  startRecognition(options?: { locale?: string }): Promise<{ transcript: string }>;

  /**
   * Stops an in-progress recognition session early and returns the partial transcript.
   */
  stopRecognition(): Promise<{ transcript: string }>;

  /**
   * Checks whether speech recognition is available and authorized on this device.
   */
  isAvailable(): Promise<{ available: boolean; authorized: boolean }>;
}

export const AppleSpeech = registerPlugin<AppleSpeechPlugin>('AppleSpeech', {
  web: () => import('./AppleSpeechWeb').then(m => new m.AppleSpeechWeb()),
});
