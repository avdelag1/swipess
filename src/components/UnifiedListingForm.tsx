/**
 * UnifiedListingForm - Creates listings for all categories
 * Updated to match new normalized schema with JSONB arrays
 */
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { notifications } from '@/utils/notifications';
import { Upload, X, Bike, CircleDot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategorySelector, Category, Mode } from './CategorySelector';
import { MotorcycleListingForm, MotorcycleFormData } from './MotorcycleListingForm';
import { BicycleListingForm, BicycleFormData } from './BicycleListingForm';
import { PropertyListingForm } from './PropertyListingForm';
import { WorkerListingForm, WorkerFormData } from './WorkerListingForm';
import { validateImageFile } from '@/utils/fileValidation';
import { uploadPhotoBatch } from '@/utils/photoUpload';
import { useAnonymousDrafts } from '@/hooks/useAnonymousDrafts';
import { useAuth } from '@/hooks/useAuth';

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

export function UnifiedListingForm({ isOpen, onClose, editingProperty }: UnifiedListingFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('property');
  const [selectedMode, setSelectedMode] = useState<Mode>('rent');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [location, setLocation] = useState<{ lat?: number; lng?: number }>({});
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [editingId, setEditingId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { saveListingDraft } = useAnonymousDrafts();

  const getMaxPhotos = () => {
    switch (selectedCategory) {
      case 'property': return 15;
      case 'motorcycle': return 5;
      case 'bicycle': return 5;
      case 'worker': return 10;
      default: return 15;
    }
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
    } else if (editingProperty?.category) {
      setEditingId(null);
      setSelectedCategory(editingProperty.category);
      setSelectedMode(editingProperty.mode || 'rent');
      setImages(editingProperty.images || []);
      setImageFiles([]);
      setFormData(editingProperty.images ? editingProperty : { mode: editingProperty.mode || 'rent' });
      setLocation({ lat: editingProperty.latitude, lng: editingProperty.longitude });
    } else {
      setEditingId(null);
      setSelectedCategory('property');
      setSelectedMode('rent');
      setImages([]);
      setImageFiles([]);
      setFormData({ mode: 'rent' });
      setLocation({});
    }
  }, [editingProperty, isOpen]);

  const createListingMutation = useMutation({
    mutationFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      if (images.length + imageFiles.length < 1) {
        throw new Error('At least 1 photo required');
      }

      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        uploadedImageUrls = await uploadPhotoBatch(user.user.id, imageFiles, 'listing-images');
      }

      const allImages = [...images, ...uploadedImageUrls];

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

      // Main listing data - ALL fields in listings table (vehicle_listings table was dropped)
      const listingData = {
        owner_id: user.user.id,
        category: selectedCategory,
        listing_type: selectedCategory === 'worker' ? 'service' : (selectedMode === 'rent' ? 'rent' : 'buy'),
        mode: selectedMode,
        status: 'active',
        is_active: true,
        title: formData.title || 'Untitled',
        price: formData.price || 0,
        currency: 'USD',
        rental_rates: formData.rental_rates,
        rental_duration_type: formData.rental_duration_type,
        country: formData.country || 'Mexico',
        state: formData.state || formData.city || 'Unknown',
        city: formData.city || 'Unknown',
        neighborhood: formData.neighborhood,
        address: formData.address,
        latitude: selectedCategory === 'property' ? null : (location.lat || null),
        longitude: selectedCategory === 'property' ? null : (location.lng || null),
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
        furnished: formData.furnished || false,
        pet_friendly: formData.pet_friendly || false,
        house_rules: formData.house_rules || null,
        // Worker fields
        service_category: selectedCategory === 'worker' ? formData.service_category : null,
        custom_service_name: selectedCategory === 'worker' ? formData.custom_service_name : null,
        pricing_unit: selectedCategory === 'worker' ? formData.pricing_unit : null,
        experience_level: selectedCategory === 'worker' ? formData.experience_level : null,
        experience_years: selectedCategory === 'worker' ? formData.experience_years : null,
        service_radius_km: selectedCategory === 'worker' ? formData.service_radius_km : null,
        minimum_booking_hours: selectedCategory === 'worker' ? formData.minimum_booking_hours : null,
        offers_emergency_service: selectedCategory === 'worker' ? formData.offers_emergency_service : false,
        background_check_verified: selectedCategory === 'worker' ? formData.background_check_verified : false,
        insurance_verified: selectedCategory === 'worker' ? formData.insurance_verified : false,
        // Vehicle fields (motorcycle/bicycle) - ALL in listings table now
        vehicle_type: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? selectedCategory : null,
        vehicle_brand: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? formData.brand : null,
        vehicle_model: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? formData.model : null,
        vehicle_condition: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? (formData.condition ? String(formData.condition).toLowerCase() : null) : null,
        year: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? formData.year : null,
        mileage: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? formData.mileage : null,
        engine_cc: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? formData.engine_cc : null,
        fuel_type: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? formData.fuel_type : null,
        transmission: (selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') ? formData.transmission : null,
        // Motorcycle specific
        motorcycle_type: selectedCategory === 'motorcycle' ? formData.motorcycle_type : null,
        has_abs: selectedCategory === 'motorcycle' ? (formData.has_abs || false) : null,
        has_esc: selectedCategory === 'motorcycle' ? (formData.has_esc || false) : null,
        has_traction_control: selectedCategory === 'motorcycle' ? (formData.has_traction_control || false) : null,
        has_heated_grips: selectedCategory === 'motorcycle' ? (formData.has_heated_grips || false) : null,
        has_luggage_rack: selectedCategory === 'motorcycle' ? (formData.has_luggage_rack || false) : null,
        includes_helmet: selectedCategory === 'motorcycle' ? (formData.includes_helmet || false) : null,
        includes_gear: selectedCategory === 'motorcycle' ? (formData.includes_gear || false) : null,
        // Bicycle specific
        bicycle_type: selectedCategory === 'bicycle' ? formData.bicycle_type : null,
        frame_size: selectedCategory === 'bicycle' ? formData.frame_size : null,
        frame_material: selectedCategory === 'bicycle' ? formData.frame_material : null,
        number_of_gears: selectedCategory === 'bicycle' ? formData.number_of_gears : null,
        suspension_type: selectedCategory === 'bicycle' ? formData.suspension_type : null,
        brake_type: selectedCategory === 'bicycle' ? formData.brake_type : null,
        wheel_size: selectedCategory === 'bicycle' ? formData.wheel_size : null,
        electric_assist: selectedCategory === 'bicycle' ? (formData.electric_assist || false) : null,
        battery_range: selectedCategory === 'bicycle' ? formData.battery_range : null,
        includes_lock: selectedCategory === 'bicycle' ? (formData.includes_lock || false) : null,
        includes_lights: selectedCategory === 'bicycle' ? (formData.includes_lights || false) : null,
        includes_basket: selectedCategory === 'bicycle' ? (formData.includes_basket || false) : null,
        includes_pump: selectedCategory === 'bicycle' ? (formData.includes_pump || false) : null,
      };

      let listingResult;

      if (editingId) {
        // Update existing listing
        const { data, error } = await supabase
          .from('listings')
          .update(listingData)
          .eq('id', editingId)
          .select()
          .single();
        
        if (error) throw error;
        listingResult = data;
      } else {
        // Insert new listing
        const { data, error } = await supabase
          .from('listings')
          .insert(listingData)
          .select()
          .single();
        
        if (error) throw error;
        listingResult = data;
      }

      return listingResult;
    },
    onSuccess: () => {
      handleClose();
      if (editingId) {
        notifications.listing.updated(selectedCategory);
      } else {
        notifications.listing.created(selectedCategory);
      }
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
    onError: (error: Error) => {
      queryClient.invalidateQueries({ queryKey: ['owner-listings'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast({
        title: 'Error',
        description: error.message || 'Failed to save listing.',
        variant: 'destructive'
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
      toast({ title: 'Maximum Photos Reached', description: `You can upload up to ${maxPhotos} photos.`, variant: 'destructive' });
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
        toast({ title: 'Too Many Photos', description: `You can only add ${availableSlots} more.`, variant: 'destructive' });
        files.splice(availableSlots);
      }

      const validatedFiles = files.filter(file => {
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          toast({ title: 'Invalid File', description: `${file.name}: ${validation.error}`, variant: 'destructive' });
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
      toast({ title: 'Photo Required', description: 'Please upload at least 1 photo.', variant: 'destructive' });
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
      
      toast({
        title: 'Draft Saved!',
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
      <DialogContent className="max-w-5xl h-[95vh] sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-2 sm:pb-3 border-b">
          <DialogTitle className="text-lg sm:text-xl">
            {editingId ? 'Edit Listing' : 'Create New Listing'}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
            <CategorySelector
              selectedCategory={selectedCategory}
              selectedMode={selectedMode}
              onCategoryChange={setSelectedCategory}
              onModeChange={setSelectedMode}
            />

            {(selectedCategory === 'motorcycle' || selectedCategory === 'bicycle') && (
              <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
                <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl ${
                  selectedCategory === 'motorcycle'
                    ? 'text-orange-500 bg-orange-500/10'
                    : 'text-purple-500 bg-purple-500/10'
                }`}>
                  {selectedCategory === 'motorcycle' ? (
                    <CircleDot className="w-6 h-6 sm:w-7 sm:h-7" />
                  ) : (
                    <Bike className="w-6 h-6 sm:w-7 sm:h-7" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">
                    {selectedCategory === 'motorcycle' ? 'Motorcycle' : 'Bicycle'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {selectedCategory === 'motorcycle'
                      ? 'Motorcycles, scooters, ATVs'
                      : 'Bikes, e-bikes, mountain bikes'}
                  </p>
                </div>
              </div>
            )}

            {selectedCategory === 'property' && <PropertyListingForm onDataChange={(data) => setFormData({ ...formData, ...data })} initialData={formData} />}
            {selectedCategory === 'motorcycle' && <MotorcycleListingForm onDataChange={(data) => setFormData({ ...formData, ...data })} initialData={formData as unknown as MotorcycleFormData} />}
            {selectedCategory === 'bicycle' && <BicycleListingForm onDataChange={(data) => setFormData({ ...formData, ...data })} initialData={formData as unknown as BicycleFormData} />}
            {selectedCategory === 'worker' && <WorkerListingForm onDataChange={(data) => setFormData({ ...formData, ...data })} initialData={formData as unknown as WorkerFormData} />}

            <Card>
              <CardHeader>
                <CardTitle>
                  Photos * (min 1, max {maxPhotos})
                  {(images.length + imageFiles.length) < 1 && (
                    <span className="text-destructive text-sm font-normal ml-2">- Need at least 1 photo</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {images.map((img, index) => (
                    <div key={`existing-${index}`} className="relative aspect-square">
                      <img src={img} alt={`Existing ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => handleImageRemove(index, 'existing')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {imageFiles.map((file, index) => (
                    <div key={`new-${index}`} className="relative aspect-square">
                      <img src={URL.createObjectURL(file)} alt={`New ${index + 1}`} className="w-full h-full object-cover rounded-lg" />
                      <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => handleImageRemove(index, 'new')}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {(images.length + imageFiles.length) < maxPhotos && (
                  <Button onClick={handleImageAdd} variant="outline" className="w-full">
                    <Upload className="mr-2 h-4 w-4" />
                    Add Photos ({images.length + imageFiles.length}/{maxPhotos})
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-400/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">Legal Documents</CardTitle>
                    {selectedCategory !== 'bicycle' && (
                      <Badge variant="outline" className="bg-blue-500/20 border-blue-400 text-blue-300">Get Verified Badge</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedCategory === 'bicycle' 
                    ? '📋 Optional: Upload purchase receipt to earn a blue verification checkmark'
                    : '🛡️ Upload ownership documents to earn a blue verification star and build trust with clients'}
                </p>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">Note: You can upload documents now or after creating the listing.</p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <div className="shrink-0 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t bg-background">
          <Button variant="outline" onClick={handleClose} className="h-10 sm:h-11 text-sm order-2 sm:order-1">Cancel</Button>
          <Button onClick={handleSubmit} disabled={createListingMutation.isPending} className="h-10 sm:h-11 text-sm order-1 sm:order-2 bg-red-500 hover:bg-red-600 text-white">
            {createListingMutation.isPending ? 'Saving...' : (editingId ? 'Save Listing' : 'Save Listing')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
