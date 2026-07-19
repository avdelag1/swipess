import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Plus, Sparkles } from 'lucide-react';
import { appToast } from '@/utils/appNotification';
import { validateImageFile } from '@/utils/fileValidation';
import { logger } from '@/utils/prodLogger';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { DraggablePhotoGrid } from './DraggablePhotoGrid';

interface PhotoUploadManagerProps {
  maxPhotos: number;
  currentPhotos: string[];
  onPhotosChange: (photos: string[]) => void;
  uploadType: 'property' | 'profile';
  onUpload?: (file: File) => Promise<string>;
  listingId?: string;
  showCameraButton?: boolean;
  replaceOnFull?: boolean;
}

export function PhotoUploadManager({
  maxPhotos,
  currentPhotos,
  onPhotosChange,
  uploadType,
  onUpload,
  listingId,
  showCameraButton = true,
  replaceOnFull = false,
}: PhotoUploadManagerProps) {
  const [_uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLight } = useAppTheme();
  // Direct ref to THIS instance's file input. A global getElementById lookup
  // can hit the wrong element (portals, duplicate mounts) on Android WebView.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCamera = () => {
    triggerHaptic('medium');
    if (uploadType === 'property') {
      navigate('/owner/camera/listing', {
        state: {
          returnPath: location.pathname,
          listingId,
          existingPhotos: currentPhotos,
          maxPhotos,
        },
      });
    } else {
      const isOwner = location.pathname.includes('/owner');
      navigate(isOwner ? '/owner/camera' : '/client/camera', {
        state: { returnPath: location.pathname },
      });
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    triggerHaptic('light');

    let effectiveCurrentPhotos = currentPhotos;
    let remainingSlots = maxPhotos - currentPhotos.length;

    if (remainingSlots <= 0) {
      if (replaceOnFull) {
        onPhotosChange([]);
        effectiveCurrentPhotos = [];
        remainingSlots = maxPhotos;
      } else {
        appToast.error("Capacity Reached");
        return;
      }
    }

    const validFiles = Array.from(files)
      .slice(0, remainingSlots)
      .filter(f => {
        const v = validateImageFile(f);
        if (!v.isValid) appToast.error("Invalid Asset");
        return v.isValid;
      });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = validFiles.map(async file => {
        if (onUpload) return onUpload(file);
        return URL.createObjectURL(file);
      });

      const results = await Promise.allSettled(uploadPromises);
      const newUrls = results
        .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled')
        .map(r => r.value);
      const failedCount = results.filter(r => r.status === 'rejected').length;

      if (newUrls.length > 0) {
        onPhotosChange([...effectiveCurrentPhotos, ...newUrls]);
        triggerHaptic('success');
        appToast.success("Assets Synced");
      }
      if (failedCount > 0) {
        appToast.error("Upload Issue");
      }
    } catch (error) {
      logger.error('Upload Error:', error);
      appToast.error("Transmission Error");
    } finally {
      setUploading(false);
    }
  }, [currentPhotos, maxPhotos, onPhotosChange, onUpload, replaceOnFull]);

  return (
    <div className="space-y-6">
      {/* 🛸 PHOTO GALLERY REORDERING */}
      <AnimatePresence mode="popLayout">
        {currentPhotos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EB4898]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">
                  Gallery Engine ({currentPhotos.length}/{maxPhotos})
                </span>
              </div>
            </div>

            {/* 🛸 DRAGGABLE GRID */}
            <DraggablePhotoGrid
              photos={currentPhotos}
              isLight={isLight}
              onReorder={onPhotosChange}
              onRemove={(index) => onPhotosChange(currentPhotos.filter((_, i) => i !== index))}
              addSlot={
                currentPhotos.length < maxPhotos ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="w-full h-full rounded-[1.5rem] border-2 border-dashed border-primary/35 bg-secondary flex flex-col items-center justify-center gap-3 hover:bg-accent transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center group-hover:scale-110 group-hover:border-primary/50 transition-all">
                      <Plus className="w-5 h-5 text-foreground/70 group-hover:text-primary" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest italic text-secondary-foreground">Add Photo</span>
                  </button>
                ) : undefined
              }
            />

            <p className="text-[10px] font-semibold text-center text-muted-foreground">
              Hold &amp; drag any photo to reorder · First photo is the cover
            </p>
          </div>
        )}
      </AnimatePresence>

      {/* 🛸 MAIN UPLOAD CONTROL (shown if empty) */}
      {currentPhotos.length === 0 && (
        <div
          className={cn(
            "w-full h-80 border-2 border-dashed rounded-[3rem] transition-all cursor-pointer flex items-center justify-center bg-secondary backdrop-blur-xl relative overflow-hidden group",
            dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/35"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
        >
          {/* BACKGROUND AMBIANCE */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(235,72,152,0.05)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 text-center flex flex-col items-center gap-6 p-8">
            <div className="w-20 h-20 rounded-[2rem] bg-background border border-border flex items-center justify-center group-hover:scale-110 group-hover:border-primary/50 transition-all shadow-2xl">
              <Camera className="w-8 h-8 text-foreground/70 group-hover:text-primary" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase italic tracking-tighter text-foreground">Initialize Visual Identity</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Drag Assets or Tap to Browse</p>
            </div>

            <div className="flex gap-4">
               {showCameraButton && (
                 <Button 
                   onClick={(e) => { e.stopPropagation(); handleOpenCamera(); }}
                    className="h-14 px-8 rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_15px_30px_hsl(var(--primary)/0.3)] group-hover:scale-105 transition-all"
                 >
                    <Camera className="w-4 h-4 mr-2" />
                    <span className="font-black italic uppercase tracking-widest text-xs">Capture</span>
                 </Button>
               )}
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        id="photo-upload"
        type="file"
        multiple
        accept="image/*"
        // keep `accept` permissive for HEIC/etc.
        className="hidden"
        onChange={(e) => { handleFileSelect(e.target.files); e.target.value = ''; }}
      />

      {/* 🛸 PRO TIPS HUD */}
      <div className="p-6 rounded-[2rem] bg-secondary border border-border space-y-4">
        <div className="flex items-center gap-3">
           <Sparkles className="w-4 h-4 text-[#EB4898]" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground italic">Swipess Photo Optimization</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {[
             { label: 'Drag to Reorder', desc: 'Hold & drag any photo to rearrange. First photo is always the cover.' },
             { label: 'High Fidelity', desc: 'Clear, well-lit assets significantly increase match parity.' },
             { label: 'Lifestyle', desc: 'Show your natural environments for authentic resonance.' },
             { label: 'Swipess Ready', desc: 'Optimized for mobile-first edge-to-edge viewing.' }
           ].map((tip) => (
             <div key={tip.label} className="space-y-1">
                <p className="text-[9px] font-black uppercase text-[#EB4898] italic">{tip.label}</p>
                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium uppercase italic">{tip.desc}</p>
             </div>
           ))}
        </div>
      </div>
    </div>
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }
}
