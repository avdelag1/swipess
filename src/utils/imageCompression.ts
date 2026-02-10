/**
 * Image Compression Utility
 * Compresses images before upload to reduce storage costs and improve load times.
 * Uses browser-image-compression for client-side compression.
 */

import imageCompression from 'browser-image-compression';
import { logger } from './prodLogger';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  fileType?: 'image/jpeg' | 'image/webp' | 'image/png';
  quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 1, // Max 1MB after compression
  maxWidthOrHeight: 1920, // Max dimension 1920px
  useWebWorker: true, // Use web worker for non-blocking compression
  fileType: 'image/webp', // WebP for better compression
  quality: 0.85, // 85% quality (good balance)
};

/**
 * Compress an image file before upload
 * @param file - The original image file
 * @param options - Compression options (optional)
 * @returns Compressed file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Skip compression for already small files (< 200KB)
  if (file.size < 200 * 1024) {
    return file;
  }

  // Skip compression for GIFs (animation would be lost)
  if (file.type === 'image/gif') {
    return file;
  }

  try {
    const compressedBlob = await imageCompression(file, {
      maxSizeMB: opts.maxSizeMB!,
      maxWidthOrHeight: opts.maxWidthOrHeight!,
      useWebWorker: opts.useWebWorker!,
      fileType: opts.fileType,
      initialQuality: opts.quality,
    });

    // Create a new File from the compressed Blob
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^.]+$/, '.webp'),
      { type: opts.fileType || 'image/webp' }
    );

    // Log compression stats in development
    if (import.meta.env.DEV) {
      const originalSize = (file.size / 1024).toFixed(1);
      const compressedSize = (compressedFile.size / 1024).toFixed(1);
      const savings = (((file.size - compressedFile.size) / file.size) * 100).toFixed(0);
      logger.log(`[ImageCompression] ${originalSize}KB → ${compressedSize}KB (${savings}% saved)`);
    }

    return compressedFile;
  } catch (error) {
    logger.warn('[ImageCompression] Compression failed, using original:', error);
    return file;
  }
}

/**
 * Compress multiple images in parallel
 * @param files - Array of image files
 * @param options - Compression options
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * Profile photo compression preset - smaller size for avatars
 */
export const PROFILE_COMPRESSION: CompressionOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 800,
  quality: 0.8,
};

/**
 * Listing photo compression preset - larger size for property images
 */
export const LISTING_COMPRESSION: CompressionOptions = {
  maxSizeMB: 1.5,
  maxWidthOrHeight: 1920,
  quality: 0.85,
};

export default {
  compressImage,
  compressImages,
  PROFILE_COMPRESSION,
  LISTING_COMPRESSION,
};
