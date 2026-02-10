import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, MoveVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion, Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';
import { validateImageFile, formatFileSize, FILE_SIZE_LIMITS } from '@/utils/fileValidation';
import { compressImage, LISTING_COMPRESSION } from '@/utils/imageCompression';
import { logger } from '@/utils/prodLogger';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  bucket?: string;
  folder?: string;
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 10,
  bucket = 'profile-images',
  folder = 'uploads'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    try {
      // Validate file using centralized validation
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Compress image before upload for better performance
      const compressedFile = await compressImage(file, LISTING_COMPRESSION);

      // Generate unique filename using crypto for security
      const fileExt = compressedFile.name.split('.').pop() || 'webp';
      const uniqueId = crypto.randomUUID();
      const fileName = `${folder}/${uniqueId}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return publicUrl;

      return publicUrl;
    } catch (error: unknown) {
      const err = error as Error;
      logger.error('Image upload error:', err);
      toast({
        title: 'Upload failed',
        description: err.message || 'Failed to upload image',
        variant: 'destructive'
      });
      return null;
    }
  }, [bucket, folder, toast]);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = maxImages - images.length;
    if (remaining <= 0) {
      toast({
        title: 'Maximum images reached',
        description: `You can only upload up to ${maxImages} images`,
        variant: 'destructive'
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setUploading(true);

    try {
      // Use Promise.allSettled to handle partial failures gracefully
      const uploadPromises = filesToUpload.map(file => uploadImage(file));
      const results = await Promise.allSettled(uploadPromises);
      const successfulUploads = results
        .filter((result): result is PromiseFulfilledResult<string | null> => result.status === 'fulfilled')
        .map(result => result.value)
        .filter((url): url is string => url !== null);

      if (successfulUploads.length > 0) {
        onImagesChange([...images, ...successfulUploads]);
        toast({
          title: 'Success!',
          description: `Uploaded ${successfulUploads.length} image(s)`,
        });
      }
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onImagesChange, toast, uploadImage]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const removeImage = async (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);

    // Optional: Delete from storage
    // const imageUrl = images[index];
    // const path = imageUrl.split('/').slice(-2).join('/');
    // await supabase.storage.from(bucket).remove([path]);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200',
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-gray-400',
          uploading && 'opacity-50 pointer-events-none'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading || images.length >= maxImages}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading images...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Drop images here or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP, GIF up to {formatFileSize(FILE_SIZE_LIMITS.IMAGE_MAX_SIZE)} ({images.length}/{maxImages} images)
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={images.length >= maxImages}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Choose Images
            </Button>
          </div>
        )}
      </div>

      {/* Image Grid with Reorder */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">
              Uploaded Images {images.length > 1 && '(Drag to reorder)'}
            </p>
            {images.length > 0 && (
              <p className="text-xs text-muted-foreground">
                First image is your main photo
              </p>
            )}
          </div>

          <Reorder.Group
            axis="x"
            values={images}
            onReorder={onImagesChange}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {images.map((image, index) => (
              <Reorder.Item
                key={image}
                value={image}
                className="relative group"
              >
                <motion.div
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted border-2 border-transparent hover:border-primary transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* Main Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-md font-medium shadow-md">
                      Main
                    </div>
                  )}

                  {/* Drag Handle */}
                  {images.length > 1 && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 backdrop-blur-sm rounded p-1 cursor-move">
                        <MoveVertical className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute bottom-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        </div>
      )}
    </div>
  );
}
