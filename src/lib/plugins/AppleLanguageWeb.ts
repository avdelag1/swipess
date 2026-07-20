import { WebPlugin } from '@capacitor/core';
import type { AppleLanguagePlugin } from './AppleLanguage';

export class AppleLanguageWeb extends WebPlugin implements AppleLanguagePlugin {
  async detectLanguage(_options: { text: string }): Promise<{ languageCode: string | null }> {
    console.warn('AppleLanguage.detectLanguage is only available natively. Returning null.');
    return { languageCode: null };
  }

  async translateText(options: { text: string, targetLanguage?: string }): Promise<{ translatedText: string }> {
    console.warn('AppleLanguage.translateText is only available natively. Returning original text.');
    return { translatedText: options.text };
  }
}
