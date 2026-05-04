
import { useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Building2, Bike, Briefcase, Check, Camera, Mail, Sparkles, Target, X, Save, MapPin } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';

import { OWNER_SERVICE_OFFERING_OPTIONS as SERVICE_OFFERING_OPTIONS } from '@/constants/profileConstants';

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function OwnerProfileDialogComponent({ open, onOpenChange }: Props) {
  const { isLight } = useAppTheme();
  const { data } = useOwnerProfile();
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
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filePath = `${user.data.user.id}/${crypto.randomUUID()}.${fileExt}`;
    const { error } = await supabase.storage.from('profile-images').upload(filePath, file);
    if (error) throw error;
    return supabase.storage.from('profile-images').getPublicUrl(filePath).data.publicUrl;
  };

  const handleSave = async () => {
    triggerHaptic('medium');
    for (const { text, label } of [
      { text: businessName, label: 'Business Name' },
      { text: businessLocation, label: 'Business Location' },
    ]) {
      if (text && !validateContent(text).isClean) {
        toast.error(`${label}: Content Blocked`);
        return;
      }
    }

    try {
      await saveMutation.mutateAsync({
        business_name: businessName || null,
        business_location: businessLocation || null,
        contact_email: contactEmail || null,
        profile_images: profileImages,
        service_offerings: serviceOfferings,
      });
      toast.success('Brand Assets Synced');
      onOpenChange(false);
    } catch (error) {
      toast.error('Sync Error');
    }
  };

  const toggleServiceOffering = (id: string) => {
    triggerHaptic('light');
    setServiceOfferings(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const completionPercentage = Math.round(
    ((businessName ? 15 : 0) + (serviceOfferings.length > 0 ? 35 : 0) + (businessLocation ? 15 : 0) + (profileImages.length > 0 ? 35 : 0))
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { triggerHaptic('light'); onOpenChange(v); }}>
      <DialogContent hideCloseButton className={cn("owner-profile-dialog sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[3rem]", isLight ? "light-profile-dialog border-border bg-background text-foreground shadow-[0_30px_90px_hsl(var(--foreground)/0.16)]" : "border-border bg-background text-foreground shadow-[0_0_80px_hsl(var(--background)/1)]")}>
        
        {/* 🛸 BRAND TERMINAL HEADER */}
        <div className={cn("relative px-8 pt-8 pb-6 border-b", isLight ? "border-border bg-gradient-to-b from-muted/50 to-transparent" : "border-border bg-gradient-to-b from-foreground/[0.03] to-transparent")}>
           <div className="flex items-center justify-between">
              <div className="space-y-1">
                 <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#EB4898]" />
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground italic">Brand Management Center</span>
                 </div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">Edit Owner Identity</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                  <div className="h-2 w-32 bg-foreground/5 rounded-full overflow-hidden border border-border">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-[#EB4898] to-[#ff5bb0]" 
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercentage}%` }}
                    />
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-widest text-[#EB4898] italic">{completionPercentage}% Authority</span>
              </div>
           </div>
           
           <button onClick={() => { triggerHaptic('light'); onOpenChange(false); }} className="absolute -top-2 -right-2 sm:top-6 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center text-foreground/55 hover:text-foreground transition-all active:scale-90 hover:bg-foreground/5">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6 touch-pan-y overscroll-contain">
          <div className="space-y-12 pb-12">
            
            {/* 📸 BRAND ASSET REPOSITORY */}
            <section className="space-y-6">
               <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-white/90 font-black">Brand Visuals</h3>
                  <p className="text-[10px] uppercase tracking-widest text-white/60 italic">Primary business representation asset</p>
               </div>
               <PhotoUploadManager
                 maxPhotos={6}
                 currentPhotos={profileImages}
                 onPhotosChange={setProfileImages}
                 uploadType="profile"
                 onUpload={handleImageUpload}
                 showCameraButton={true}
                 replaceOnFull={false}
               />
            </section>

            {/* 🏢 BUSINESS CORE */}
            <section className="space-y-6">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/30 flex items-center justify-center text-[#EB4898]">
                      <Building2 className="w-4 h-4" />
                   </div>
                   <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Business Core</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/70 italic ml-1">Business ID (Name)</Label>
                      <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic focus:border-[#EB4898]/50 transition-all px-6" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-white/70 italic ml-1">Primary Station (Location)</Label>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <Input value={businessLocation} onChange={(e) => setBusinessLocation(e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic focus:border-[#EB4898]/50 transition-all pl-12 pr-6" placeholder="City, Country" />
                      </div>
                   </div>
                </div>
            </section>

            {/* 💼 SERVICE PROVISIONS */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/30 flex items-center justify-center text-[#EB4898]">
                     <Target className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Service Provisions</h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {SERVICE_OFFERING_OPTIONS.map((opt) => {
                   const active = serviceOfferings.includes(opt.id);
                   const Icon = opt.id.includes('property') ? Building2 : opt.id.includes('motorcycle') ? MotorcycleIcon : opt.id.includes('bicycle') ? Bike : Briefcase;
                   
                   return (
                     <motion.button
                       key={opt.id}
                       onClick={() => toggleServiceOffering(opt.id)}
                       whileTap={{ scale: 0.98 }}
                       className={cn(
                         "flex items-center gap-4 p-5 rounded-[2.2rem] border-2 transition-all text-left group",
                         active ? "bg-[#EB4898]/10 border-[#EB4898] shadow-[0_10px_30px_rgba(235,72,152,0.1)]" : "bg-white/5 border-white/5 hover:bg-white/10"
                       )}
                     >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-lg", active ? "bg-[#EB4898] text-white" : "bg-white/5 text-white/70")}>
                           <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center gap-2">
                              <span className="font-black italic uppercase tracking-tighter text-white group-hover:text-[#EB4898] transition-colors text-sm">{opt.label}</span>
                           </div>
                           <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-white/60 italic leading-none">{opt.description}</p>
                        </div>
                        <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all", active ? "border-[#EB4898] bg-[#EB4898]" : "border-white/20")}>
                           {active && <Check className="w-3 h-3 text-white" />}
                        </div>
                     </motion.button>
                   )
                 })}
               </div>
            </section>

            {/* 📬 COMMUNICATION LINK */}
            <section className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EB4898]/10 border border-[#EB4898]/30 flex items-center justify-center text-[#EB4898]">
                     <Mail className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic tracking-widest text-white">Communication Link</h3>
               </div>
               
               <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-white/70 italic ml-1">Official Comm-Link (Email)</Label>
                  <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold italic focus:border-[#EB4898]/50 transition-all px-6" />
               </div>
            </section>

          </div>
        </div>

        {/* 🛸 BRAND FOOTER ACTIONS */}
        <div className={cn("px-8 py-6 border-t flex items-center justify-between gap-4", isLight ? "border-border bg-gradient-to-t from-muted/50 to-transparent" : "border-border bg-gradient-to-t from-foreground/[0.03] to-transparent")}>
           <Button 
             variant="ghost" 
             onClick={() => onOpenChange(false)}
              className="h-14 px-8 rounded-2xl font-black italic uppercase tracking-widest text-foreground/55 hover:text-foreground hover:bg-foreground/5"
           >
              Cancel
           </Button>
           
           <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="keep-white h-14 pl-8 pr-10 rounded-2xl font-black italic uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all group border-none text-primary-foreground"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' }}
           >
              <Save className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform text-primary-foreground" />
              <span className="text-primary-foreground">{saveMutation.isPending ? 'Syncing...' : 'Save Brand Identity'}</span>
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const OwnerProfileDialog = memo(OwnerProfileDialogComponent);


