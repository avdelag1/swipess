import { supabase } from '@/integrations/supabase/client';
import { logger } from './prodLogger';
import { compressImage, LISTING_COMPRESSION, PROFILE_COMPRESSION } from './imageCompression';

export interface UploadProgressCallback {
  (progress: number): void;
}

/**
 * Run an already-uploaded image through the moderate-image edge function and
 * THROW if it's flagged (nudity / violence / contact-info-in-photo). Fails OPEN
 * on any infra/network error so a moderation outage never blocks a legit upload.
 * Callers should delete the rejected file from storage after catching.
 */
export async function assertImageSafe(publicUrl: string): Promise<void> {
  let verdict: { safe?: boolean; reasons?: string[] } | null = null;
  try {
    const { data } = await supabase.functions.invoke('moderate-image', { body: { imageUrl: publicUrl } });
    verdict = data as { safe?: boolean; reasons?: string[] } | null;
  } catch (e) {
    logger.warn('[Moderation] image check failed (fail-open):', e);
    return; // infra error → don't block
  }
  if (verdict && verdict.safe === false) {
    const reason = Array.isArray(verdict.reasons) && verdict.reasons[0] ? verdict.reasons[0] : 'it violates our content policy';
    const err = new Error(`This photo can't be used — ${reason}. Please choose another.`);
    (err as Error & { moderationBlocked?: boolean }).moderationBlocked = true;
    throw err;
  }
}

export interface PhotoUploadOptions {
  userId: string;
  blob: Blob;
  bucket?: string;
  onProgress?: UploadProgressCallback;
  skipCompression?: boolean;
}

export interface PhotoUploadResult {
  publicUrl: string;
  path: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getUploadFailureMessage = (error: unknown) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'unknown error';
};

export const uploadPhoto = async ({
  userId,
  blob,
  bucket = 'profile-images',
  onProgress,
  skipCompression,
}: PhotoUploadOptions): Promise<PhotoUploadResult> => {
  const timestamp = Date.now();
  const unique = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 11);
  const rawFile = blob instanceof File
    ? blob
    : new File([blob], `${timestamp}-${unique}.jpg`, { type: blob.type || 'image/jpeg' });
  const shouldNormalizeImage = bucket.includes('images') && !skipCompression;
  const file = shouldNormalizeImage
    ? await compressImage(rawFile, bucket === 'listing-images' ? LISTING_COMPRESSION : PROFILE_COMPRESSION)
    : rawFile;
  const ext = file.type === 'image/webp' ? 'webp' : file.type === 'image/png' ? 'png' : 'jpg';

  if (onProgress) {
    onProgress(10);
  }

  // Retry transient upload failures (flaky mobile networks, brief 5xx, etc.)
  const MAX_ATTEMPTS = 3;
  let lastError: Error | null = null;
  let data: { path: string } | null = null;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const attemptSuffix = attempt === 0 ? '' : `-r${attempt}`;
    const fileName = `${userId}/${timestamp}-${unique}${attemptSuffix}.${ext}`;
    const result = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (!result.error) {
      data = result.data;
      break;
    }

    lastError = new Error(result.error.message);
    const message = result.error.message?.toLowerCase() || '';
    const isFatal =
      message.includes('payload too large') ||
      message.includes('not allowed') ||
      message.includes('row-level security') ||
      message.includes('invalid') ||
      message.includes('unauthorized');
    if (isFatal || attempt === MAX_ATTEMPTS - 1) {
      break;
    }

    // Small backoff helps unstable mobile networks recover instead of retrying instantly.
    await sleep(350 * (attempt + 1));
  }

  if (onProgress) {
    onProgress(70);
  }

  if (!data) {
    throw new Error(`Upload failed: ${lastError?.message || 'unknown error'}`);
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
      })
      .eq('user_id', userId),
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
  onProgress?: UploadProgressCallback,
  skipCompression = false
): Promise<string[]> => {
  if (blobs.length === 0) return [];

  const perFileProgress = blobs.map(() => 0);
  let lastOverallProgress = 0;
  const emitProgress = (next: number) => {
    if (!onProgress) return;
    const safeNext = Math.min(99, Math.max(lastOverallProgress, Math.floor(next)));
    if (safeNext > lastOverallProgress) {
      lastOverallProgress = safeNext;
      onProgress(safeNext);
    }
  };

  // Upload all photos in parallel, but keep progress monotonic so the UI never jumps backward.
  const uploadPromises = blobs.map((blob, index) =>
    uploadPhoto({
      userId,
      blob,
      bucket,
      skipCompression,
      onProgress: (progress) => {
        perFileProgress[index] = Math.max(perFileProgress[index], progress);
        const totalProgress = perFileProgress.reduce((sum, current) => sum + current, 0) / blobs.length;
        emitProgress(totalProgress);
      },
    })
  );

  // Hard timeout so a stalled upload can never freeze the UI silently.
  // Scales with batch size — single photo gets ~24s, full listing batches get up to 2 minutes.
  const TIMEOUT_MS = Math.min(15000 + blobs.length * 9000, 120000);
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Upload timed out after ${Math.round(TIMEOUT_MS / 1000)}s. Please try again with a stronger connection or smaller photos.`)),
      TIMEOUT_MS
    );
  });

  try {
    const results = await Promise.race([
      Promise.allSettled(uploadPromises),
      timeout,
    ]) as PromiseSettledResult<PhotoUploadResult>[];

    const successfulUploads = results
      .filter((result): result is PromiseFulfilledResult<PhotoUploadResult> => result.status === 'fulfilled')
      .map((result) => result.value);
    const failedUploads = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

    if (failedUploads.length > 0) {
      // Keep storage tidy and avoid publishing a listing with a missing/reordered photo set.
      const uploadedPaths = successfulUploads.map((result) => result.path).filter(Boolean);
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage.from(bucket).remove(uploadedPaths);
        if (cleanupError) {
          logger.warn('[PhotoUpload] Failed to clean up partial batch upload:', cleanupError);
        }
      }

      const firstFailure = failedUploads[0]?.reason;
      throw new Error(
        `${failedUploads.length} of ${blobs.length} photo upload${blobs.length === 1 ? '' : 's'} failed. ${getUploadFailureMessage(firstFailure)}`
      );
    }

    if (onProgress) {
      lastOverallProgress = 100;
      onProgress(100);
    }

    return successfulUploads.map(result => result.publicUrl);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

