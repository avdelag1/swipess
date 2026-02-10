import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoPreviewProps {
  photos: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

function PhotoPreviewComponent({ photos, isOpen, onClose, initialIndex = 0 }: PhotoPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Track loaded images for instant display
  const loadedImagesRef = useRef<Set<string>>(new Set());

  // Preload all images when preview opens
  useEffect(() => {
    if (!isOpen || !photos.length) return;

    // Preload current image first
    const preloadCurrent = () => {
      const src = photos[currentIndex];
      if (src && !loadedImagesRef.current.has(src)) {
        const img = new Image();
        img.fetchPriority = 'high';
        img.decoding = 'async';
        img.onload = () => loadedImagesRef.current.add(src);
        img.src = src;
      }
    };

    // Preload adjacent images
    const preloadAdjacent = () => {
      const indices = [
        (currentIndex + 1) % photos.length,
        (currentIndex - 1 + photos.length) % photos.length
      ];
      indices.forEach(idx => {
        const src = photos[idx];
        if (src && !loadedImagesRef.current.has(src)) {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => loadedImagesRef.current.add(src);
          img.src = src;
        }
      });
    };

    preloadCurrent();
    preloadAdjacent();

    // Preload all remaining in background
    photos.forEach((src, idx) => {
      if (idx !== currentIndex && !loadedImagesRef.current.has(src)) {
        const preloadFn = () => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => loadedImagesRef.current.add(src);
          img.src = src;
        };
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(preloadFn);
        } else {
          setTimeout(preloadFn, 50);
        }
      }
    });
  }, [isOpen, photos, currentIndex]);

  // Reset index when opened with new initialIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const handleDotClick = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (!photos.length) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-background/98"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onClick={onClose}
        >
          <div className="relative h-full flex items-center justify-center p-4">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 text-foreground hover:bg-muted"
              onClick={onClose}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation dots - stable keys */}
            {photos.length > 1 && (
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-10">
                <div className="flex space-x-2">
                  {photos.map((photo, index) => (
                    <button
                      key={`dot-${photo}-${index}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDotClick(index);
                      }}
                      className={`w-2 h-2 rounded-full ${
                        index === currentIndex
                          ? 'bg-primary scale-125'
                          : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                      }`}
                      style={{ transform: 'translateZ(0)' }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Main photo container - INSTANT transitions */}
            <div
              className="relative max-w-4xl max-h-[85vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* No animation wrapper - instant image swap */}
              <div className="relative">
                <img
                  src={photos[currentIndex]}
                  alt={`Profile photo ${currentIndex + 1}`}
                  className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  style={{
                    maxHeight: '85vh',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                  }}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                />
              </div>

              {/* Navigation arrows */}
              {photos.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevious();
                    }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-background/80 hover:bg-background/90 text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>

            {/* Photo counter */}
            {photos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-background/85 text-foreground px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} / {photos.length}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Memoize to prevent re-renders
export const PhotoPreview = memo(PhotoPreviewComponent);