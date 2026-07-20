import { WebPlugin } from '@capacitor/core';
import type { AppleVisionPlugin } from './AppleVision';

export class AppleVisionWeb extends WebPlugin implements AppleVisionPlugin {
  async analyzeImage(_options: { base64: string }): Promise<{ tags: string[] }> {
    console.warn('AppleVision.analyzeImage is only available on iOS natively. Returning mock data.');
    return { tags: [] };
  }

  async extractText(_options: { base64: string }): Promise<{ text: string }> {
    console.warn('AppleVision.extractText is only available on iOS natively. Returning mock data.');
    return { text: '' };
  }

  async detectSensitiveContent(_options: { base64: string }): Promise<{ isSensitive: boolean }> {
    console.warn('AppleVision.detectSensitiveContent is only available on iOS natively. Returning safe default.');
    return { isSensitive: false };
  }
}
