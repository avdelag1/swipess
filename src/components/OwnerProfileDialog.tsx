import { useEffect, useState, memo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PhotoUploadManager } from '@/components/PhotoUploadManager';
import { useOwnerProfile, useSaveOwnerProfile } from '@/hooks/useOwnerProfile';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { validateContent } from '@/utils/contactInfoValidation';
import { Building2, Bike, Briefcase, Check, Camera, Mail } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';

import { OWNER_SERVICE_OFFERING_OPTIONS as SERVICE_OFFERING_OPTIONS } from '@/constants/profileConstants';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function OwnerProfileDialogComponent({ open, onOpenChange }: Props) {
  const { data, isLoading: _isLoading } = useOwnerProfile();
  const saveMutation = useSaveOwnerProfile();

  const [businessName, setBusinessName] = useState<string>('');
  const [businessLocation, setBusinessLocation] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [serviceOfferings, setServiceOfferings] = useState<string[]>([]);

  useEffect(() => {
    if (!data) return;
    setBusinessName(data.business_name ?? '');
    setBusinessLocation(data.business_location ?? '');
    setContactEmail(data.contact_email ?? '');
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

      const { data: _data, error } = await supabase.storage
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
    // Content moderation on business name & location (not email/phone - those are legitimate)
    for (const { text, label } of [
      { text: businessName, label: 'Business Name' },
      { text: businessLocation, label: 'Business Location' },
    ]) {
      if (text) {
        const check = validateContent(text);
        if (!check.isClean) {
          toast.error(`${label}: Content blocked`, { description: check.message || undefined });
          return;
        }
      }
    }

    const payload = {
      business_name: businessName || null,
      business_location: businessLocation || null,
      contact_email: contactEmail || null,
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
    ((businessName ? 15 : 0) +
      (serviceOfferings.length > 0 ? 35 : 0) +
      (businessLocation ? 15 : 0) +
      (contactEmail ? 10 : 0) +
      (profileImages.length > 0 ? 25 : 0))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl h-[calc(100vh-4rem)] sm:h-auto max-h-[90vh] flex flex-col p-0 gap-0 bg-card/95 backdrop-blur-xl border border-border text-foreground" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">
              Edit Owner Profile
            </DialogTitle>
            <Badge variant="outline" className="bg-muted border-border text-foreground">
              {completionPercentage}% Complete
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-4 sm:px-6 py-4 space-y-6">
            {/* Profile Photos Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <Label className="text-foreground text-base font-semibold">Business Photo</Label>
                    <p className="text-muted-foreground text-xs mt-0.5">Add 1 photo of your business</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-[var(--color-brand-accent-2)]/20 text-[var(--color-brand-accent-2)] border-[var(--color-brand-accent-2)]">
                  {profileImages.length}/1
                </Badge>
              </div>
              <PhotoUploadManager
                maxPhotos={1}
                currentPhotos={profileImages}
                onPhotosChange={setProfileImages}
                uploadType="profile"
                onUpload={handleImageUpload}
                showCameraButton={false}
                replaceOnFull
              />
            </div>

            {/* Business Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <Label className="text-foreground text-base font-semibold">Business Information</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-muted-foreground text-sm sm:text-base">Business Name</Label>
                <Input
                  id="business_name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Your business name"
                  className="h-14 text-base bg-secondary border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-[var(--color-brand-accent-2)]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_location" className="text-muted-foreground text-sm sm:text-base">Business Location</Label>
                <Input
                  id="business_location"
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                  placeholder="City, Country"
                  className="h-14 text-base bg-secondary border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-[var(--color-brand-accent-2)]"
                />
              </div>
            </div>

            {/* Service Offerings Section - Multi-option presets */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <Label className="text-foreground text-base font-semibold">What Do You Offer?</Label>
                  <p className="text-muted-foreground text-xs mt-0.5">Select all services your business provides</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {SERVICE_OFFERING_OPTIONS.map((option) => {
                  const Icon =
                    option.id === 'property_rental' ? Building2 :
                      option.id === 'property_sale' ? Building2 :
                        option.id === 'motorcycle_rental' ? MotorcycleIcon :
                          option.id === 'bicycle_rental' ? Bike :
                            Briefcase;
                  const isSelected = serviceOfferings.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleServiceOffering(option.id)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                        isSelected
                          ? "bg-[var(--color-brand-accent-2)]/10 border-[var(--color-brand-accent-2)]/50 shadow-lg shadow-[var(--color-brand-accent-2)]/10"
                          : "bg-muted/50 border-border hover:bg-muted hover:border-muted-foreground/20"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        isSelected ? "bg-[var(--color-brand-accent-2)]/20 text-[var(--color-brand-accent-2)]" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold tracking-tight text-foreground">{option.label}</span>
                          {isSelected && (
                            <Badge className="bg-[var(--color-brand-accent-2)] text-white text-[10px] uppercase font-black tracking-widest px-2">
                              <Check className="w-3 h-3 mr-1" /> Selected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground truncate mt-0.5">{option.description}</p>
                      </div>

                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                        isSelected
                          ? "border-[var(--color-brand-accent-2)] bg-[var(--color-brand-accent-2)] text-white"
                          : "border-muted-foreground/30"
                      )}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {serviceOfferings.length === 0 && (
                <p className="text-[var(--color-brand-accent-2)] text-sm font-bold">Select at least one service to continue</p>
              )}
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <Label className="text-foreground text-base font-semibold">Contact Information</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className="text-muted-foreground text-sm sm:text-base">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="business@example.com"
                  className="h-14 text-base bg-secondary border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:border-[var(--color-brand-accent-2)]"
                />
              </div>

            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-4 sm:px-6 py-4 border-t border-border shrink-0 bg-card/80">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-14 rounded-2xl border-border bg-secondary text-foreground hover:bg-muted font-bold tracking-wide"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="flex-1 h-14 rounded-2xl bg-[var(--color-brand-accent-2)] hover:bg-[#FF1493] text-white font-black tracking-wide shadow-[0_8px_24px_rgba(228,0,124,0.3)] transition-all active:scale-95 disabled:opacity-50"
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
