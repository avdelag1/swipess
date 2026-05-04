/**
 * UnifiedListingForm - Creates listings for all categories
 * Updated to match new normalized schema with JSONB arrays
 */
import { useState, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/prodLogger';
import { Upload, X, Bike, ChevronRight, Shield } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { CategorySelector, Category, Mode } from './CategorySelector';
import { MotorcycleListingForm, MotorcycleFormData } from './MotorcycleListingForm';
import { BicycleListingForm, BicycleFormData } from './BicycleListingForm';
import { PropertyListingForm } from './PropertyListingForm';
import { WorkerListingForm, WorkerFormData } from './WorkerListingForm';
import { validateImageFile } from '@/utils/fileValidation';
import { uploadPhotoBatch } from '@/utils/photoUpload';
import { validateContent } from '@/utils/contactInfoValidation';
import { useAnonymousDrafts } from '@/hooks/useAnonymousDrafts';
import { useAuth } from '@/hooks/useAuth';
import { ListingVideoUpload } from './video/ListingVideoUpload';
import { ListingSuccessCelebration } from './ListingSuccessCelebration';
import { uiSounds } from '@/utils/uiSounds';
import { Loader2 } from 'lucide-react';

interface EditingListing {
  id?: string;
  category?: 'property' | 'motorcycle' | 'bicycle' | 'worker';
  mode?: 'rent' | 'sale' | 'both';
  images?: string[];
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

interface UnifiedListingFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingProperty?: EditingListing;
}

const fastSpring = { type: "spring" as const, stiffness: 600, damping: 35, mass: 0.6 };
const stagger = { visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } } };
const itemFadeScale = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: fastSpring }
};

export function UnifiedListingForm({ isOpen, onClose, editingProperty }: UnifiedListingFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('property');
  const [selectedMode, setSelectedMode] = useState<Mode>('rent');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat?: number; lng?: number }>({});
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Use refs to track latest values for mutation (avoids closure staleness)
  const imagesRef = useRef(images);
  const imageFilesRef = useRef(imageFiles);

  // Keep refs in sync with state
  useEffect(() => { imagesRef.current = images; }, [images]);
  useEffect(() => { imageFilesRef.current = imageFiles; }, [imageFiles]);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { saveListingDraft } = useAnonymousDrafts();

  const getMaxPhotos = () => {
    return 10;
  };

  const maxPhotos = getMaxPhotos();

  useEffect(() => {
    if (!isOpen) return;

    if (editingProperty?.id) {
      setEditingId(editingProperty.id);
      setSelectedCategory(editingProperty.category || 'property');
      setSelectedMode(editingProperty.mode || 'rent');
      setImages(editingProperty.images || []);
      setImageFiles([]);
      setFormData(editingProperty);
      setLocation({ lat: editingProperty.latitude, lng: editingProperty.longitude });
      setVideoUrl((editingProperty.video_url as string) || null);
    } else if (editingProperty?.category) {
      setEditingId(null);
      setSelectedCategory(editingProperty.category);
      setSelectedMode(editingProperty.mode || 'rent');
      setImages(editingProperty.images || []);
      setImageFiles([]);
      setFormData(editingProperty.images ? editingProperty : { mode: editingProperty.mode || 'rent' });
      setLocation({ lat: editingProperty.latitude, lng: editingProperty.longitude });
      setVideoUrl((editingProperty.video_url as string) || null);
    } else {
      setEditingId(null);
      setSelectedCategory('property');
      setSelectedMode('rent');
      setImages([]);
      setImageFiles([]);
      setFormData({ mode: 'rent' });
      setLocation({});
      setVideoUrl(null);
    }
  }, [editingProperty, isOpen]);

  const createListingMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Use refs to get latest values (avoids stale closure)
      const currentImages = imagesRef.current;
      const currentImageFiles = imageFilesRef.current;

      if (currentImages.length + currentImageFiles.length < 1) {
        throw new Error('At least 1 photo required');
      }

      // Content moderation: check title, description, house_rules
      const fieldsToCheck = [
        { text: formData.title as string, label: 'Title' },
        { text: formData.description as string, label: 'Description' },
        { text: formData.house_rules as string, label: 'House Rules' },
      ];
      for (const field of fieldsToCheck) {
        if (field.text) {
          const result = validateContent(field.text);
          if (!result.isClean) {
            throw new Error(`${field.label}: ${result.message}`);
          }
        }
      }

      let uploadedImageUrls: string[] = [];
      if (currentImageFiles.length > 0) {
        uploadedImageUrls = await uploadPhotoBatch(user.user.id, currentImageFiles, 'listing-images');
      }

      const allImages = [...currentImages, ...uploadedImageUrls];

      // Convert arrays to JSONB format
      const amenities = formData.amenities ? JSON.parse(JSON.stringify(formData.amenities)) : [];
      const services_included = formData.services_included ? JSON.parse(JSON.stringify(formData.services_included)) : [];
      const skills = formData.skills ? JSON.parse(JSON.stringify(formData.skills)) : [];
      const certifications = formData.certifications ? JSON.parse(JSON.stringify(formData.certifications)) : [];
      const tools_equipment = formData.tools_equipment ? JSON.parse(JSON.stringify(formData.tools_equipment)) : [];
      const days_available = formData.days_available ? JSON.parse(JSON.stringify(formData.days_available)) : [];
      const time_slots_available = formData.time_slots_available ? JSON.parse(JSON.stringify(formData.time_slots_available)) : [];
      const work_type = formData.work_type ? JSON.parse(JSON.stringify(formData.work_type)) : [];
      const schedule_type = formData.schedule_type ? JSON.parse(JSON.stringify(formData.schedule_type)) : [];
      const location_type = formData.location_type ? JSON.parse(JSON.stringify(formData.location_type)) : [];

      // Build a robust location string based on category
      const locationStr = formData.city || formData.address || formData.neighborhood || formData.location || 'Not specified';

      // Main listing data - ALL fields in listings table (vehicle_listings table was dropped)
      // Main listing data - ALL fields in listings table
      const rawListingData: Record<string, any> = {
        owner_id: user.user.id,
        category: selectedCategory,
        listing_type: selectedCategory === 'worker' ? 'service' : (formData.listing_type || selectedMode),
        mode: selectedMode,
        status: 'active',
        is_active: true,
        title: (formData.title as string) || `New ${selectedCategory}`,
        price: Number(formData.price) || 0,
        currency: (formData.currency as string) || 'USD',
        rental_rates: formData.rental_rates,
        rental_duration_type: (formData.rental_duration_type as string) || null,
        description: (formData.description as string) || (formData.about as string) || '',
        location: locationStr || 'Tulum',
        country: (formData.country as string) || 'Mexico',
        state: (formData.state as string) || (formData.city as string) || 'Quintana Roo',
        city: (formData.city as string) || 'Unknown',
        neighborhood: (formData.neighborhood as string) || null,
        address: (formData.address as string) || null,
        latitude: location.lat || null,
        longitude: location.lng || null,
        video_url: videoUrl,
        // JSONB arrays
        images: allImages,
        amenities,
        services_included,
        skills,
        certifications,
        tools_equipment,
        days_available,
        time_slots_available,
        work_type,
        schedule_type,
        location_type,
        // Property fields
        property_type: formData.property_type ? String(formData.property_type).toLowerCase() : null,
        beds: formData.beds || null,
        baths: formData.baths || null,
        square_footage: formData.square_footage || null,
        furnished: !!formData.furnished,
        pet_friendly: !!formData.pet_friendly,
        house_rules: (formData.house_rules as string) || null,
        // Worker fields
        service_category: selectedCategory === 'worker' ? formData.service_category : null,
        custom_service_name: selectedCategory === 'worker' ? formData.custom_service_name : null,
        pricing_unit: selectedCategory === 'worker' ? formData.pricing_unit : null,
        experience_level: selectedCategory === 'worker' ? formData.experience_level : null,
        experience_years: selectedCategory === 'worker' ? formData.experience_years : null,
        service_radius_km: selectedCategory === 'worker' ? formData.service_radius_km : null,
        minimum_booking_hours: selectedCategory === 'worker' ? formData.minimum_booking_hours : null,
        offers_emergency_service: !!formData.offers_emergency_service,
        background_check_verified: !!formData.background_check_verified,
        insurance_verified: !!formData.insurance_verified,
        // Vehicle fields (motorcycle/bicycle) - ALL in listings table now
        vehicle_type: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? selectedCategory : null,
        vehicle_brand: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? (formData.brand || formData.vehicle_brand) : null,
        vehicle_model: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? (formData.model || formData.vehicle_model) : null,
        vehicle_condition: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? (formData.condition ? String(formData.condition).toLowerCase().replace('needs work', 'poor') : null) : null,
        year: formData.year ? Number(formData.year) : null,
        mileage: formData.mileage ? Number(formData.mileage) : null,
        engine_cc: formData.engine_cc ? Number(formData.engine_cc) : null,
        fuel_type: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? (formData.fuel_type ? String(formData.fuel_type).toLowerCase() : null) : null,
        transmission: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? (formData.transmission ? String(formData.transmission).toLowerCase().replace('semi-auto', 'semi-automatic') : null) : null,
        // Motorcycle specific
        motorcycle_type: selectedCategory === 'motorcycle' ? formData.motorcycle_type : null,
        has_abs: selectedCategory === 'motorcycle' ? !!formData.has_abs : null,
        has_esc: selectedCategory === 'motorcycle' ? !!formData.has_esc : null,
        has_traction_control: selectedCategory === 'motorcycle' ? !!formData.has_traction_control : null,
        has_heated_grips: selectedCategory === 'motorcycle' ? !!formData.has_heated_grips : null,
        has_luggage_rack: selectedCategory === 'motorcycle' ? !!formData.has_luggage_rack : null,
        includes_helmet: selectedCategory === 'motorcycle' ? !!formData.includes_helmet : null,
        includes_gear: selectedCategory === 'motorcycle' ? !!formData.includes_gear : null,
        // Bicycle specific
        bicycle_type: selectedCategory === 'bicycle' ? formData.bicycle_type : null,
        frame_size: selectedCategory === 'bicycle' ? formData.frame_size : null,
        frame_material: selectedCategory === 'bicycle' ? formData.frame_material : null,
        number_of_gears: selectedCategory === 'bicycle' ? formData.number_of_gears : null,
        suspension_type: selectedCategory === 'bicycle' ? formData.suspension_type : null,
        brake_type: selectedCategory === 'bicycle' ? formData.brake_type : null,
        wheel_size: selectedCategory === 'bicycle' ? formData.wheel_size : null,
        electric_assist: selectedCategory === 'bicycle' ? !!formData.electric_assist : null,
        battery_range: selectedCategory === 'bicycle' ? formData.battery_range : null,
        includes_lock: selectedCategory === 'bicycle' ? !!formData.includes_lock : null,
        includes_lights: selectedCategory === 'bicycle' ? !!formData.includes_lights : null,
        includes_basket: selectedCategory === 'bicycle' ? !!formData.includes_basket : null,
        includes_pump: selectedCategory === 'bicycle' ? !!formData.includes_pump : null,
      };

      // Strip undefined and null values that might cause column mismatch
      const listingData = Object.fromEntries(
        Object.entries(rawListingData).filter(([_, v]) => v !== undefined && v !== null)
      );

      // Re-add required fields if they were stripped
      if (listingData.location === undefined) listingData.location = 'Tulum';
      if (listingData.price === undefined) listingData.price = 0;
      if (listingData.title === undefined) listingData.title = `New ${selectedCategory}`;

      let listingResult;

      try {
        if (editingId) {
          // Update existing listing
          const { data, error } = await supabase
            .from('listings')
            .update(listingData as any)
            .eq('id', editingId)
            .select()
            .single();

          if (error) {
            const errorMsg = error.message?.toLowerCase() || '';
            const isSchemaError = errorMsg.includes('could not find the') || errorMsg.includes('schema cache') || errorMsg.includes('column');
            
            if (isSchemaError) {
              const columnMatch = error.message?.match(/(?:column\s+['"]?([^'"\s]+)['"]?)|(?:['"]?([^'"\s]+)['"]?\s+column)/i);
              const missingColumn = columnMatch ? (columnMatch[1] || columnMatch[2]) : null;
              
              if (missingColumn && listingData[missingColumn] !== undefined) {
                logger.warn(`Removing problematic column "${missingColumn}" from update and retrying...`);
                const { [missingColumn]: _, ...safeData } = listingData;
                const { data: fallbackData, error: fallbackError } = await supabase
                  .from('listings').update(safeData as any).eq('id', editingId).select().single();
                if (fallbackError) throw fallbackError;
                listingResult = fallbackData;
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          } else {
            listingResult = data;
          }
        } else {
          // Insert new listing
          const { data, error } = await supabase
            .from('listings')
            .insert(listingData as any)
            .select()
            .single();

          if (error) {
            logger.error('Insert error details:', error);
            const errorMsg = error.message?.toLowerCase() || '';
            const isSchemaError = errorMsg.includes('could not find the') || errorMsg.includes('schema cache') || errorMsg.includes('column');

            if (isSchemaError) {
              // Extract the problematic column name from the error message and retry without it
              const columnMatch = error.message?.match(/['"]([^'"]+)['"]\s+column|column\s+['"]([^'"]+)['"]/i);
              const missingColumn = columnMatch ? (columnMatch[1] || columnMatch[2]) : null;

              if (missingColumn && listingData[missingColumn] !== undefined) {
                logger.warn(`Schema cache missing column "${missingColumn}" — retrying without it...`);
                const { [missingColumn]: _, ...safeData } = listingData;
                const { data: fallbackData, error: fallbackError } = await supabase
                  .from('listings')
                  .insert(safeData as any)
                  .select()
                  .single();
                if (fallbackError) throw fallbackError;
                listingResult = fallbackData;
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          } else {
            listingResult = data;
          }
        }
      } catch (err: unknown) {
        logger.error('Listing mutation failed:', err);
        throw err;
      }

      return listingResult;
    },
    onSuccess: () => {
      if (editingId) {
        toast.success(`${selectedCategory} listing updated successfully`);
        handleClose();
      } else {
        uiSounds.playUploadComplete();
        setShowCelebration(true);
        // handleClose() will be called after celebration via onComplete
      }
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.error('Error', {
        description: error.message || 'Failed to save listing.',
      });
    }
  });

  const handleClose = () => {
    setImages([]);
    setImageFiles([]);
    setFormData({});
    setSelectedCategory('property');
    setSelectedMode('rent');
    setEditingId(null);
    onClose();
  };

  const handleImageAdd = () => {
    const totalImages = images.length + imageFiles.length;
    if (totalImages >= maxPhotos) {
      toast.error('Maximum Photos Reached', {
        description: `You can upload up to ${maxPhotos} photos.`,
      });
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      const availableSlots = maxPhotos - totalImages;
      if (files.length > availableSlots) {
        toast.error('Too Many Photos', {
          description: `You can only add ${availableSlots} more.`
        });
        files.splice(availableSlots);
      }

      const validatedFiles = files.filter(file => {
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          toast.error('Invalid File', {
            description: `${file.name}: ${validation.error}`
          });
        }
        return validation.isValid;
      });

      setImageFiles(prev => [...prev, ...validatedFiles]);
    };

    input.click();
  };

  const handleImageRemove = (index: number, type: 'existing' | 'new') => {
    if (type === 'existing') {
      setImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = () => {
    if (images.length + imageFiles.length < 1) {
      toast.error('Photo Required', {
        description: 'Please upload at least 1 photo.'
      });
      return;
    }

    if (!user) {
      saveListingDraft(selectedCategory, {
        ...formData,
        images,
        mode: selectedMode,
        latitude: location.lat,
        longitude: location.lng,
      });

      sessionStorage.setItem('pending_auth_action', JSON.stringify({
        action: 'save_listing',
        category: selectedCategory,
        timestamp: Date.now(),
      }));

      toast.success('Draft Saved!', {
        description: 'Create an account to publish your listing.',
        duration: 5000,
      });
      handleClose();
      return;
    }

    createListingMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={cn(
        // Mobile: full screen — covers the entire viewport including the TopBar area
        "!top-0 !left-0 !translate-x-0 !translate-y-0 !w-full !max-w-none !h-[100dvh] !max-h-none !rounded-none",
        // Desktop (sm+): restore centered modal with rounded corners
        "sm:!top-[50%] sm:!left-[50%] sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!w-[calc(100%-24px)] sm:!max-w-5xl sm:!h-[90vh] sm:!max-h-[90vh] sm:!rounded-[var(--radius-xl)]",
        "flex flex-col p-0 gap-0 overflow-hidden"
      )}>
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-6 pb-2 sm:pb-3 border-b">
          <DialogTitle className="text-lg sm:text-xl">
            {editingId ? 'Edit Listing' : 'Create New Listing'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 h-0">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="px-6 py-6 space-y-8 pb-32"
          >
            {/* Photo Section with premium cards - RELOCATED TO FRONT */}
            <motion.div variants={itemFadeScale}>
              <Card className="rounded-3xl border-border bg-card overflow-hidden shadow-2xl backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>Photos <span className="text-xs font-normal text-muted-foreground ml-2">({images.length + imageFiles.length}/{maxPhotos})</span></span>
                    {(images.length + imageFiles.length) < 1 && (
                      <Badge variant="destructive" className="animate-pulse">Required</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <AnimatePresence>
                      {images.map((img, index) => (
                        <motion.div
                          key={`existing-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square group overflow-hidden rounded-2xl shadow-lg border border-white/5"
                        >
                          <img src={img} alt={`Existing ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-10 w-10 rounded-full shadow-2xl active:scale-90"
                              onClick={() => handleImageRemove(index, 'existing')}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                      {imageFiles.map((file, index) => (
                        <motion.div
                          key={`new-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="relative aspect-square group overflow-hidden rounded-2xl shadow-lg border border-white/5"
                        >
                          <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-10 w-10 rounded-full shadow-2xl active:scale-90"
                              onClick={() => handleImageRemove(index, 'new')}
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {(images.length + imageFiles.length) < maxPhotos && (
                      <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleImageAdd}
                        className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-all group shadow-inner"
                      >
                        <Upload className="w-6 h-6 group-hover:text-primary transition-colors" />
                        <span className="text-xs font-semibold">Add Photo</span>
                      </motion.button>
                    )}
                  </div>

                  <p className="text-xs text-center text-muted-foreground opacity-60">
                    High quality JPG or PNG, max 10MB per file
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Category selection with cascade */}
            <motion.div variants={itemFadeScale}>
              <CategorySelector
                selectedCategory={selectedCategory}
                selectedMode={selectedMode}
                onCategoryChange={setSelectedCategory}
                onModeChange={setSelectedMode}
              />
            </motion.div>

            {(selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') && (
              <motion.div
                variants={itemFadeScale}
                className="flex items-center gap-4 p-5 rounded-3xl bg-muted/50 backdrop-blur-xl border border-border shadow-xl"
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner",
                  selectedCategory === 'motorcycle'
                    ? 'text-orange-500 bg-orange-500/10'
                    : 'text-purple-500 bg-purple-500/10'
                )}>
                  {selectedCategory === 'motorcycle' ? (
                    <MotorcycleIcon className="w-8 h-8" />
                  ) : (
                    <Bike className="w-8 h-8" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedCategory === 'motorcycle' ? 'Motorcycle' : 'Bicycle'}
                  </h3>
                  <p className="text-sm text-muted-foreground opacity-80">
                    {selectedCategory === 'motorcycle'
                      ? 'Motorcycles, scooters, ATVs'
                      : 'Bikes, e-bikes, mountain bikes'}
                  </p>
                </div>
                <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary px-3 py-1 rounded-full">
                  Verified
                </Badge>
              </motion.div>
            )}

            <motion.div variants={itemFadeScale} className="space-y-8">
              {selectedCategory === 'property' && <PropertyListingForm onDataChange={(data) => setFormData({ ...formData, ...data })} initialData={formData} />}
              {selectedCategory === 'motorcycle' && <MotorcycleListingForm onDataChange={(data) => setFormData({ ...formData, ...data })} initialData={formData as unknown as MotorcycleFormData} />}
              {selectedCategory === 'bicycle' && <BicycleListingForm onDataChange={(data) => setFormData({ ...formData, ...data })} initialData={formData as unknown as BicycleFormData} />}
              {selectedCategory === 'worker' && <WorkerListingForm onDataChange={(data) => setFormData({ ...formData, ...data })} initialData={formData as unknown as WorkerFormData} />}
            </motion.div>



            {/* Video Looper Section */}
            <motion.div variants={itemFadeScale}>
              <Card className="rounded-3xl border-border bg-card overflow-hidden shadow-2xl backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span>10-Second Loop Video <span className="text-xs font-normal text-muted-foreground ml-2">(Optional)</span></span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <ListingVideoUpload
                    userId={user?.id || ''}
                    videoUrl={videoUrl}
                    onUploadSuccess={setVideoUrl}
                    onRemove={() => setVideoUrl(null)}
                  />
                </CardContent>
              </Card>
            </motion.div>

            {/* Legal / Verification Section */}
            <motion.div variants={itemFadeScale}>
              <div
                onClick={() => window.location.href = '/documents'}
                className="rounded-3xl p-6 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-400/20 shadow-2xl shadow-blue-500/5 cursor-pointer hover:border-blue-400/40 transition-colors active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-400/30 shadow-lg">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground">Legal Verification</h4>
                      <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-none px-2 py-0 text-[10px] uppercase font-black">Boost Visibility</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {selectedCategory === 'bicycle'
                        ? 'Upload purchase receipt to earn a blue verification checkmark and build extra trust.'
                        : 'Upload ownership documents to earn a verified star and appear higher in search results.'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/40 self-center" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </ScrollArea>

        <div className="shrink-0 flex items-center justify-between px-6 sm:px-8 py-5 border-t border-border bg-background/80 backdrop-blur-2xl">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 px-6 rounded-2xl h-12 font-semibold transition-all"
          >
            Cancel
          </motion.button>

          <div className="flex items-center gap-3">
            <motion.div className="relative group">
              {/* The "Energy Slipstream" Ring - Category Colored */}
              {!createListingMutation.isPending && (
                <motion.div
                  className="absolute -inset-[2px] rounded-[18px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden pointer-events-none"
                  initial={false}
                >
                  <motion.div
                    className={cn(
                      "absolute inset-[-100%]",
                      selectedCategory === 'property' && "bg-[conic-gradient(from_0deg,transparent_0%,transparent_30%,#10b981_50%,#059669_70%,transparent_100%)]",
                      selectedCategory === 'motorcycle' && "bg-[conic-gradient(from_0deg,transparent_0%,transparent_30%,#f97316_50%,#ea580c_70%,transparent_100%)]",
                      selectedCategory === 'bicycle' && "bg-[conic-gradient(from_0deg,transparent_0%,transparent_30%,#EB4898_50%,#FF4D00_70%,transparent_100%)]",
                      selectedCategory === 'worker' && "bg-[conic-gradient(from_0deg,transparent_0%,transparent_30%,#f59e0b_50%,#d97706_70%,transparent_100%)]"
                    )}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSubmit}
                disabled={createListingMutation.isPending}
                className={cn(
                  "px-10 rounded-2xl h-12 font-black shadow-2xl transition-all flex items-center gap-3 text-white disabled:opacity-50 relative z-10",
                  selectedCategory === 'property' && "bg-rose-600 shadow-emerald-500/20",
                  selectedCategory === 'motorcycle' && "bg-orange-600 shadow-orange-500/20",
                  selectedCategory === 'bicycle' && "bg-purple-600 shadow-purple-500/20",
                  selectedCategory === 'worker' && "bg-amber-600 shadow-amber-500/20"
                )}
              >
                {createListingMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Materializing...</span>
                  </>
                ) : (
                  <>
                    <span className="tracking-tight">{editingId ? 'Update Listing' : 'Publish Listing'}</span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform group-hover:translate-x-1",
                      selectedCategory === 'property' && "text-rose-100",
                      selectedCategory === 'motorcycle' && "text-orange-100",
                      selectedCategory === 'bicycle' && "text-purple-100",
                      selectedCategory === 'worker' && "text-amber-100"
                    )} />
                  </>
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>

        <ListingSuccessCelebration 
          isOpen={showCelebration}
          category={selectedCategory}
          onComplete={() => {
            setShowCelebration(false);
            handleClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}


