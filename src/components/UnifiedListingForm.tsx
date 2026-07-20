/**
 * UnifiedListingForm - Creates listings for all categories
 * Updated to match new normalized schema with JSONB arrays
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { appToast } from '@/utils/appNotification';
import { triggerHaptic } from '@/utils/haptics';
import { logger } from '@/utils/prodLogger';
import { AlertCircle, Bike, Check, ChevronRight, FileText, Film, LayoutGrid, Shield, Upload, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { Badge } from '@/components/ui/badge';
import { AnimatePresence, motion } from 'framer-motion';
import { Category, CategorySelector, Mode } from './CategorySelector';
import { MotorcycleFormData, MotorcycleListingForm } from './MotorcycleListingForm';
import { BicycleFormData, BicycleListingForm } from './BicycleListingForm';
import { PropertyListingForm } from './PropertyListingForm';
import { WorkerFormData, WorkerListingForm } from './WorkerListingForm';
import { YachtFormData, YachtListingForm } from './YachtListingForm';
import { validateImageFile } from '@/utils/fileValidation';
import { assertImageSafe, uploadPhotoBatch } from '@/utils/photoUpload';
import { compressImages, LISTING_COMPRESSION } from '@/utils/imageCompression';
import { validateContent, validateProfanity } from '@/utils/contactInfoValidation';
import { useAnonymousDrafts } from '@/hooks/useAnonymousDrafts';
import { useAuth } from '@/hooks/useAuth';
import { ListingVideoUpload } from './video/ListingVideoUpload';
import { uiSounds } from '@/utils/uiSounds';
import { saveListingWithSchemaRetry } from '@/utils/listingSave';
import {
  isValidListingCoordinates,
  LISTING_LOCATION_REQUIRED_MSG,
  resolveListingCoordinates,
} from '@/utils/listingLocation';
import { buildDescriptionFromChips } from '@/constants/listingTaxonomies';
import { PremiumSortableGrid } from './PremiumSortableGrid';
import { WaterDropLoader } from './ui/WaterDropLoader';
import { Capacitor } from '@capacitor/core';
import { AppleVision } from '@/lib/plugins/AppleVision';

interface EditingListing {
  id?: string;
  category?: 'property' | 'motorcycle' | 'bicycle' | 'yacht' | 'worker';
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

const LISTING_STEPS = [
  { id: 1, label: 'Media', icon: Upload },
  { id: 2, label: 'Category', icon: LayoutGrid },
  { id: 3, label: 'Details', icon: FileText },
  { id: 4, label: 'Publish', icon: Shield },
] as const;

const stepVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const toIntOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};

interface UnifiedPhoto {
  id: string;
  type: 'existing' | 'new';
  url: string;
  file?: File;
}

export function UnifiedListingForm({ isOpen, onClose, editingProperty }: UnifiedListingFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>(() =>
    (editingProperty?.category as Category) || 'property'
  );
  const [selectedMode, setSelectedMode] = useState<Mode>(() =>
    (editingProperty?.mode as Mode) || 'rent'
  );
  const [photoList, setPhotoList] = useState<UnifiedPhoto[]>([]);
  const [location, setLocation] = useState<{ lat?: number; lng?: number }>({});
  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    if (!editingProperty?.category) return { mode: 'rent' };
    return {
      ...editingProperty,
      brand: (editingProperty.vehicle_brand as string) || (editingProperty.brand as string) || '',
      model: (editingProperty.vehicle_model as string) || (editingProperty.model as string) || '',
    };
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [_stepDir, setStepDir] = useState(1);

  // Use refs to track latest values for mutation (avoids closure staleness)
  const photoListRef = useRef(photoList);
  const formDataRef = useRef(formData);

  // Synchronize ref whenever state changes (like on load or reset)
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Keep refs in sync with state
  useEffect(() => {
    photoListRef.current = photoList;
  }, [photoList]);

  // Stable callback for updating data instantly without triggering re-renders
  const handleDataChange = useCallback((data: Record<string, unknown>) => {
    formDataRef.current = { ...formDataRef.current, ...data };
  }, []);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { saveListingDraft } = useAnonymousDrafts();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getMaxPhotos = () => {
    switch (selectedCategory) {
      case 'property': return 30;
      case 'motorcycle': return 5;
      case 'bicycle': return 5;
      case 'yacht': return 12;
      case 'worker': return 3;
      default: return 10;
    }
  };

  const maxPhotos = getMaxPhotos();

  useEffect(() => {
    if (isOpen) setCurrentStep(1);
  }, [isOpen]);

  const goNext = useCallback(() => {
    triggerHaptic('light');
    setStepDir(1);
    setCurrentStep((s) => Math.min(s + 1, LISTING_STEPS.length));
  }, []);

  const goBack = useCallback(() => {
    triggerHaptic('light');
    setStepDir(-1);
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    if (editingProperty?.id) {
      setEditingId(editingProperty.id);
      setSelectedCategory(editingProperty.category || 'property');
      setSelectedMode(editingProperty.mode || 'rent');
      
      const initialPhotos: UnifiedPhoto[] = (editingProperty.images || []).map((img: string) => ({
        id: img,
        type: 'existing',
        url: img
      }));
      setPhotoList(initialPhotos);
      
      // Normalize brand and model fields from DB columns
      const normalizedData = {
        ...editingProperty,
        brand: (editingProperty.vehicle_brand as string) || (editingProperty.brand as string) || '',
        model: (editingProperty.vehicle_model as string) || (editingProperty.model as string) || '',
      };
      setFormData(normalizedData);
      setLocation({ lat: editingProperty.latitude, lng: editingProperty.longitude });
      setVideoUrl((editingProperty.video_url as string) || null);
    } else if (editingProperty?.category) {
      setEditingId(null);
      setSelectedCategory(editingProperty.category);
      setSelectedMode(editingProperty.mode || 'rent');
      
      const initialPhotos: UnifiedPhoto[] = (editingProperty.images || []).map((img: string) => ({
        id: img,
        type: 'existing',
        url: img
      }));
      setPhotoList(initialPhotos);
      
      const normalizedData = {
        ...editingProperty,
        brand: (editingProperty.vehicle_brand as string) || (editingProperty.brand as string) || '',
        model: (editingProperty.vehicle_model as string) || (editingProperty.model as string) || '',
      };
      setFormData(normalizedData);
      setLocation({ lat: editingProperty.latitude, lng: editingProperty.longitude });
      setVideoUrl((editingProperty.video_url as string) || null);
    } else {
      setEditingId(null);
      setSelectedCategory('property');
      setSelectedMode('rent');
      setPhotoList([]);
      setFormData({ mode: 'rent' });
      setLocation({});
      setVideoUrl(null);
    }
  }, [editingProperty, isOpen]);

  const revokePhotos = () => {
    photoList.forEach(p => {
      if (p.type === 'new' && p.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(p.url);
        } catch (e) {
          logger.error('Failed to revoke object URL:', e);
        }
      }
    });
  };

  const createListingMutation = useMutation({
    mutationFn: async () => {
      // Verify session first — common silent failure mode is a refreshing token
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        throw new Error('Session expired — please sign in again to publish.');
      }
      const user = { user: sessionData.session.user };

      // Use refs to get latest values (avoids stale closure)
      const currentImages = photoListRef.current.filter(p => p.type === 'existing').map(p => p.url);
      const currentImageFiles = photoListRef.current.filter(p => p.type === 'new').map(p => p.file!);
      const formData = formDataRef.current;

      if (currentImages.length + currentImageFiles.length < 1) {
        throw new Error('At least 1 photo required');
      }

      const cityName = (formData.city as string)?.trim();
      if (!cityName) {
        throw new Error('Select a country and city for your listing location.');
      }

      const resolvedCoords = await resolveListingCoordinates({
        latitude: (formData.latitude as number | null | undefined) ?? location.lat,
        longitude: (formData.longitude as number | null | undefined) ?? location.lng,
        city: cityName,
        country: formData.country as string,
        neighborhood: formData.neighborhood as string,
      });

      if (!resolvedCoords) {
        throw new Error(LISTING_LOCATION_REQUIRED_MSG);
      }

      // Content moderation: check title, description, house_rules
      const fieldsToCheck = [
        { text: formData.title as string, label: 'Title' },
        { text: formData.description as string, label: 'Description' },
      ];
      for (const field of fieldsToCheck) {
        if (field.text) {
          const result = validateContent(field.text);
          if (!result.isClean) {
            throw new Error(`${field.label}: ${result.message}`);
          }
          const prof = validateProfanity(field.text);
          if (!prof.isClean) {
            throw new Error(`${field.label}: ${prof.message}`);
          }
        }
      }

      let uploadedImageUrls: string[] = [];
      if (currentImageFiles.length > 0) {
        setUploadProgress(2);
        // Normalize HEIC + shrink large photos before upload so storage never rejects them.
        const prepared = await compressImages(currentImageFiles, LISTING_COMPRESSION);
        setUploadProgress(15);
        uploadedImageUrls = await uploadPhotoBatch(
          user.user.id,
          prepared,
          'listing-images',
          (p) => setUploadProgress(15 + Math.floor(p * 0.8)),
          true
        );
        
        setUploadProgress(95);
        // Block objectionable listing photos before publishing (Apple Guideline 1.2).
        // assertImageSafe fails OPEN on infra errors so an outage never blocks a legit
        // upload; checks run in parallel to keep the added latency to ~1 round-trip.
        try {
          await Promise.all(uploadedImageUrls.map((url) => assertImageSafe(url)));
        } catch (e) {
          // Remove the just-uploaded files so a rejected upload leaves no orphan.
          const paths = uploadedImageUrls
            .map((u) => u.split('/listing-images/')[1])
            .filter(Boolean) as string[];
          if (paths.length) {
            await supabase.storage.from('listing-images').remove(paths).catch(() => {});
          }
          if ((e as Error & { moderationBlocked?: boolean })?.moderationBlocked) {
            appToast.error('Photo rejected', (e as Error).message);
          }
          throw e;
        }

        setUploadProgress(98);
      }

      // Map back in the exact order the user placed them!
      let newUploadIndex = 0;
      const allImages = photoListRef.current.map(photo => {
        if (photo.type === 'existing') {
          return photo.url;
        } else {
          const url = uploadedImageUrls[newUploadIndex];
          newUploadIndex++;
          return url;
        }
      }).filter(Boolean) as string[];

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

      const listingLocation =
        (formData.location as string) ||
        (formData.address as string) ||
        (formData.neighborhood as string) ||
        (formData.city as string) ||
        'Unknown';

      // Main listing data. RLS and required columns are keyed by user_id, while
      // owner_id powers owner-side queries, so both must be saved together.
      const rawListingData: Record<string, any> = {
        user_id: user.user.id,
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
        description:
          (formData.description as string) ||
          (formData.about as string) ||
          buildDescriptionFromChips([
            (formData.property_type as string) || (formData.motorcycle_type as string) || (formData.bicycle_type as string) || (formData.service_category as string),
            formData.condition as string,
            formData.vibe as string[],
            formData.amenities as string[],
            formData.services_included as string[],
            formData.house_rules as string[],
            formData.skills as string[],
            formData.traits as string[],
          ]) ||
          '',
        country: (formData.country as string) || 'Mexico',
        state: (formData.state as string) || (formData.city as string) || 'Quintana Roo',
        city: (formData.city as string) || 'Unknown',
        location: listingLocation,
        neighborhood: (formData.neighborhood as string) || null,
        address: (formData.address as string) || null,
        latitude: resolvedCoords.latitude,
        longitude: resolvedCoords.longitude,
        video_url: videoUrl,
        // JSONB arrays
        images: allImages,
        image_url: allImages[0] || null,
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
        beds: toIntOrNull(formData.beds),
        baths: toIntOrNull(formData.baths),
        square_footage: toIntOrNull(formData.square_footage),
        furnished: !!formData.furnished,
        pet_friendly: !!formData.pet_friendly,
        house_rules: Array.isArray(formData.house_rules)
          ? (formData.house_rules as string[]).join(' · ')
          : ((formData.house_rules as string) || null),
        // Worker fields
        service_category: selectedCategory === 'worker' ? formData.service_category : null,
        custom_service_name: selectedCategory === 'worker' ? formData.custom_service_name : null,
        pricing_unit: selectedCategory === 'worker' ? formData.pricing_unit : null,
        experience_level: selectedCategory === 'worker' ? formData.experience_level : null,
        experience_years: selectedCategory === 'worker' ? toIntOrNull(formData.experience_years) : null,
        service_radius_km: selectedCategory === 'worker' ? toIntOrNull(formData.service_radius_km) : null,
        minimum_booking_hours: selectedCategory === 'worker' ? toIntOrNull(formData.minimum_booking_hours) : null,
        offers_emergency_service: !!formData.offers_emergency_service,
        background_check_verified: !!formData.background_check_verified,
        insurance_verified: !!formData.insurance_verified,
        // Vehicle fields (motorcycle/bicycle) - ALL in listings table now
        vehicle_type: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle' || selectedCategory === 'yacht') ? selectedCategory : null,
        vehicle_brand: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle' || selectedCategory === 'yacht') ? (formData.brand || formData.vehicle_brand) : null,
        vehicle_model: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle' || selectedCategory === 'yacht') ? (formData.model || formData.vehicle_model) : null,
        vehicle_condition: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle' || selectedCategory === 'yacht') ? (formData.condition ? String(formData.condition).toLowerCase().replace('needs work', 'poor') : null) : null,
        year: toIntOrNull(formData.year),
        mileage: toIntOrNull(formData.mileage),
        engine_cc: toIntOrNull(formData.engine_cc),
        fuel_type: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle' || selectedCategory === 'yacht') ? (formData.fuel_type ? String(formData.fuel_type).toLowerCase() : null) : null,
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
        number_of_gears: selectedCategory === 'bicycle' ? toIntOrNull(formData.number_of_gears) : null,
        suspension_type: selectedCategory === 'bicycle' ? formData.suspension_type : null,
        brake_type: selectedCategory === 'bicycle' ? formData.brake_type : null,
        wheel_size: selectedCategory === 'bicycle' ? formData.wheel_size : null,
        electric_assist: selectedCategory === 'bicycle' ? !!formData.electric_assist : null,
        battery_range: selectedCategory === 'bicycle' ? toIntOrNull(formData.battery_range) : null,
        includes_lock: selectedCategory === 'bicycle' ? !!formData.includes_lock : null,
        includes_lights: selectedCategory === 'bicycle' ? !!formData.includes_lights : null,
        includes_basket: selectedCategory === 'bicycle' ? !!formData.includes_basket : null,
        includes_pump: selectedCategory === 'bicycle' ? !!formData.includes_pump : null,
        // Yacht specific
        length_m: selectedCategory === 'yacht' ? (Number.isFinite(Number(formData.length_m)) ? Number(formData.length_m) : null) : null,
        berths: selectedCategory === 'yacht' ? toIntOrNull(formData.berths) : null,
        max_passengers: selectedCategory === 'yacht' ? toIntOrNull(formData.max_passengers) : null,
        hull_material: selectedCategory === 'yacht' ? (formData.hull_material || null) : null,
        engines: selectedCategory === 'yacht' ? (formData.engines || null) : null,
      };

      // Strip undefined and null values that might cause column mismatch
      const listingData = Object.fromEntries(
        Object.entries(rawListingData).filter(([_, v]) => v !== undefined && v !== null)
      );

      // Re-add required fields if they were stripped
      if (listingData.price === undefined) listingData.price = 0;
      if (listingData.title === undefined) listingData.title = `New ${selectedCategory}`;

      try {
        const listingResult = await saveListingWithSchemaRetry(listingData, editingId);
        return listingResult;
      } catch (err: unknown) {
        logger.error('Listing mutation failed:', err);
        throw err;
      }
    },
    onSuccess: (listing) => {
      setUploadProgress(null);
      uiSounds.playUploadComplete();
      if (editingId) {
        appToast.success('Listing updated!', 'Your changes are live.');
      } else {
        appToast.success('Listing published!', 'Tap to see your listing.');
      }
      if (listing) {
        queryClient.setQueriesData({ queryKey: ['owner-listings'] }, (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          const withoutSavedListing = oldData.filter((item) => item.id !== listing.id);
          return [listing, ...withoutSavedListing];
        });
        // Seed the detail cache with the row we just saved so the redirect
        // to /listing/:id renders instantly with no loading spinner.
        queryClient.setQueryData(['listing-detail', listing.id], listing);
      }
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      // Revoke object URLs and reset state without triggering onClose navigate.
      // The route change below will unmount this component anyway.
      revokePhotos();
      setPhotoList([]);
      setFormData({});
      setSelectedCategory('property');
      setSelectedMode('rent');
      setEditingId(null);
      // Owners always land on their properties page after save/edit.
      navigate('/owner/properties', { replace: true });
    },
    onError: (error: Error) => {
      setUploadProgress(null);
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      logger.error('[UnifiedListingForm] Save failed:', error);
      appToast.error(
        'Could not save listing',
        error.message || 'Please check your connection and try again.'
      );
    }
  });

  const handleClose = () => {
    revokePhotos();
    setPhotoList([]);
    setFormData({});
    setSelectedCategory('property');
    setSelectedMode('rent');
    setEditingId(null);
    onClose();
  };

  const handleImageAdd = () => {
    const totalImages = photoList.length;
    if (totalImages >= maxPhotos) {
      appToast.error('Maximum Photos Reached');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      const availableSlots = maxPhotos - totalImages;
      if (files.length > availableSlots) {
        appToast.error('Too Many Photos');
        files.splice(availableSlots);
      }

      const validatedFiles = files.filter(file => {
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          appToast.error('Invalid File');
        }
        return validation.isValid;
      });

      const newPhotos: UnifiedPhoto[] = validatedFiles.map(file => {
        const uniqueId = `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 9)}`;
        return {
          id: uniqueId,
          type: 'new',
          url: URL.createObjectURL(file), // Generate stable object URL once
          file: file
        };
      });

      setPhotoList(prev => [...prev, ...newPhotos]);

      // Perform on-device Apple Vision ML tagging if on native iOS
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios' && validatedFiles.length > 0) {
        try {
          // Just analyze the first uploaded photo for tags as a smart default
          const fileToAnalyze = validatedFiles[0];
          const reader = new FileReader();
          reader.onload = async (event) => {
            const result = event.target?.result as string;
            if (result && result.includes('base64,')) {
              const base64Data = result.split('base64,')[1];
              try {
                const visionResult = await AppleVision.analyzeImage({ base64: base64Data });
                if (visionResult.tags && visionResult.tags.length > 0) {
                  // Clean tags (Vision returns PascalCase identifiers like "SwimmingPool")
                  const cleanTags = visionResult.tags.map(t => 
                    t.replace(/([A-Z])/g, ' $1').trim().toLowerCase()
                  );
                  
                  // Add them to the form data's features array
                  const currentFeatures = Array.isArray(formDataRef.current.features) 
                    ? formDataRef.current.features 
                    : [];
                  
                  // Only add tags that aren't already there
                  const newUniqueTags = cleanTags.filter(t => !currentFeatures.includes(t));
                  
                  if (newUniqueTags.length > 0) {
                    handleDataChange({ 
                      features: [...currentFeatures, ...newUniqueTags] 
                    });
                    appToast.success(`Apple Vision added ${newUniqueTags.length} tags`);
                  }
                }
              } catch (err) {
                logger.error('Apple Vision analysis failed:', err);
              }
            }
          };
          reader.readAsDataURL(fileToAnalyze);
        } catch (err) {
          logger.error('Failed to read file for Vision analysis', err);
        }
      }
    };

    input.click();
  };

  const handleImageRemove = (id: string) => {
    setPhotoList(prev => {
      // Find the photo and revoke its object URL if it's local
      const photo = prev.find(p => p.id === id);
      if (photo && photo.type === 'new' && photo.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(photo.url);
        } catch (e) {
          logger.error('Failed to revoke object URL on remove:', e);
        }
      }
      return prev.filter(p => p.id !== id);
    });
  };

  const handleClearAllPhotos = () => {
    if (photoList.length === 0) return;
    revokePhotos();
    setPhotoList([]);
    triggerHaptic('medium');
  };

  const handleSubmit = () => {
    if (photoList.length < 1) {
      appToast.error('Photo Required');
      return;
    }

    const currentFormData = formDataRef.current;

    if (!(currentFormData.city as string)?.trim()) {
      appToast.error(t('listings.cityRequiredTitle'), t('listings.cityRequired'));
      return;
    }

    if (!user) {
      // Map all current URLs (remote or local blob) for anonymous drafts
      const allDraftImages = photoList.map(p => p.url);
      saveListingDraft(selectedCategory, {
        ...currentFormData,
        images: allDraftImages,
        mode: selectedMode,
        latitude: (currentFormData.latitude as number | undefined) ?? location.lat,
        longitude: (currentFormData.longitude as number | undefined) ?? location.lng,
      });

      sessionStorage.setItem('pending_auth_action', JSON.stringify({
        action: 'save_listing',
        category: selectedCategory,
        timestamp: Date.now(),
      }));

      appToast.success('Draft Saved!');
      handleClose();
      return;
    }

    appToast.info('Publishing…', 'Saving your listing.');
    createListingMutation.mutate();
  };

  const currentLat = (formData.latitude as number | undefined) ?? location.lat;
  const currentLng = (formData.longitude as number | undefined) ?? location.lng;
  const needsGpsFix = !!editingId && !isValidListingCoordinates(currentLat, currentLng);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !createListingMutation.isPending) handleClose(); }}>
      <DialogContent
        hideCloseButton
        motionPreset="fade"
        className={cn(
        // Mobile: full screen
        "!w-full !max-w-none !h-[100dvh] !max-h-none !rounded-none !p-0",
        // Desktop (sm+): restore centered modal with rounded corners
        "sm:!w-[calc(100%-24px)] sm:!max-w-5xl sm:!h-[90vh] sm:!max-h-[90vh] sm:!rounded-[3rem]",
        "flex flex-col p-0 gap-0 overflow-hidden border bg-white dark:bg-black dark:border-white/10 border-slate-200/50 shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
      )}>
        <DialogHeader className="shrink-0 px-6 sm:px-8 pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:pt-8 pb-4 border-b dark:border-white/5 border-slate-200/50 relative z-10 bg-slate-50 dark:bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                Step {currentStep} of {LISTING_STEPS.length}
              </p>
              <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-foreground mt-0.5">
                {LISTING_STEPS[currentStep - 1].label}
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 press-snappy shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {LISTING_STEPS.map((step) => {
              const done = step.id < currentStep;
              const active = step.id === currentStep;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => { setStepDir(step.id > currentStep ? 1 : -1); setCurrentStep(step.id); }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all whitespace-nowrap shrink-0",
                    active
                      ? "bg-primary text-white border-primary shadow-[0_4px_12px_rgba(from_var(--primary)_r_g_b_/_0.35)]"
                      : done
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-foreground/5 text-muted-foreground border-border/50",
                  )}
                >
                  {done ? <Check className="w-2.5 h-2.5" /> : <step.icon className="w-2.5 h-2.5" />}
                  {step.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 h-0.5 w-full bg-foreground/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#EB4898] to-[#FF4D00]"
              initial={false}
              animate={{ width: `${(currentStep / LISTING_STEPS.length) * 100}%` }}
              transition={{ type: 'spring', damping: 24, stiffness: 200 }}
            />
          </div>
        </DialogHeader>
        {(createListingMutation.isPending || uploadProgress !== null) && (
          <div className="shrink-0 h-[3px] w-full bg-primary/10 overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '4%' }}
              animate={{ width: `${uploadProgress ?? 8}%` }}
              transition={{ type: 'spring', stiffness: 90, damping: 20 }}
            />
          </div>
        )}

        <ScrollArea className="flex-1 h-0">
          <AnimatePresence mode="sync">
            <motion.div
              key={currentStep}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.08, ease: 'easeOut' }}
              className="px-6 py-6 space-y-8 pb-32"
            >
            {currentStep === 3 && needsGpsFix && (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-200">{t('listings.gpsMissingTitle')}</p>
                  <p className="text-xs leading-relaxed text-amber-100/80">{t('listings.gpsMissingBanner')}</p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
            <div>
              <div className="space-y-4">
                <div className="flex items-start justify-between px-2 gap-3">
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <h3 className="text-[14px] font-black uppercase tracking-widest italic text-foreground flex items-center gap-2">
                       <Upload className="w-4 h-4 text-rose-500" />
                       Media
                       <span className="text-[10px] font-bold text-muted-foreground ml-2 opacity-60">({photoList.length}/{maxPhotos})</span>
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/80">Portrait photos work best</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Video toggle pill */}
                    <button
                      type="button"
                      onClick={() => setShowVideoPanel(v => !v)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95",
                        videoUrl
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                          : showVideoPanel
                            ? "bg-primary/15 border-primary/40 text-primary"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground",
                      )}
                    >
                      <Film className="w-3 h-3" />
                      {videoUrl ? 'Video ✓' : 'Video'}
                    </button>
                    {photoList.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllPhotos}
                        className="text-[9px] font-black uppercase tracking-widest text-rose-400/90 hover:text-rose-300 px-2 py-1 rounded-lg border border-rose-500/25 bg-rose-500/5"
                      >
                        Clear all
                      </button>
                    )}
                    {photoList.length < 1 && (
                      <Badge variant="destructive" className="bg-rose-500 text-white font-black uppercase tracking-widest text-[9px] border-none shadow-[0_4px_12px_rgba(225,29,72,0.3)]">Required</Badge>
                    )}
                  </div>
                </div>
                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 shadow-inner">
                  {/* Stable Sortable Grid */}
                  <div className="mb-6">
                    {photoList.length > 0 ? (
                      <div className="flex flex-col md:grid md:grid-cols-4 gap-4">
                        <div className="md:col-span-3">
                          <PremiumSortableGrid
                            items={photoList}
                            onReorder={setPhotoList}
                            columns={{ initial: 2, md: 3, lg: 3 }}
                            className="gap-4"
                            itemClassName="aspect-square relative overflow-hidden rounded-2xl shadow-lg border border-white/5"
                            renderItem={(photo, index) => (
                              <div className="w-full h-full relative group select-none">
                                <img
                                  src={photo.url}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover pointer-events-none"
                                />
                                <div className="absolute inset-0 bg-black/35 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-auto">
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-9 w-9 rounded-full shadow-xl active:scale-90"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleImageRemove(photo.id);
                                    }}
                                  >
                                    <X className="h-5 w-5" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          />
                        </div>
                        {photoList.length < maxPhotos && (
                          <div className="flex items-center justify-center aspect-square md:aspect-auto">
                            <button
                              onClick={handleImageAdd}
                              className="w-full h-full min-h-[120px] aspect-square flex flex-col items-center justify-center gap-2 rounded-[2.2rem] border-2 border-dashed border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/30 transition-all group shadow-sm press-snappy"
                            >
                              <Upload className="w-8 h-8 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                              <span className="text-sm font-semibold">Add Photo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-center items-center">
                        <button
                          onClick={handleImageAdd}
                          className="w-full max-w-sm aspect-square flex flex-col items-center justify-center gap-3 rounded-[3rem] border border-dashed border-rose-500/30 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all group shadow-sm py-12 press-snappy"
                        >
                          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                            <Upload className="w-8 h-8 text-rose-500" strokeWidth={1.5} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest italic">Add Media Asset</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-center text-muted-foreground opacity-60">
                    Hold briefly to drag and reorder. Max 10MB per file.
                  </p>

                  {/* Inline video panel — toggled by the Video pill above */}
                  {showVideoPanel && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-5 overflow-hidden"
                    >
                      <div className="border-t border-white/5 pt-5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-3 flex items-center gap-2">
                          <Film className="w-3 h-3 text-primary/70" />
                          10-second loop video <span className="text-muted-foreground/40">(optional)</span>
                        </p>
                        <ListingVideoUpload
                          userId={user?.id || ''}
                          videoUrl={videoUrl}
                          onUploadSuccess={setVideoUrl}
                          onRemove={() => setVideoUrl(null)}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
            )}

            {currentStep === 2 && (
            <div className="space-y-6">
              <CategorySelector
                selectedCategory={selectedCategory}
                selectedMode={selectedMode}
                onCategoryChange={setSelectedCategory}
                onModeChange={setSelectedMode}
              />

            {(selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') && (
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-muted/50 backdrop-blur-xl border border-border shadow-xl">
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
              </div>
            )}
            </div>
            )}

            {currentStep === 3 && (
            <div className="space-y-8">
              {selectedCategory === 'property' && <PropertyListingForm onDataChange={handleDataChange} initialData={formData} />}
              {selectedCategory === 'motorcycle' && <MotorcycleListingForm onDataChange={handleDataChange} initialData={formData as unknown as MotorcycleFormData} />}
              {selectedCategory === 'bicycle' && <BicycleListingForm onDataChange={handleDataChange} initialData={formData as unknown as BicycleFormData} />}
              {selectedCategory === 'worker' && <WorkerListingForm onDataChange={handleDataChange} initialData={formData as unknown as WorkerFormData} />}
              {selectedCategory === 'yacht' && <YachtListingForm onDataChange={handleDataChange} initialData={formData as unknown as YachtFormData} />}
            </div>
            )}

            {currentStep === 4 && (
              <div
                onClick={() => window.open('/documents', '_blank')}
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
            )}
            </motion.div>
          </AnimatePresence>
        </ScrollArea>

        <div className="shrink-0 flex items-center justify-between px-6 sm:px-8 py-5 border-t dark:border-white/5 border-slate-200/50 bg-white/60 dark:bg-black/60 backdrop-blur-2xl relative z-10">
          <Button
            variant="ghost"
            onClick={currentStep === 1 ? handleClose : goBack}
            className="h-12 px-6 rounded-2xl font-bold text-muted-foreground hover:text-foreground"
          >
            {currentStep === 1 ? 'Cancel' : '← Back'}
          </Button>

          {currentStep < LISTING_STEPS.length ? (
            <Button
              onClick={goNext}
              className="h-12 px-8 rounded-2xl font-black uppercase tracking-wider text-white border-none"
              style={{ background: 'linear-gradient(135deg, #FF4D00, #EB4898)' }}
            >
              Next →
            </Button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createListingMutation.isPending}
              className="press-snappy bg-rose-600 hover:bg-rose-700 text-white shadow-[0_8px_24px_rgba(225,29,72,0.35)] px-10 rounded-2xl h-12 font-black uppercase italic tracking-widest text-[11px] transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {createListingMutation.isPending ? (
                <>
                  <WaterDropLoader size="sm" />
                  <span>Publishing…</span>
                </>
              ) : (
                <>
                  <span className="tracking-widest">{editingId ? 'Save changes' : 'Publish listing'}</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}


