import { registerPlugin } from '@capacitor/core';

export interface AppleVisionPlugin {
  /**
   * Analyzes an image using Apple Vision VNClassifyImageRequest
   * and returns a list of highly confident tags (e.g. 'kitchen', 'pool', 'bathroom').
   * @param options Object containing the base64 string of the image (without the data:image/... prefix).
   */
  analyzeImage(options: { base64: string }): Promise<{ tags: string[] }>;

  /**
   * Extracts text from an image using Apple Vision VNRecognizeTextRequest.
   * Useful for OCR on documents or flyers.
   * @param options Object containing the base64 string of the image (without the data:image/... prefix).
   */
  extractText(options: { base64: string }): Promise<{ text: string }>;
}

export const AppleVision = registerPlugin<AppleVisionPlugin>('AppleVision', {
  web: () => import('./AppleVisionWeb').then(m => new m.AppleVisionWeb()),
});
