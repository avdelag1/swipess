import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CameraCapture } from '@/components/CameraCapture';
import { CapturedPhoto } from '@/hooks/useCamera';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';

// Upload timeout in milliseconds (60 seconds for multiple photos)
const UPLOAD_TIMEOUT = 60000;

interface LocationState {
  returnPath?: string;
  listingId?: string;
  existingPhotos?: string[];
  maxPhotos?: number;
}

export default function OwnerListingCamera() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }
    };
  }, []);

  const state = location.state as LocationState | undefined;
  const returnPath = state?.returnPath || '/owner/properties';
  const listingId = state?.listingId;
  const existingPhotos = state?.existingPhotos || [];
  const maxPhotos = state?.maxPhotos || 30;

  // Calculate remaining slots
  const remainingSlots = maxPhotos - existingPhotos.length;

  const handleComplete = useCallback(async (photos: CapturedPhoto[]) => {
    if (photos.length === 0 || !user) {
      navigate(returnPath);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Set upload timeout to prevent stuck loading state
    uploadTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        setIsUploading(false);
        setUploadProgress(0);
        toast({
          title: 'Upload Timeout',
          description: 'Upload took too long. Please try again.',
          variant: 'destructive',
        });
        navigate(returnPath);
      }
    }, UPLOAD_TIMEOUT);

    try {
      const uploadedUrls: string[] = [];
      const totalPhotos = photos.length;

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];

        // Convert data URL to blob
        const response = await fetch(photo.dataUrl);
        const blob = await response.blob();

        // Create unique filename
        const fileExt = photo.format || 'jpg';
        const timestamp = Date.now();
        const fileName = listingId
          ? `listings/${listingId}/${timestamp}_${i}.${fileExt}`
          : `owners/${user.id}/listing_photos/${timestamp}_${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('profile-images')
          .upload(fileName, blob, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          logger.error('Error uploading photo:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
        setUploadProgress(Math.round(((i + 1) / totalPhotos) * 100));
      }

      if (uploadedUrls.length === 0) {
        throw new Error('No photos were uploaded successfully');
      }

      // If we have a listing ID, update the listing with new photos
      if (listingId) {
        const allPhotos = [...existingPhotos, ...uploadedUrls];

        const { error: updateError } = await supabase
          .from('listings')
          .update({
            images: allPhotos,
          })
          .eq('id', listingId);

        if (updateError) {
          throw updateError;
        }
      }

      // Clear timeout on success
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }

      if (isMountedRef.current) {
        toast({
          title: 'Photos Uploaded!',
          description: `${uploadedUrls.length} photo(s) have been saved successfully.`,
        });

        // Navigate back with the uploaded URLs in state
        navigate(returnPath, {
          state: {
            newPhotos: uploadedUrls,
            allPhotos: [...existingPhotos, ...uploadedUrls],
          },
        });
      }
    } catch (error) {
      // Clear timeout on error
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
      }

      if (isMountedRef.current) {
        toast({
          title: 'Upload Failed',
          description: 'Some photos failed to upload. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  }, [user, navigate, returnPath, listingId, existingPhotos]);

  const handleCancel = useCallback(() => {
    navigate(returnPath);
  }, [navigate, returnPath]);

  if (isUploading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
        <div className="relative w-24 h-24 mb-6">
          {/* Progress ring */}
          <svg className="w-24 h-24 transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-white/20"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (uploadProgress / 100) * 251.2}
              className="text-orange-500 transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">{uploadProgress}%</span>
          </div>
        </div>
        <p className="text-white text-lg">Uploading listing photos...</p>
        <p className="text-white/60 text-sm mt-2">Please don't close this screen</p>
      </div>
    );
  }

  return (
    <CameraCapture
      mode="listing"
      maxPhotos={remainingSlots}
      onComplete={handleComplete}
      onCancel={handleCancel}
      title="Listing Photos"
    />
  );
}
