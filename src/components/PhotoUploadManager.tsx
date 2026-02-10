import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image, Star, Camera, MoveVertical } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateImageFile, formatFileSize, FILE_SIZE_LIMITS } from '@/utils/fileValidation';
import { logger } from '@/utils/prodLogger';
import { motion, Reorder } from 'framer-motion';

interface PhotoUploadManagerProps {
  maxPhotos: number; // 30 for properties, 10 for clients
  currentPhotos: string[];
  onPhotosChange: (photos: string[]) => void;
  uploadType: 'property' | 'profile';
  onUpload?: (file: File) => Promise<string>; // Returns URL
  listingId?: string;
  showCameraButton?: boolean;
}

export function PhotoUploadManager({
  maxPhotos,
  currentPhotos,
  onPhotosChange,
  uploadType,
  onUpload,
  listingId,
  showCameraButton = true,
}: PhotoUploadManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenCamera = () => {
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
      // For profile photos
      const isOwner = location.pathname.includes('/owner');
      navigate(isOwner ? '/owner/camera' : '/client/camera', {
        state: { returnPath: location.pathname },
      });
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remainingSlots = maxPhotos - currentPhotos.length;
    if (remainingSlots <= 0) {
      toast({
        title: "Photo Limit Reached",
        description: `You can only upload ${maxPhotos} photos for ${uploadType}s.`,
        variant: "destructive"
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    // Validate all files first (before setting uploading state)
    const validatedFiles = filesToUpload.map(file => ({
      file,
      validation: validateImageFile(file)
    }));

    // Show validation errors
    const invalidFiles = validatedFiles.filter(f => !f.validation.isValid);
    if (invalidFiles.length > 0) {
      invalidFiles.forEach(({ file, validation }) => {
        toast({
          title: "Invalid File",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive"
        });
      });
    }

    // Get valid files
    const validFiles = validatedFiles.filter(f => f.validation.isValid);
    if (validFiles.length === 0) {
      // Don't start upload if no valid files
      return;
    }

    // Now set uploading state only for valid files
    setUploading(true);
    try {

      const uploadPromises = validFiles.map(async ({ file }) => {
        if (onUpload) {
          // Add timeout to prevent hanging uploads
          const uploadWithTimeout = Promise.race([
            onUpload(file),
            new Promise<string>((_, reject) =>
              setTimeout(() => reject(new Error('Upload timeout')), 30000)
            )
          ]);
          return uploadWithTimeout;
        } else {
          // Fallback: create object URL for demo
          return URL.createObjectURL(file);
        }
      });

      const results = await Promise.allSettled(uploadPromises);

      // Collect successfully uploaded URLs
      const newUrls: string[] = [];
      let successCount = 0;
      let failCount = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          newUrls.push(result.value);
          successCount++;
        } else {
          failCount++;
          if (import.meta.env.DEV) {
            logger.error(`Failed to upload ${validFiles[index].file.name}:`, result.reason);
          }
        }
      });

      // Update photos with successfully uploaded ones
      if (newUrls.length > 0) {
        const updatedPhotos = [...currentPhotos, ...newUrls];
        onPhotosChange(updatedPhotos);
      }

      // Show appropriate success/error message
      if (successCount > 0 && failCount === 0) {
        toast({
          title: "Photos Uploaded",
          description: `${successCount} photo(s) uploaded successfully!`
        });
      } else if (successCount > 0 && failCount > 0) {
        toast({
          title: "Partial Upload",
          description: `${successCount} photo(s) uploaded, ${failCount} failed. Please retry failed uploads.`,
          variant: "default"
        });
      } else {
        toast({
          title: "Upload Failed",
          description: "All photos failed to upload. Please check your connection and try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Upload error:', error);
      }
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [currentPhotos, maxPhotos, uploadType, onUpload, onPhotosChange]);

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = currentPhotos.filter((_, i) => i !== index);
    onPhotosChange(updatedPhotos);
  };

  const handleReorderPhoto = (fromIndex: number, toIndex: number) => {
    const updatedPhotos = [...currentPhotos];
    const [movedPhoto] = updatedPhotos.splice(fromIndex, 1);
    updatedPhotos.splice(toIndex, 0, movedPhoto);
    onPhotosChange(updatedPhotos);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  return (
    <div className="space-y-4">
      {/* Existing Photos Grid - Show First */}
      {currentPhotos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-medium text-white/90">
              Your Photos ({currentPhotos.length}/{maxPhotos}){currentPhotos.length > 1 && ' • Drag to reorder'}
            </p>
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              {currentPhotos.length >= maxPhotos ? 'Full' : `${maxPhotos - currentPhotos.length} left`}
            </Badge>
          </div>
          
          <Reorder.Group
            axis="x"
            values={currentPhotos}
            onReorder={onPhotosChange}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 list-none p-0 m-0"
          >
            {currentPhotos.map((photo, index) => (
              <Reorder.Item
                key={photo}
                value={photo}
                className="relative group list-none"
              >
                <motion.div
                  className="aspect-square relative rounded-lg overflow-hidden border-2 border-white/20 cursor-grab active:cursor-grabbing"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img
                    src={photo}
                    alt={`${uploadType} photo ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />

                  {/* Main Photo Badge */}
                  {index === 0 && (
                    <div className="absolute top-1 left-1">
                      <Badge className="bg-yellow-500 text-black text-[10px] h-5 px-1.5">
                        <Star className="w-2.5 h-2.5 mr-0.5 fill-current" />
                        Main
                      </Badge>
                    </div>
                  )}

                  {/* Drag Handle */}
                  {currentPhotos.length > 1 && (
                    <div className="absolute top-1 right-9 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/60 backdrop-blur-sm rounded p-0.5">
                        <MoveVertical className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Remove Button - Always visible on mobile */}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-1 right-1 w-7 h-7 p-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(index);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>

                  {/* Photo Number */}
                  <Badge
                    variant="outline"
                    className="absolute bottom-1 left-1 bg-black/70 text-white border-white/30 text-[10px] h-5 px-1.5"
                  >
                    #{index + 1}
                  </Badge>
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}

      {/* Upload Area */}
      {currentPhotos.length < maxPhotos && (
        <>
          <div
            className={`border-2 border-dashed rounded-xl transition-all cursor-pointer touch-manipulation ${
              dragOver 
                ? 'border-red-400 bg-red-500/10' 
                : 'border-white/30 hover:border-white/50 bg-white/5'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            <div className="p-6 sm:p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Upload className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" />
                </div>
                <div>
                  <p className="text-sm sm:text-base font-semibold text-white mb-1">
                    {currentPhotos.length === 0 ? 'Add Your Photos' : 'Add More Photos'}
                  </p>
                  <p className="text-xs sm:text-sm text-white/60">
                    Tap to browse • JPG, PNG, WebP, GIF • Max {formatFileSize(FILE_SIZE_LIMITS.IMAGE_MAX_SIZE)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  {showCameraButton && (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCamera();
                      }}
                      className="h-10 sm:h-11 px-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Take Photo
                    </Button>
                  )}
                  <Button
                    type="button"
                    disabled={uploading}
                    className="h-10 sm:h-11 px-6 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
                  >
                    <Image className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : currentPhotos.length === 0 ? 'Choose Photos' : `Add More (${maxPhotos - currentPhotos.length} left)`}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <input
            id="photo-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </>
      )}

      {/* Tips */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Image className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Photo Tips:</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• First photo will be your main/cover image</li>
                <li>• Use high-quality, well-lit photos</li>
                <li>• Show different angles and key features</li>
                {uploadType === 'property' && (
                  <li>• Include exterior, interior, and amenity photos</li>
                )}
                {uploadType === 'profile' && (
                  <li>• Include clear face photos and lifestyle images</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
