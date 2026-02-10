/**
 * File Validation Utilities
 * 
 * Standardized file validation for images and documents across the application.
 * This ensures consistent limits and MIME type validation.
 */

// Standard file size limits
export const FILE_SIZE_LIMITS = {
  IMAGE_MAX_SIZE: 10 * 1024 * 1024, // 10MB for images
  DOCUMENT_MAX_SIZE: 20 * 1024 * 1024, // 20MB for documents
} as const;

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  IMAGES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  DOCUMENTS: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  ],
} as const;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  DOCUMENTS: ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'],
} as const;

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): FileValidationResult {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.IMAGES.includes(file.type as any)) {
    return {
      isValid: false,
      error: `Invalid file type. Only JPG, PNG, WebP, and GIF images are allowed.`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.IMAGES.includes(extension as any)) {
    return {
      isValid: false,
      error: `Invalid file extension. Only ${ALLOWED_EXTENSIONS.IMAGES.join(', ')} are allowed.`,
    };
  }

  // Check file size
  if (file.size > FILE_SIZE_LIMITS.IMAGE_MAX_SIZE) {
    return {
      isValid: false,
      error: `Image too large. Maximum size is ${formatFileSize(FILE_SIZE_LIMITS.IMAGE_MAX_SIZE)} (file is ${formatFileSize(file.size)}).`,
    };
  }

  return { isValid: true };
}

/**
 * Validate document file
 */
export function validateDocumentFile(file: File): FileValidationResult {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.DOCUMENTS.includes(file.type as any)) {
    return {
      isValid: false,
      error: `Invalid file type. Only PDF, images (JPG, PNG, WebP), and Word documents are allowed.`,
    };
  }

  // Check file extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.DOCUMENTS.includes(extension as any)) {
    return {
      isValid: false,
      error: `Invalid file extension. Only ${ALLOWED_EXTENSIONS.DOCUMENTS.join(', ')} are allowed.`,
    };
  }

  // Check file size
  if (file.size > FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE) {
    return {
      isValid: false,
      error: `Document too large. Maximum size is ${formatFileSize(FILE_SIZE_LIMITS.DOCUMENT_MAX_SIZE)} (file is ${formatFileSize(file.size)}).`,
    };
  }

  return { isValid: true };
}

/**
 * Validate multiple files
 */
export function validateMultipleFiles(
  files: File[],
  type: 'image' | 'document'
): { validFiles: File[]; errors: string[] } {
  const validFiles: File[] = [];
  const errors: string[] = [];

  const validator = type === 'image' ? validateImageFile : validateDocumentFile;

  files.forEach((file) => {
    const result = validator(file);
    if (result.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${result.error}`);
    }
  });

  return { validFiles, errors };
}
