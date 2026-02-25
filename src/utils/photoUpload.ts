import { supabase } from '@/integrations/supabase/client';
import { logger } from './logger';

export interface UploadProgressCallback {
  (progress: number): void;
}

export interface PhotoUploadOptions {
  userId: string;
  blob: Blob;
  bucket?: string;
  onProgress?: UploadProgressCallback;
}

export interface PhotoUploadResult {
  publicUrl: string;
  path: string;
}

export const uploadPhoto = async ({
  userId,
  blob,
  bucket = 'profile-images',
  onProgress,
}: PhotoUploadOptions): Promise<PhotoUploadResult> => {
  const timestamp = Date.now();
  const unique = Math.random().toString(36).slice(2, 9);
  const fileName = `${userId}/${timestamp}-${unique}.jpg`;

  const file = new File([blob], fileName, { type: 'image/jpeg' });

  if (onProgress) {
    onProgress(10);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (onProgress) {
    onProgress(70);
  }

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  if (onProgress) {
    onProgress(90);
  }

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  if (onProgress) {
    onProgress(100);
  }

  return {
    publicUrl: urlData.publicUrl,
    path: data.path,
  };
};

export const updateProfilePhoto = async (
  userId: string,
  photoUrl: string
): Promise<void> => {
  // Run both updates in parallel for faster execution
  const [profileResult, authResult] = await Promise.allSettled([
    supabase
      .from('profiles')
      .update({
        avatar_url: photoUrl,
        profile_photo_url: photoUrl,
      })
      .eq('id', userId),
    supabase.auth.updateUser({
      data: { avatar_url: photoUrl },
    })
  ]);

  // Check profile update result (critical)
  if (profileResult.status === 'rejected') {
    throw new Error(`Profile update failed: ${profileResult.reason}`);
  }
  if (profileResult.value.error) {
    throw new Error(`Profile update failed: ${profileResult.value.error.message}`);
  }

  // Log auth update errors but don't throw (non-critical)
  if (authResult.status === 'rejected' || authResult.value.error) {
    logger.error('Auth metadata update failed:',
      authResult.status === 'rejected' ? authResult.reason : authResult.value.error
    );
  }
};

export const uploadProfilePhoto = async (
  userId: string,
  blob: Blob,
  onProgress?: UploadProgressCallback
): Promise<string> => {
  const { publicUrl } = await uploadPhoto({
    userId,
    blob,
    bucket: 'profile-images',
    onProgress: (progress) => {
      if (onProgress) {
        onProgress(progress * 0.8);
      }
    },
  });

  await updateProfilePhoto(userId, publicUrl);

  if (onProgress) {
    onProgress(100);
  }

  return publicUrl;
};

/**
 * Batch upload multiple photos in parallel
 * Returns array of public URLs in the same order as input blobs
 */
export const uploadPhotoBatch = async (
  userId: string,
  blobs: Blob[],
  bucket = 'profile-images',
  onProgress?: UploadProgressCallback
): Promise<string[]> => {
  if (blobs.length === 0) return [];

  // Upload all photos in parallel
  const uploadPromises = blobs.map((blob, index) =>
    uploadPhoto({
      userId,
      blob,
      bucket,
      onProgress: (progress) => {
        if (onProgress) {
          // Calculate overall progress across all uploads
          const overallProgress = ((index + (progress / 100)) / blobs.length) * 100;
          onProgress(Math.min(99, Math.floor(overallProgress)));
        }
      },
    })
  );

  const results = await Promise.all(uploadPromises);

  if (onProgress) {
    onProgress(100);
  }

  return results.map(result => result.publicUrl);
};
