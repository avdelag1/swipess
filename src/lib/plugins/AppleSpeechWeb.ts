import { WebPlugin } from '@capacitor/core';
import type { AppleSpeechPlugin } from './AppleSpeech';

export class AppleSpeechWeb extends WebPlugin implements AppleSpeechPlugin {
  async startRecognition(_options?: { locale?: string }): Promise<{ transcript: string }> {
    // Web fallback: try using the Web Speech API if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      return new Promise((resolve, reject) => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = _options?.locale || navigator.language || 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          resolve({ transcript });
        };

        recognition.onerror = (event: any) => {
          reject(new Error(`Speech recognition error: ${event.error}`));
        };

        recognition.onend = () => {
          // If no result was fired, resolve with empty
        };

        recognition.start();
      });
    }

    console.warn('AppleSpeech.startRecognition: Web Speech API not available.');
    return { transcript: '' };
  }

  async stopRecognition(): Promise<{ transcript: string }> {
    console.warn('AppleSpeech.stopRecognition is only fully supported natively.');
    return { transcript: '' };
  }

  async isAvailable(): Promise<{ available: boolean; authorized: boolean }> {
    const available = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    return { available, authorized: available };
  }
}
