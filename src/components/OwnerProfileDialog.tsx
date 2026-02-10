import { useEffect, useState, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { PhotoUploadManager } from '@/components/PhotoUploadManager';
import { useOwnerProfile, useSaveOwnerProfile } from '@/hooks/useOwnerProfile';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { Building2, Bike, CircleDot, Briefcase, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Preset service offerings - multi-option, no free text
const SERVICE_OFFERING_OPTIONS = [
  { id: 'property_rental', label: 'Property Rental', icon: Building2, description: 'Apartments, houses, condos' },
  { id: 'motorcycle_rental', label: 'Motorcycle Rental', icon: CircleDot, description: 'Motorcycles, scooters, ATVs' },
  { id: 'bicycle_rental', label: 'Bicycle Rental', icon: Bike, description: 'Bikes, e-bikes, mountain bikes' },
  { id: 'professional_services', label: 'Professional Services', icon: Briefcase, description: 'Chef, cleaner, nanny, handyman' },
];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function OwnerProfileDialogComponent({ open, onOpenChange }: Props) {
  const { data, isLoading } = useOwnerProfile();
  const saveMutation = useSaveOwnerProfile();

  const [businessName, setBusinessName] = useState<string>('');
  const [businessLocation, setBusinessLocation] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [serviceOfferings, setServiceOfferings] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setBusinessName(data.business_name ?? '');
    setBusinessLocation(data.business_location ?? '');
    setContactEmail(data.contact_email ?? '');
    setContactPhone(data.contact_phone ?? '');
    setProfileImages(data.profile_images ?? []);
    setServiceOfferings(data.service_offerings ?? []);
  }, [data]);

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop() || 'jpg';
      const uniqueId = crypto.randomUUID();
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `${user.data.user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    const payload = {
      business_name: businessName || null,
      business_location: businessLocation || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      profile_images: profileImages,
      service_offerings: serviceOfferings,
    };

    try {
      await saveMutation.mutateAsync(payload);
      toast({ title: 'Owner Profile Saved', description: 'Your business information has been updated.' });
      onOpenChange(false);
    } catch (error) {
      logger.error('Error saving owner profile:', error);
      toast({
        title: 'Error saving profile',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const toggleServiceOffering = (id: string) => {
    setServiceOfferings(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const completionPercentage = Math.round(
    ((businessName ? 20 : 0) +
     (serviceOfferings.length > 0 ? 30 : 0) +
     (businessLocation ? 15 : 0) +
     (contactEmail ? 15 : 0) +
     (profileImages.length > 0 ? 20 : 0))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl h-[calc(100vh-4rem)] sm:h-auto max-h-[90vh] flex flex-col p-0 gap-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/10 text-white" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-white/10 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
              Edit Owner Profile
            </DialogTitle>
            <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
              {completionPercentage}% Complete
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 space-y-6">
            {/* Profile Photos Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-white text-lg sm:text-xl font-bold">📸 Business Photo</Label>
                  <p className="text-white/60 text-xs sm:text-sm mt-1">Add 1 photo of your business</p>
                </div>
                <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-400">
                  {profileImages.length}/1
                </Badge>
              </div>
              <PhotoUploadManager
                maxPhotos={1}
                currentPhotos={profileImages}
                onPhotosChange={setProfileImages}
                uploadType="profile"
                onUpload={handleImageUpload}
              />
            </div>

            {/* Business Info Section */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">🏢 Business Information</Label>

              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-white/90 text-sm sm:text-base">Business Name</Label>
                <Input
                  id="business_name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className="h-12 text-base bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-red-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_location" className="text-white/90 text-sm sm:text-base">Business Location</Label>
                <Input
                  id="business_location"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                  placeholder="City, Country"
                  className="h-12 text-base bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-red-400"
                />
              </div>
            </div>

            {/* Service Offerings Section - Multi-option presets */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">💼 What Do You Offer?</Label>
              <p className="text-white/60 text-sm">Select all services your business provides • No free text needed</p>
              
              <div className="grid grid-cols-1 gap-3">
                {SERVICE_OFFERING_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isSelected = serviceOfferings.includes(option.id);
                  
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleServiceOffering(option.id)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                        isSelected 
                          ? "bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10" 
                          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        isSelected ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{option.label}</span>
                          {isSelected && (
                            <Badge className="bg-red-500 text-white text-xs">
                              <Check className="w-3 h-3 mr-1" /> Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-white/50 truncate">{option.description}</p>
                      </div>

                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected 
                          ? "border-red-500 bg-red-500 text-white" 
                          : "border-white/30"
                      )}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {serviceOfferings.length === 0 && (
                <p className="text-orange-400 text-sm">Select at least one service to continue</p>
              )}
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4">
              <Label className="text-white text-lg sm:text-xl font-bold">📞 Contact Information</Label>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-white/90 text-sm sm:text-base">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="business@example.com"
                  className="h-12 text-base bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-red-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="text-white/90 text-sm sm:text-base">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="h-12 text-base bg-white/5 border-white/20 text-white placeholder:text-white/50 focus:border-red-400"
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-4 sm:px-6 py-4 border-t border-white/10 shrink-0 bg-slate-900/50">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || serviceOfferings.length === 0}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold shadow-lg disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const OwnerProfileDialog = memo(OwnerProfileDialogComponent);
