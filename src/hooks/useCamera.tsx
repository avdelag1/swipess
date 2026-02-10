import { useState, useCallback, useRef } from 'react';
import { Camera, CameraResultType, CameraSource, CameraDirection, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';

export interface CameraSettings {
  quality: number;
  allowEditing: boolean;
  resultType: CameraResultType;
  source: CameraSource;
  direction: CameraDirection;
  width?: number;
  height?: number;
  correctOrientation: boolean;
  saveToGallery: boolean;
  promptLabelHeader?: string;
  promptLabelPhoto?: string;
  promptLabelPicture?: string;
}

export interface CapturedPhoto {
  dataUrl: string;
  webPath?: string;
  format: string;
  base64String?: string;
  saved: boolean;
  timestamp: number;
}

export interface UseCameraOptions {
  mode: 'selfie' | 'listing' | 'general';
  onCapture?: (photo: CapturedPhoto) => void;
  onError?: (error: Error) => void;
}

// Optimized settings for different use cases - maximum quality like native camera
const getOptimalSettings = (mode: UseCameraOptions['mode']): Partial<CameraSettings> => {
  const baseSettings = {
    quality: 100, // Maximum quality
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    correctOrientation: true,
    saveToGallery: false,
  };

  switch (mode) {
    case 'selfie':
      return {
        ...baseSettings,
        direction: CameraDirection.Front,
        source: CameraSource.Camera,
        quality: 100, // Maximum quality for selfies
        width: 2160, // Higher resolution for better quality
        height: 2160,
        promptLabelHeader: 'Profile Photo',
        promptLabelPhoto: 'Take a Selfie',
        promptLabelPicture: 'Choose from Gallery',
      };
    case 'listing':
      return {
        ...baseSettings,
        direction: CameraDirection.Rear,
        source: CameraSource.Camera,
        quality: 100, // Maximum quality for listings
        width: 3840, // 4K width for best quality
        height: 2160,
        promptLabelHeader: 'Listing Photo',
        promptLabelPhoto: 'Take Photo',
        promptLabelPicture: 'Choose from Gallery',
      };
    case 'general':
    default:
      return {
        ...baseSettings,
        direction: CameraDirection.Rear,
        source: CameraSource.Prompt,
        quality: 100,
        width: 2560,
        height: 1920,
        promptLabelHeader: 'Photo',
        promptLabelPhoto: 'Camera',
        promptLabelPicture: 'Gallery',
      };
  }
};

export function useCamera(options: UseCameraOptions) {
  const { mode, onCapture, onError } = options;
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [currentDirection, setCurrentDirection] = useState<CameraDirection>(
    mode === 'selfie' ? CameraDirection.Front : CameraDirection.Rear
  );
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Check if running on native platform
  const isNative = Capacitor.isNativePlatform();

  // Check camera permissions
  const checkPermissions = useCallback(async () => {
    try {
      if (isNative) {
        const permissions = await Camera.checkPermissions();
        const granted = permissions.camera === 'granted' || permissions.camera === 'limited';
        setHasPermission(granted);
        return granted;
      } else {
        // Web fallback - check if getUserMedia is available
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            setHasPermission(true);
            return true;
          } catch {
            setHasPermission(false);
            return false;
          }
        }
        setHasPermission(false);
        return false;
      }
    } catch (error) {
      logger.error('Error checking camera permissions:', error);
      setHasPermission(false);
      return false;
    }
  }, [isNative]);

  // Request camera permissions
  const requestPermissions = useCallback(async () => {
    try {
      if (isNative) {
        const permissions = await Camera.requestPermissions();
        const granted = permissions.camera === 'granted' || permissions.camera === 'limited';
        setHasPermission(granted);

        if (!granted) {
          toast({
            title: 'Camera Permission Required',
            description: 'Please enable camera access in your device settings to take photos.',
            variant: 'destructive',
          });
        }
        return granted;
      } else {
        return await checkPermissions();
      }
    } catch (error) {
      logger.error('Error requesting camera permissions:', error);
      setHasPermission(false);
      return false;
    }
  }, [isNative, checkPermissions]);

  // Start camera stream (web only) - optimized for maximum quality
  const startStream = useCallback(async (video: HTMLVideoElement, direction?: CameraDirection) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const facingMode = (direction || currentDirection) === CameraDirection.Front ? 'user' : 'environment';

      // Request the highest quality camera settings available
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { exact: facingMode },
          // Request 4K resolution, browser will fallback to best available
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          // High frame rate for smooth preview
          frameRate: { ideal: 30, min: 15 },
          // Request advanced features for better quality
          aspectRatio: mode === 'listing' ? { ideal: 16/9 } : { ideal: 1 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback without exact facingMode constraint if device doesn't support it
        const fallbackConstraints: MediaStreamConstraints = {
          video: {
            facingMode: facingMode,
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      }

      streamRef.current = stream;
      videoRef.current = video;
      video.srcObject = stream;
      await video.play();

      return true;
    } catch (error) {
      logger.error('Error starting camera stream:', error);
      onError?.(error as Error);
      return false;
    }
  }, [currentDirection, mode, onError]);

  // Stop camera stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Flip camera direction
  const flipCamera = useCallback(async () => {
    const newDirection = currentDirection === CameraDirection.Front
      ? CameraDirection.Rear
      : CameraDirection.Front;
    setCurrentDirection(newDirection);

    // Restart stream with new direction if active - pass the new direction explicitly
    if (videoRef.current && streamRef.current) {
      await startStream(videoRef.current, newDirection);
    }
  }, [currentDirection, startStream]);

  // Capture photo using native camera
  const captureNative = useCallback(async () => {
    setIsCapturing(true);
    try {
      const settings = getOptimalSettings(mode);

      const photo = await Camera.getPhoto({
        ...settings,
        direction: currentDirection,
        resultType: CameraResultType.DataUrl,
      });

      if (photo.dataUrl) {
        const capturedPhoto: CapturedPhoto = {
          dataUrl: photo.dataUrl,
          webPath: photo.webPath,
          format: photo.format,
          base64String: photo.base64String,
          saved: false,
          timestamp: Date.now(),
        };

        setCapturedPhotos(prev => [...prev, capturedPhoto]);
        onCapture?.(capturedPhoto);

        return capturedPhoto;
      }
      return null;
    } catch (error) {
      logger.error('Error capturing photo:', error);
      onError?.(error as Error);
      toast({
        title: 'Capture Failed',
        description: 'Failed to take photo. Please try again.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [mode, currentDirection, onCapture, onError]);

  // Capture photo from video stream (web fallback)
  const captureFromStream = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) {
      toast({
        title: 'Camera Not Ready',
        description: 'Please wait for the camera to initialize.',
        variant: 'destructive',
      });
      return null;
    }

    setIsCapturing(true);
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');

      // Use optimal dimensions based on mode
      const width = mode === 'listing' ? 1920 : 1080;
      const height = mode === 'listing' ? 1080 : 1080;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Calculate crop to maintain aspect ratio
      const videoAspect = video.videoWidth / video.videoHeight;
      const targetAspect = width / height;

      let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;

      if (videoAspect > targetAspect) {
        sw = video.videoHeight * targetAspect;
        sx = (video.videoWidth - sw) / 2;
      } else {
        sh = video.videoWidth / targetAspect;
        sy = (video.videoHeight - sh) / 2;
      }

      // Mirror front camera
      if (currentDirection === CameraDirection.Front) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);

      const quality = mode === 'listing' ? 0.95 : 0.92;
      const dataUrl = canvas.toDataURL('image/jpeg', quality);

      const capturedPhoto: CapturedPhoto = {
        dataUrl,
        format: 'jpeg',
        saved: false,
        timestamp: Date.now(),
      };

      setCapturedPhotos(prev => [...prev, capturedPhoto]);
      onCapture?.(capturedPhoto);

      return capturedPhoto;
    } catch (error) {
      logger.error('Error capturing from stream:', error);
      onError?.(error as Error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [mode, currentDirection, onCapture, onError]);

  // Pick from gallery
  const pickFromGallery = useCallback(async () => {
    setIsCapturing(true);
    try {
      if (isNative) {
        const settings = getOptimalSettings(mode);

        const photo = await Camera.getPhoto({
          ...settings,
          source: CameraSource.Photos,
          resultType: CameraResultType.DataUrl,
        });

        if (photo.dataUrl) {
          const capturedPhoto: CapturedPhoto = {
            dataUrl: photo.dataUrl,
            webPath: photo.webPath,
            format: photo.format,
            base64String: photo.base64String,
            saved: false,
            timestamp: Date.now(),
          };

          setCapturedPhotos(prev => [...prev, capturedPhoto]);
          onCapture?.(capturedPhoto);

          return capturedPhoto;
        }
      } else {
        // Web fallback - use file input
        return new Promise<CapturedPhoto | null>((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => {
                const capturedPhoto: CapturedPhoto = {
                  dataUrl: reader.result as string,
                  format: file.type.split('/')[1] || 'jpeg',
                  saved: false,
                  timestamp: Date.now(),
                };
                setCapturedPhotos(prev => [...prev, capturedPhoto]);
                onCapture?.(capturedPhoto);
                resolve(capturedPhoto);
              };
              reader.readAsDataURL(file);
            } else {
              resolve(null);
            }
          };
          input.click();
        });
      }
      return null;
    } catch (error) {
      logger.error('Error picking from gallery:', error);
      onError?.(error as Error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isNative, mode, onCapture, onError]);

  // Main capture function - automatically chooses native or web
  const capture = useCallback(async () => {
    if (isNative) {
      return await captureNative();
    } else {
      return await captureFromStream();
    }
  }, [isNative, captureNative, captureFromStream]);

  // Add a photo directly (used for custom capture with effects)
  const addPhoto = useCallback((photo: CapturedPhoto) => {
    setCapturedPhotos(prev => [...prev, photo]);
    onCapture?.(photo);
  }, [onCapture]);

  // Update a photo at a specific index (used for editing)
  const updatePhoto = useCallback((index: number, photo: CapturedPhoto) => {
    setCapturedPhotos(prev => {
      const updated = [...prev];
      if (index >= 0 && index < updated.length) {
        updated[index] = photo;
      }
      return updated;
    });
  }, []);

  // Remove a captured photo
  const removePhoto = useCallback((index: number) => {
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all captured photos
  const clearPhotos = useCallback(() => {
    setCapturedPhotos([]);
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    stopStream();
    clearPhotos();
  }, [stopStream, clearPhotos]);

  return {
    // State
    isCapturing,
    capturedPhotos,
    currentDirection,
    hasPermission,
    isNative,

    // Permissions
    checkPermissions,
    requestPermissions,

    // Camera stream (web)
    startStream,
    stopStream,

    // Camera actions
    capture,
    captureNative,
    captureFromStream,
    pickFromGallery,
    flipCamera,

    // Photo management
    addPhoto,
    updatePhoto,
    removePhoto,
    clearPhotos,
    cleanup,

    // Settings
    getOptimalSettings: () => getOptimalSettings(mode),
  };
}

export default useCamera;
