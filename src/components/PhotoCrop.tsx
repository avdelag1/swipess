import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { detectFaceCenter } from '@/utils/faceDetection';
import { compressImage } from '@/utils/imageCompression';
import { logger } from '@/utils/logger';

interface PhotoCropProps {
  imageUrl: string;
  onComplete: (croppedDataUrl: string) => void;
  onRetake: () => void;
  facingMode?: 'front' | 'rear';
}

const PhotoCrop: React.FC<PhotoCropProps> = ({
  imageUrl,
  onComplete,
  onRetake,
  facingMode = 'front',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const updateCropPreview = useCallback(() => {
    if (!previewCanvasRef.current || !imageRef.current) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageRef.current;
    const cropSize = cropArea.size / scale;

    canvas.width = 256;
    canvas.height = 256;

    ctx.drawImage(
      img,
      cropArea.x / scale,
      cropArea.y / scale,
      cropSize,
      cropSize,
      0,
      0,
      256,
      256
    );
  }, [cropArea, scale]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = async () => {
      imageRef.current = img;

      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      setContainerSize({ width: containerWidth, height: containerHeight });

      const imgAspect = img.width / img.height;
      const containerAspect = containerWidth / containerHeight;

      let displayWidth, displayHeight, newScale;

      if (imgAspect > containerAspect) {
        displayHeight = containerHeight;
        displayWidth = containerHeight * imgAspect;
        newScale = displayHeight / img.height;
      } else {
        displayWidth = containerWidth;
        displayHeight = containerWidth / imgAspect;
        newScale = displayWidth / img.width;
      }

      setScale(newScale);

      const cropSize = Math.min(displayWidth, displayHeight) * 0.85;

      let centerX = (displayWidth - cropSize) / 2;
      let centerY = (displayHeight - cropSize) / 2;

      if (facingMode === 'front') {
        try {
          const faceCenter = await detectFaceCenter(img);
          if (faceCenter) {
            centerX = faceCenter.x * newScale - cropSize / 2;
            centerY = faceCenter.y * newScale - cropSize / 2;

            centerX = Math.max(0, Math.min(centerX, displayWidth - cropSize));
            centerY = Math.max(0, Math.min(centerY, displayHeight - cropSize));
          }
        } catch (error) {
          // Face detection not available, using center crop
        }
      }

      setCropArea({ x: centerX, y: centerY, size: cropSize });

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
        }
      }
    };
  }, [imageUrl, facingMode]);

  useEffect(() => {
    updateCropPreview();
  }, [updateCropPreview]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const isInsideCrop =
      x >= cropArea.x &&
      x <= cropArea.x + cropArea.size &&
      y >= cropArea.y &&
      y <= cropArea.y + cropArea.size;

    if (isInsideCrop) {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStart.x;
    const y = e.clientY - rect.top - dragStart.y;

    const maxX = containerSize.width - cropArea.size;
    const maxY = containerSize.height - cropArea.size;

    setCropArea({
      ...cropArea,
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setDragStart({ x: distance, y: cropArea.size });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scaleFactor = distance / dragStart.x;
      const newSize = Math.max(
        100,
        Math.min(
          Math.min(containerSize.width, containerSize.height),
          dragStart.y * scaleFactor
        )
      );

      const deltaSize = newSize - cropArea.size;
      setCropArea({
        x: Math.max(0, Math.min(cropArea.x - deltaSize / 2, containerSize.width - newSize)),
        y: Math.max(0, Math.min(cropArea.y - deltaSize / 2, containerSize.height - newSize)),
        size: newSize,
      });
    }
  };

  const handleConfirm = async () => {
    if (!imageRef.current) return;

    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cropSize = cropArea.size / scale;
      const targetSize = Math.min(2048, cropSize);

      canvas.width = targetSize;
      canvas.height = targetSize;

      ctx.drawImage(
        imageRef.current,
        cropArea.x / scale,
        cropArea.y / scale,
        cropSize,
        cropSize,
        0,
        0,
        targetSize,
        targetSize
      );

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.75);
      });

      // Convert Blob to File for compressImage compatibility
      const file = new File([blob], 'cropped-photo.jpg', { type: 'image/jpeg', lastModified: Date.now() });

      const compressed = await compressImage(file, {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        onComplete(reader.result as string);
      };
      reader.readAsDataURL(compressed);
    } catch (error) {
      logger.error('Crop error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        <h2 className="text-white text-lg font-semibold">Adjust Photo</h2>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 m-auto"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />

        <div
          className="absolute border-4 border-white rounded-lg shadow-2xl cursor-move"
          style={{
            left: cropArea.x,
            top: cropArea.y,
            width: cropArea.size,
            height: cropArea.size,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="border border-white/30" />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/90 backdrop-blur-sm p-4 space-y-4">
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-lg overflow-hidden border-2 border-white/30">
            <canvas ref={previewCanvasRef} className="w-full h-full" />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onRetake}
            disabled={isProcessing}
            className="flex-1 h-14 text-lg"
          >
            <X className="mr-2 h-5 w-5" />
            Retake
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 h-14 text-lg"
          >
            <Check className="mr-2 h-5 w-5" />
            {isProcessing ? 'Processing...' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCrop;
