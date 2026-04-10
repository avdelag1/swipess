// Camera Filters and Effects Utility

export type FilterType =
  | 'none'
  | 'vivid'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'noir'
  | 'dramatic'
  | 'silvertone'
  | 'fade';

export interface FilterConfig {
  name: string;
  cssFilter: string;
  icon?: string;
}

export const CAMERA_FILTERS: Record<FilterType, FilterConfig> = {
  none: {
    name: 'Original',
    cssFilter: 'none',
  },
  vivid: {
    name: 'Vivid',
    cssFilter: 'saturate(1.4) contrast(1.1)',
  },
  warm: {
    name: 'Warm',
    cssFilter: 'sepia(0.2) saturate(1.2) brightness(1.05)',
  },
  cool: {
    name: 'Cool',
    cssFilter: 'saturate(0.9) hue-rotate(15deg) brightness(1.05)',
  },
  vintage: {
    name: 'Vintage',
    cssFilter: 'sepia(0.4) contrast(0.9) brightness(1.1) saturate(0.9)',
  },
  noir: {
    name: 'Noir',
    cssFilter: 'grayscale(1) contrast(1.2)',
  },
  dramatic: {
    name: 'Dramatic',
    cssFilter: 'contrast(1.3) saturate(1.1) brightness(0.95)',
  },
  silvertone: {
    name: 'Silver',
    cssFilter: 'grayscale(0.6) contrast(1.1) brightness(1.05)',
  },
  fade: {
    name: 'Fade',
    cssFilter: 'saturate(0.8) contrast(0.9) brightness(1.1)',
  },
};

export interface PhotoAdjustments {
  brightness: number; // -100 to 100, default 0
  contrast: number;   // -100 to 100, default 0
  saturation: number; // -100 to 100, default 0
  warmth: number;     // -100 to 100, default 0
  exposure: number;   // -100 to 100, default 0
  highlights: number; // -100 to 100, default 0
  shadows: number;    // -100 to 100, default 0
  vignette: number;   // 0 to 100, default 0
  sharpness: number;  // 0 to 100, default 0
}

export const DEFAULT_ADJUSTMENTS: PhotoAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
  vignette: 0,
  sharpness: 0,
};

// Convert adjustments to CSS filter string
export function adjustmentsToCssFilter(adjustments: PhotoAdjustments): string {
  const filters: string[] = [];

  // Brightness (1 is normal, 0-2 range)
  if (adjustments.brightness !== 0) {
    filters.push(`brightness(${1 + adjustments.brightness / 100})`);
  }

  // Contrast (1 is normal, 0-2 range)
  if (adjustments.contrast !== 0) {
    filters.push(`contrast(${1 + adjustments.contrast / 100})`);
  }

  // Saturation (1 is normal, 0-2 range)
  if (adjustments.saturation !== 0) {
    filters.push(`saturate(${1 + adjustments.saturation / 100})`);
  }

  // Warmth (using sepia and hue-rotate)
  if (adjustments.warmth !== 0) {
    if (adjustments.warmth > 0) {
      filters.push(`sepia(${adjustments.warmth / 200})`);
    } else {
      filters.push(`hue-rotate(${adjustments.warmth / 5}deg)`);
    }
  }

  // Exposure (similar to brightness but more dramatic)
  if (adjustments.exposure !== 0) {
    filters.push(`brightness(${1 + adjustments.exposure / 50})`);
  }

  return filters.length > 0 ? filters.join(' ') : 'none';
}

// Apply filter to canvas image data
export function applyFilterToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filter: FilterType,
  adjustments: PhotoAdjustments
): void {
  // Get combined CSS filter
  let combinedFilter = '';

  if (filter !== 'none') {
    combinedFilter = CAMERA_FILTERS[filter].cssFilter;
  }

  const adjustmentFilter = adjustmentsToCssFilter(adjustments);
  if (adjustmentFilter !== 'none') {
    combinedFilter = combinedFilter
      ? `${combinedFilter} ${adjustmentFilter}`
      : adjustmentFilter;
  }

  if (combinedFilter) {
    ctx.filter = combinedFilter;
    const imageData = ctx.getImageData(0, 0, width, height);
    ctx.putImageData(imageData, 0, 0);
  }

  // Apply vignette effect manually if needed
  if (adjustments.vignette > 0) {
    applyVignette(ctx, width, height, adjustments.vignette);
  }
}

// Apply vignette effect
function applyVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );

  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, `rgba(0,0,0,${intensity / 100 * 0.7})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Portrait mode - simulate background blur
export interface PortraitModeConfig {
  enabled: boolean;
  blurIntensity: number; // 0-100
  focusAreaSize: number; // percentage of frame
}

export const DEFAULT_PORTRAIT_CONFIG: PortraitModeConfig = {
  enabled: false,
  blurIntensity: 50,
  focusAreaSize: 60,
};

// Night mode configuration
export interface NightModeConfig {
  enabled: boolean;
  brightnessBoost: number; // 0-100
  noiseReduction: number;  // 0-100
}

export const DEFAULT_NIGHT_CONFIG: NightModeConfig = {
  enabled: false,
  brightnessBoost: 30,
  noiseReduction: 50,
};

// Get CSS filter for night mode preview
export function getNightModeCssFilter(config: NightModeConfig): string {
  if (!config.enabled) return 'none';

  const brightness = 1 + (config.brightnessBoost / 100) * 0.5;
  const contrast = 1 + (config.brightnessBoost / 100) * 0.1;

  return `brightness(${brightness}) contrast(${contrast})`;
}

// Get CSS filter for portrait mode preview (simplified for CSS)
export function getPortraitModeCssFilter(): string {
  // Portrait mode is handled differently - this is just for UI indication
  return 'none';
}

// Camera settings configuration
export interface CameraSettings {
  quality: 'low' | 'medium' | 'high' | 'ultra';
  aspectRatio: '1:1' | '4:3' | '16:9' | '3:2';
  hdr: boolean;
  autoFocus: boolean;
  stabilization: boolean;
  location: boolean;
  mirror: boolean;
}

export const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  quality: 'high',
  aspectRatio: '4:3',
  hdr: false,
  autoFocus: true,
  stabilization: true,
  location: false,
  mirror: true,
};

export const QUALITY_SETTINGS: Record<CameraSettings['quality'], { width: number; height: number; jpegQuality: number }> = {
  low: { width: 800, height: 600, jpegQuality: 0.7 },
  medium: { width: 1280, height: 960, jpegQuality: 0.8 },
  high: { width: 1920, height: 1440, jpegQuality: 0.9 },
  ultra: { width: 2560, height: 1920, jpegQuality: 0.95 },
};

export const ASPECT_RATIOS: Record<CameraSettings['aspectRatio'], { width: number; height: number }> = {
  '1:1': { width: 1, height: 1 },
  '4:3': { width: 4, height: 3 },
  '16:9': { width: 16, height: 9 },
  '3:2': { width: 3, height: 2 },
};

// Calculate actual dimensions based on quality and aspect ratio
export function calculateDimensions(
  quality: CameraSettings['quality'],
  aspectRatio: CameraSettings['aspectRatio']
): { width: number; height: number } {
  const qualityConfig = QUALITY_SETTINGS[quality];
  const ratio = ASPECT_RATIOS[aspectRatio];

  // Use the quality width as base and calculate height based on aspect ratio
  const width = qualityConfig.width;
  const height = Math.round(width * (ratio.height / ratio.width));

  return { width, height };
}

// Crop utilities
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export const DEFAULT_CROP_AREA: CropArea = {
  x: 0,
  y: 0,
  width: 100,
  height: 100,
  rotation: 0,
};

// Apply crop and rotation to image
export async function applyCropAndRotation(
  imageDataUrl: string,
  cropArea: CropArea
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate crop dimensions
      const cropX = (cropArea.x / 100) * img.width;
      const cropY = (cropArea.y / 100) * img.height;
      const cropWidth = (cropArea.width / 100) * img.width;
      const cropHeight = (cropArea.height / 100) * img.height;

      // Handle rotation
      const rotation = cropArea.rotation * Math.PI / 180;
      const cos = Math.abs(Math.cos(rotation));
      const sin = Math.abs(Math.sin(rotation));

      // Calculate rotated dimensions
      const rotatedWidth = cropWidth * cos + cropHeight * sin;
      const rotatedHeight = cropWidth * sin + cropHeight * cos;

      canvas.width = rotatedWidth;
      canvas.height = rotatedHeight;

      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotation);
      ctx.translate(-cropWidth / 2, -cropHeight / 2);

      // Draw cropped and rotated image
      ctx.drawImage(
        img,
        cropX, cropY, cropWidth, cropHeight,
        0, 0, cropWidth, cropHeight
      );

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}

// Apply all edits to an image
export async function applyAllEdits(
  imageDataUrl: string,
  filter: FilterType,
  adjustments: PhotoAdjustments,
  cropArea?: CropArea
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;
      let rotation = 0;

      // Apply crop if provided
      if (cropArea) {
        sourceX = (cropArea.x / 100) * img.width;
        sourceY = (cropArea.y / 100) * img.height;
        sourceWidth = (cropArea.width / 100) * img.width;
        sourceHeight = (cropArea.height / 100) * img.height;
        rotation = cropArea.rotation;
      }

      // Handle rotation for canvas size
      const rotationRad = rotation * Math.PI / 180;
      const cos = Math.abs(Math.cos(rotationRad));
      const sin = Math.abs(Math.sin(rotationRad));
      const rotatedWidth = sourceWidth * cos + sourceHeight * sin;
      const rotatedHeight = sourceWidth * sin + sourceHeight * cos;

      canvas.width = rotatedWidth;
      canvas.height = rotatedHeight;

      // Build combined filter
      let combinedFilter = '';
      if (filter !== 'none') {
        combinedFilter = CAMERA_FILTERS[filter].cssFilter;
      }
      const adjustmentFilter = adjustmentsToCssFilter(adjustments);
      if (adjustmentFilter !== 'none') {
        combinedFilter = combinedFilter
          ? `${combinedFilter} ${adjustmentFilter}`
          : adjustmentFilter;
      }

      // Apply filter
      if (combinedFilter) {
        ctx.filter = combinedFilter;
      }

      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rotationRad);
      ctx.translate(-sourceWidth / 2, -sourceHeight / 2);

      // Draw image
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, sourceWidth, sourceHeight
      );

      // Reset filter for vignette
      ctx.filter = 'none';

      // Apply vignette if needed
      if (adjustments.vignette > 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        applyVignette(ctx, canvas.width, canvas.height, adjustments.vignette);
      }

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageDataUrl;
  });
}
