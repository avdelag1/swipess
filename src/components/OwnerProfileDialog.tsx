import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Camera, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { appToast } from '@/utils/appNotification';
import { triggerHaptic } from '@/utils/haptics';
import { compressImage, PROFILE_COMPRESSION } from '@/utils/imageCompression';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useOwnerProfile, useSaveOwnerProfile } from '@/hooks/useOwnerProfile';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/state/modalStore';
import { validateContent } from '@/utils/contactInfoValidation';

export function OwnerProfileDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { isLight } = useAppTheme();
  const { data } = useOwnerProfile();
  const saveMutation = useSaveOwnerProfile();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Draft integration for AI Magic Profile
  const aiProfileDraft = useModalStore((s) => s.aiProfileDraft);

  const [businessName, setBusinessName] = useState('');
  const [businessDesc, setBusinessDesc] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [profileImages, setProfileImages] = useState<string[]>([]);

  // Load data
  useEffect(() => {
    const merged: any = { ...(data || {}), ...(aiProfileDraft || {}) };
    setBusinessName(merged.business_name ?? '');
    setBusinessDesc(merged.business_description ?? '');
    setLocation(merged.business_location ?? '');
    setEmail(merged.contact_email ?? '');
    setPhone(merged.contact_phone ?? '');
    setServices(merged.service_offerings ?? []);
    setProfileImages(merged.profile_images ?? []);
  }, [data, aiProfileDraft]);

  const handleImageUpload = async (file: File): Promise<string> => {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    const prepared = await compressImage(file, PROFILE_COMPRESSION);
    const fileExt = prepared.type === 'image/webp' ? 'webp' : prepared.type === 'image/png' ? 'png' : 'jpg';
    const uuid = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const filePath = `${user.data.user.id}/${uuid}.${fileExt}`;
    const { error } = await supabase.storage.from('profile-images').upload(filePath, prepared, { contentType: prepared.type || 'image/jpeg' });
    if (error) throw error;
    return supabase.storage.from('profile-images').getPublicUrl(filePath).data.publicUrl;
  };

  const handleAddPhoto = () => {
    triggerHaptic('light');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const url = await handleImageUpload(file);
        setProfileImages(prev => [...prev, url]);
      } catch {
        appToast.error('Upload failed');
      }
    };
    input.click();
  };

  const handleRemovePhoto = (idx: number) => {
    triggerHaptic('light');
    setProfileImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    triggerHaptic('medium');
    if (businessName && !validateContent(businessName).isClean) {
      appToast.error('Content Blocked');
      return;
    }
    if (businessDesc && !validateContent(businessDesc).isClean) {
      appToast.error('Content Blocked');
      return;
    }
    try {
      await saveMutation.mutateAsync({
        business_name: businessName,
        business_description: businessDesc,
        business_location: location,
        contact_email: email,
        contact_phone: phone,
        service_offerings: services,
        profile_images: profileImages,
      });
      appToast.success('Profile Updated');
      onOpenChange(false);
    } catch (_error) {
      appToast.error('Sync Error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideCloseButton className={cn("sm:max-w-3xl h-[92dvh] max-h-[92dvh] flex flex-col p-0 gap-0 overflow-hidden rounded-[2.5rem]", isLight ? "border-border bg-background text-foreground" : "border-border bg-background text-foreground shadow-[0_0_80px_hsl(var(--background)/0.95)]")}>
        {/* Header */}
        <div className="flex-none flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur-xl z-20">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Business Profile</h2>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary mt-0.5">Edit Details</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/40 hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1" viewportRef={scrollContainerRef}>
          <div className="p-6 space-y-10 pb-32">
            
            {/* Photos */}
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-black text-foreground">Photos</h3>
                <p className="text-[11px] font-bold text-muted-foreground">Add business or property photos.</p>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                {profileImages.map((img, idx) => (
                  <div key={idx} className="relative shrink-0 snap-start">
                    <img src={img} className="w-32 h-40 object-cover rounded-[1.5rem] border border-border shadow-md" />
                    <button onClick={() => handleRemovePhoto(idx)} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {profileImages.length < 5 && (
                  <button onClick={handleAddPhoto} className="shrink-0 w-32 h-40 rounded-[1.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
                    <Camera className="w-6 h-6 text-muted-foreground" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Add Photo</span>
                  </button>
                )}
              </div>
            </section>

            {/* Basic Info */}
            <section className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Details</h3>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Business Name</label>
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="E.g. Sunrise Properties" className="h-12 rounded-2xl bg-muted/30" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="h-12 rounded-2xl bg-muted/30" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                <Textarea value={businessDesc} onChange={(e) => setBusinessDesc(e.target.value)} placeholder="Describe your business, listings, and what makes you stand out…" maxLength={1000} autoGrow showCount className="min-h-[100px] rounded-2xl bg-muted/30 p-4" />
              </div>
            </section>

            {/* Contact */}
            <section className="space-y-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-primary">Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" type="email" className="h-12 rounded-2xl bg-muted/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" type="tel" className="h-12 rounded-2xl bg-muted/30" />
                </div>
              </div>
            </section>

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex-none p-4 border-t border-border bg-background/95 backdrop-blur-xl z-20">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
