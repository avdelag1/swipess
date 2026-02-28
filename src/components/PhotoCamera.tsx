import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, RotateCw, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { applyFilter, FilterType } from '@/utils/photoFilters';
import { triggerHaptic } from '@/utils/haptics';
import { logger } from '@/utils/logger';
import PhotoCrop from './PhotoCrop';
import UploadProgress from './UploadProgress';

interface PhotoCameraProps {
  mode?: 'front' | 'rear';
  onCapture: (blob: Blob, croppedBlob: Blob) => void;
  onClose: () => void;
  autoStart?: boolean;
}

const PhotoCamera: React.FC<PhotoCameraProps> = ({
  mode = 'rear',
  onCapture,
  onClose,
  autoStart = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraMode, setCameraMode] = useState<'front' | 'rear'>(mode);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('normal');
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);

  const touchStartRef = useRef<{ x: number; y: number; distance: number } | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: cameraMode === 'front' ? 'user' : 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1920 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsStreaming(true);
        };
      }
    } catch (err) {
      logger.error('Camera error:', err);
      setError('Camera access denied or unavailable');
    }
  }, [cameraMode]);

  useEffect(() => {
    if (autoStart) {
      startCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [autoStart, startCamera]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      touchStartRef.current = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartRef.current) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scale = distance / touchStartRef.current.distance;
      const newZoom = Math.max(1, Math.min(3, zoom * scale));
      setZoom(newZoom);

      touchStartRef.current = {
        ...touchStartRef.current,
        distance,
      };
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { willReadFrequently: false });

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.save();

    if (cameraMode === 'front') {
      context.scale(-1, 1);
      context.translate(-canvas.width, 0);
    }

    if (zoom > 1) {
      const scaledWidth = canvas.width / zoom;
      const scaledHeight = canvas.height / zoom;
      const x = (canvas.width - scaledWidth) / 2;
      const y = (canvas.height - scaledHeight) / 2;
      context.drawImage(video, x, y, scaledWidth, scaledHeight, 0, 0, canvas.width, canvas.height);
    } else {
      context.drawImage(video, 0, 0);
    }

    context.restore();

    if (filter !== 'normal') {
      applyFilter(canvas, filter);
    }

    await triggerHaptic('light');

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);
    setShowCrop(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setShowCrop(false);
    setZoom(1);
    startCamera();
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (!capturedImage) return;

    fetch(capturedImage).then(res => res.blob()).then(originalBlob => {
      fetch(croppedDataUrl).then(res => res.blob()).then(croppedBlob => {
        onCapture(originalBlob, croppedBlob);
      });
    });
  };

  const switchCamera = () => {
    setCameraMode(prev => prev === 'front' ? 'rear' : 'front');
  };

  useEffect(() => {
    if (isStreaming) {
      startCamera();
    }
  }, [cameraMode, startCamera, isStreaming]);

  if (showCrop && capturedImage) {
    return (
      <PhotoCrop
        imageUrl={capturedImage}
        onComplete={handleCropComplete}
        onRetake={handleRetake}
        facingMode={cameraMode}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-6 w-6" />
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={switchCamera}
            className="text-white hover:bg-white/20"
          >
            <RotateCw className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div
        className="flex-1 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            cameraMode === 'front' && "scale-x-[-1]"
          )}
          style={{
            transform: cameraMode === 'front'
              ? `scaleX(-1) scale(${zoom})`
              : `scale(${zoom})`,
          }}
        />
        <canvas ref={canvasRef} className="hidden" />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-white text-center px-4">{error}</p>
          </div>
        )}

        {zoom > 1 && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
            {zoom.toFixed(1)}x
          </div>
        )}
      </div>

      <div className="bg-black/90 backdrop-blur-sm p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
          {(['normal', 'warm', 'cool', 'blackwhite', 'softglow', 'contrast'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
                filter === f
                  ? "bg-white text-black"
                  : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {f === 'blackwhite' ? 'B&W' : f === 'softglow' ? 'Soft Glow' : f === 'contrast' ? 'High Contrast' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex justify-center items-center gap-8">
          <div className="w-16" />

          <button
            onClick={capturePhoto}
            disabled={!isStreaming}
            className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ touchAction: 'manipulation' }}
          />

          <div className="w-16 flex justify-center">
            {zoom > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(1)}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCamera;
