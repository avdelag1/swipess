import { registerPlugin } from '@capacitor/core';

export interface AppleLanguagePlugin {
  /**
   * Detects the dominant language of the provided text.
   * Returns a BCP-47 language tag (e.g., "en", "es", "fr").
   * @param options Object containing the text to analyze.
   */
  detectLanguage(options: { text: string }): Promise<{ languageCode: string | null }>;

  /**
   * Translates the provided text to the target language on-device.
   * Requires iOS 17.4+ (Translation framework).
   * @param options Object containing the text and target language code.
   */
  translateText(options: { text: string, targetLanguage?: string }): Promise<{ translatedText: string }>;
}

export const AppleLanguage = registerPlugin<AppleLanguagePlugin>('AppleLanguage', {
  web: () => import('./AppleLanguageWeb').then(m => new m.AppleLanguageWeb()),
});
