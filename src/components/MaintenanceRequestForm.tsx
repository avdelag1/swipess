import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/sonner';
import { Camera, X, Wrench, Zap, Wind, Cpu, Building2, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import browserImageCompression from 'browser-image-compression';

interface MaintenanceRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const categories = [
  { value: 'plumbing', label: 'Plumbing', icon: Wrench, color: 'text-blue-400' },
  { value: 'electrical', label: 'Electrical', icon: Zap, color: 'text-amber-400' },
  { value: 'ac', label: 'AC / Cooling', icon: Wind, color: 'text-cyan-400' },
  { value: 'appliance', label: 'Appliance', icon: Cpu, color: 'text-purple-400' },
  { value: 'structural', label: 'Structural', icon: Building2, color: 'text-red-400' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: 'text-muted-foreground' },
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

export function MaintenanceRequestForm({ onSuccess, onCancel }: MaintenanceRequestFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [priority, setPriority] = useState('medium');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const compressed = await browserImageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const fileName = `maintenance/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
        const { error } = await supabase.storage.from('listing-images').upload(fileName, compressed);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('listing-images').getPublicUrl(fileName);
        setPhotos(prev => [...prev, urlData.publicUrl]);
      }
    } catch (_err) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!user || !title.trim()) {
      toast.error('Please provide a title');
      return;
    }

    setSubmitting(true);
    try {
      // Find an active contract to link to (get the owner)
      const { data: contracts } = await supabase
        .from('digital_contracts')
        .select('id, owner_id, listing_id')
        .eq('client_id', user.id)
        .eq('status', 'active')
        .limit(1);

      const contract = contracts?.[0];
      const ownerId = contract?.owner_id || user.id; // fallback

      const { error } = await supabase.from('maintenance_requests').insert({
        tenant_id: user.id,
        owner_id: ownerId,
        contract_id: contract?.id || null,
        listing_id: contract?.listing_id || null,
        title: title.trim(),
        description: description.trim() || null,
        category,
        priority,
        photo_urls: photos,
      });

      if (error) throw error;

      toast.success('Maintenance request submitted!');
      onSuccess();
    } catch (_err) {
      toast.error('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Title */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Issue Title</label>
        <Input
          placeholder="e.g. Leaking faucet in kitchen"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-card/80 border-border"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all",
                category === cat.value
                  ? "bg-primary/10 border-primary/30 scale-[1.02]"
                  : "bg-card/50 border-border hover:bg-card/80"
              )}
            >
              <cat.icon className={cn("w-5 h-5", cat.color)} />
              <span className="text-[11px] font-semibold text-foreground/80">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Priority</label>
        <div className="flex gap-2">
          {priorities.map((p) => (
            <button
              key={p.value}
              onClick={() => setPriority(p.value)}
              className={cn(
                "flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all",
                priority === p.value
                  ? p.color
                  : "bg-card/50 border-border text-muted-foreground"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
        <Textarea
          placeholder="Describe the issue in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="bg-card/80 border-border"
        />
      </div>

      {/* Photos */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Photos (optional)</label>
        <div className="flex gap-2 flex-wrap">
          <AnimatePresence>
            {photos.map((url, i) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-border"
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {photos.length < 5 && (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
              {uploading ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-muted-foreground" />
              )}
            </label>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1 rounded-xl">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!title.trim() || submitting}
          className="flex-1 rounded-xl bg-primary"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </div>
    </motion.div>
  );
}


