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

  /**
   * Analyzes an image for explicit/sensitive content using Apple's SensitiveContentAnalysis framework.
   * @param options Object containing the base64 string of the image.
   * @returns { isSensitive: boolean } True if explicit content is detected.
   */
  detectSensitiveContent(options: { base64: string }): Promise<{ isSensitive: boolean }>;
}

export const AppleVision = registerPlugin<AppleVisionPlugin>('AppleVision', {
  web: () => import('./AppleVisionWeb').then(m => new m.AppleVisionWeb()),
});
