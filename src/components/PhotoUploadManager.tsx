import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image, Star, Camera, MoveVertical, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { validateImageFile, formatFileSize, FILE_SIZE_LIMITS } from '@/utils/fileValidation';
import { logger } from '@/utils/prodLogger';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

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
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        toast.error("Capacity Reached", { description: "You've initialized the maximum photo count." });
        return;
      }
    }

    const validFiles = Array.from(files)
      .slice(0, remainingSlots)
      .filter(f => {
        const v = validateImageFile(f);
        if (!v.isValid) toast.error("Invalid Asset", { description: `${f.name}: ${v.error}` });
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

      if (newUrls.length > 0) {
        onPhotosChange([...effectiveCurrentPhotos, ...newUrls]);
        triggerHaptic('success');
        toast.success("Assets Synced", { description: `${newUrls.length} photos added to your nexus.` });
      }
    } catch (error) {
      logger.error('Upload Error:', error);
      toast.error("Transmission Error", { description: "Failed to upload assets. Check your connection." });
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
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 italic">
                  Gallery Matrix ({currentPhotos.length}/{maxPhotos})
                </span>
              </div>
            </div>
            
            <Reorder.Group
              axis="x"
              values={currentPhotos}
              onReorder={(newOrder) => {
                triggerHaptic('light');
                onPhotosChange(newOrder);
              }}
              className="flex gap-4 overflow-x-auto pb-4 no-scrollbar list-none p-0 m-0"
            >
              {currentPhotos.map((photo, index) => (
                <Reorder.Item
                  key={photo}
                  value={photo}
                  className="relative shrink-0 list-none"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <motion.div
                    className={cn(
                      "w-48 h-64 relative rounded-[2rem] overflow-hidden border-2 cursor-grab active:cursor-grabbing shadow-2xl transition-all",
                      index === 0 ? "border-[#EB4898]/50 shadow-[#EB4898]/10" : "border-white/10"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* 🛸 MAIN ASSET INDICATOR */}
                    {index === 0 && (
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-[#EB4898] text-white text-[9px] font-black uppercase italic tracking-widest px-2 py-1 shadow-[0_0_15px_#EB4898]">
                          Primary
                        </Badge>
                      </div>
                    )}

                    {/* 🛸 REMOVE CONTROL */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerHaptic('medium');
                        onPhotosChange(currentPhotos.filter((_, i) => i !== index));
                      }}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-red-500/50 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                       <span className="text-[10px] font-black text-white/40 italic uppercase tracking-widest">Asset #{index + 1}</span>
                    </div>
                  </motion.div>
                </Reorder.Item>
              ))}

              {/* 🛸 INLINE ADD BUTTON */}
              {currentPhotos.length < maxPhotos && (
                 <button
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="w-48 h-64 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all group shrink-0"
                 >
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#EB4898]/50 transition-all">
                       <Plus className="w-6 h-6 text-white/40 group-hover:text-[#EB4898]" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest italic text-white/30 group-hover:text-white/60">Upload Asset</span>
                 </button>
              )}
            </Reorder.Group>
          </div>
        )}
      </AnimatePresence>

      {/* 🛸 MAIN UPLOAD CONTROL (shown if empty) */}
      {currentPhotos.length === 0 && (
        <div
          className={cn(
            "w-full h-80 border-2 border-dashed rounded-[3rem] transition-all cursor-pointer flex items-center justify-center bg-[#0d0d0f]/40 backdrop-blur-xl relative overflow-hidden group",
            dragOver ? "border-[#EB4898] bg-[#EB4898]/10" : "border-white/10 hover:border-white/20"
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('photo-upload')?.click()}
        >
          {/* BACKGROUND AMBIANCE */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(235,72,152,0.05)_0%,transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 text-center flex flex-col items-center gap-6 p-8">
            <div className="w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 group-hover:border-[#EB4898]/50 transition-all shadow-2xl">
              <Camera className="w-8 h-8 text-white/40 group-hover:text-[#EB4898]" />
            </div>
            <div className="space-y-2">
              <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">Initialize Visual Identity</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Drag Assets or Tap to Browse</p>
            </div>

            <div className="flex gap-4">
               {showCameraButton && (
                 <Button 
                   onClick={(e) => { e.stopPropagation(); handleOpenCamera(); }}
                   className="h-14 px-8 rounded-2xl bg-[#EB4898] text-white hover:bg-[#ff5bb0] shadow-[0_15px_30px_rgba(235,72,152,0.3)] group-hover:scale-105 transition-all"
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
        id="photo-upload"
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileSelect(e.target.files)}
      />

      {/* 🛸 PRO TIPS HUD */}
      <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 space-y-4">
        <div className="flex items-center gap-3">
           <Sparkles className="w-4 h-4 text-[#EB4898]" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 italic">Nexus Photo Optimization</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           {[
             { label: 'Primary Asset', desc: 'The first photo is your global representational ID.' },
             { label: 'High Fidelity', desc: 'Clear, well-lit assets significantly increase match parity.' },
             { label: 'Lifestyle', desc: 'Show your natural environments for authentic resonance.' },
             { label: 'Nexus Ready', desc: 'Optimized for mobile-first edge-to-edge viewing.' }
           ].map((tip) => (
             <div key={tip.label} className="space-y-1">
                <p className="text-[9px] font-black uppercase text-[#EB4898] italic">{tip.label}</p>
                <p className="text-[10px] text-white/40 leading-relaxed font-medium uppercase italic">{tip.desc}</p>
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
