import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validateImageFile } from '@/utils/fileValidation';
import {
  Sparkles,
  Camera,
  X,
  Loader2,
  Home,
  Bike,
  Wrench,
  ChevronRight,
  MessageSquare,
  DollarSign,
  MapPin,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = 'property' | 'motorcycle' | 'bicycle' | 'worker';

interface CategoryOption {
  id: Category;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const CATEGORIES: CategoryOption[] = [
  { id: 'property', name: 'Property', icon: <Home className="w-6 h-6" />, description: 'Apartments, houses, rooms', color: 'bg-blue-500' },
  { id: 'motorcycle', name: 'Motorcycle', icon: <Bike className="w-6 h-6" />, description: 'Bikes, scooters', color: 'bg-orange-500' },
  { id: 'bicycle', name: 'Bicycle', icon: <Bike className="w-6 h-6" />, description: 'Electric, mountain, city', color: 'bg-green-500' },
  { id: 'worker', name: 'Service', icon: <Wrench className="w-6 h-6" />, description: 'Your skills & services', color: 'bg-purple-500' },
];

interface AIListingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    category: Category;
    images: string[];
    formData: Record<string, unknown>;
  }) => void;
}

export function AIListingAssistant({ isOpen, onClose, onComplete }: AIListingAssistantProps) {
  const [step, setStep] = useState<'category' | 'photos' | 'details' | 'generating' | 'review'>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<Record<string, unknown> | null>(null);

  const resetState = () => {
    setStep('category');
    setSelectedCategory(null);
    setImages([]);
    setDescription('');
    setPrice('');
    setLocation('');
    setGeneratedData(null);
    setIsGenerating(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const uploadImageToStorage = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const uniqueId = crypto.randomUUID();
    const fileName = `${userId}/${uniqueId}.${fileExt}`;

    const { error } = await supabase.storage
      .from('listing-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('listing-images')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleImageUpload = useCallback(async () => {
    if (images.length >= 30) {
      toast.error('Maximum 30 photos allowed');
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error('Please log in to upload images');
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      if (files.length + images.length > 30) {
        toast.error(`You can only add ${30 - images.length} more photos`);
        return;
      }

      setUploading(true);
      let uploadedCount = 0;

      for (const file of files) {
        const validation = validateImageFile(file);
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }

        try {
          const imageUrl = await uploadImageToStorage(file, user.user.id);
          setImages(prev => [...prev, imageUrl]);
          uploadedCount++;
        } catch (error) {
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} photo${uploadedCount > 1 ? 's' : ''} uploaded`);
      }
      setUploading(false);
    };

    input.click();
  }, [images.length]);

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateListing = async () => {
    if (!selectedCategory || images.length === 0) return;

    setIsGenerating(true);
    setStep('generating');

    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'listing',
          data: {
            category: selectedCategory,
            description: description.trim(),
            price: price.trim(),
            location: location.trim(),
            imageCount: images.length,
          },
        },
      });

      if (fnError) throw new Error(fnError.message || 'AI generation failed');
      if (fnData?.error) throw new Error(fnData.error);

      const aiResult = fnData?.result || {};

      const baseData: Record<string, unknown> = {
        ...aiResult,
        mode: 'rent',
        price: aiResult.price || (price ? parseFloat(price) : undefined),
        city: aiResult.city || location || undefined,
      };

      setGeneratedData(baseData);
      setStep('review');
      toast.success('AI listing generated!');
    } catch (err: any) {
      console.error('[AI] Generation error:', err);
      toast.error(err.message || 'AI generation failed. Using defaults.');

      const baseData: Record<string, unknown> = {
        title: description.slice(0, 50) || 'New Listing',
        price: price ? parseFloat(price) : undefined,
        city: location || undefined,
        mode: 'rent',
      };
      setGeneratedData(baseData);
      setStep('review');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleComplete = () => {
    if (!selectedCategory || !generatedData) return;

    onComplete({
      category: selectedCategory,
      images,
      formData: generatedData,
    });

    handleClose();
  };

  const canProceedToDetails = images.length >= 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[3rem] bg-background/90 backdrop-blur-2xl border-white/10 shadow-[var(--shadow-soft-lg)]">
        {/* Header - Premium Minimal */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-card/10 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.5rem] bg-primary/20 flex items-center justify-center shadow-inner">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground">Listing Assistant</h2>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-80">
                Step {step === 'category' ? 1 : step === 'photos' ? 2 : step === 'details' ? 3 : step === 'generating' ? 4 : 5} of 5
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => handleClose()} className="rounded-full h-11 w-11 hover:bg-white/10 transition-colors">
            <X className="w-6 h-6" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-8 pb-32 h-full">
            <AnimatePresence mode="wait">
              {/* Step 1: Category Selection */}
              {step === 'category' && (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black text-foreground tracking-tighter">What are you listing?</h3>
                    <p className="text-base text-muted-foreground font-medium leading-relaxed">Select a category to help the AI narrow down the details.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {CATEGORIES.map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.03, y: -5 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => { setSelectedCategory(cat.id); setStep('photos'); }}
                        className={cn(
                          "relative overflow-hidden group p-6 rounded-[2.5rem] text-left transition-all duration-500 border-2",
                          selectedCategory === cat.id
                            ? "bg-primary text-primary-foreground border-transparent shadow-[0_20px_40px_rgba(var(--primary),0.3)] scale-[1.02] z-10"
                            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                        )}
                      >
                        <div className={cn(
                          "w-14 h-14 rounded-[1.2rem] flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110",
                          selectedCategory === cat.id ? "bg-white/20 shadow-lg" : "bg-card/30 text-primary shadow-inner"
                        )}>
                          {cat.icon}
                        </div>
                        <h4 className="font-black text-lg tracking-tight">{cat.name}</h4>
                        <p className={cn(
                          "text-xs mt-2 font-medium leading-relaxed",
                          selectedCategory === cat.id ? "text-white/80" : "text-muted-foreground"
                        )}>{cat.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Photo Upload */}
              {step === 'photos' && (
                <motion.div
                  key="photos"
                  initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <h3 className="text-3xl font-black text-foreground tracking-tighter">Add Photos</h3>
                    <p className="text-base text-muted-foreground font-medium">Upload photos to let AI analyze your listing.</p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleImageUpload}
                    disabled={uploading}
                    className={cn(
                      "w-full p-16 rounded-[3rem] border-3 border-dashed transition-all flex flex-col items-center justify-center gap-6 group",
                      "border-white/10 hover:border-primary/50 hover:bg-primary/5 bg-white/2",
                      uploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {uploading ? (
                      <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    ) : (
                      <>
                        <div className="w-24 h-24 rounded-[2.2rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                          <Camera className="w-10 h-10 text-primary" />
                        </div>
                        <div className="text-center">
                          <p className="text-xl font-black tracking-tight">Select Photos</p>
                          <p className="text-sm text-muted-foreground font-bold mt-2">{images.length} / 30 uploaded</p>
                        </div>
                      </>
                    )}
                  </motion.button>

                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-[2rem] overflow-hidden group shadow-lg">
                          <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <button
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-destructive"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}


              {/* Step 3: Details */}
              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-foreground">Tell us more</h3>
                    <p className="text-sm text-muted-foreground">AI will fill in the gaps. Just provide the basics.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                      <Textarea
                        placeholder="e.g. 2 bedroom flat with sea view, high floor..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="rounded-[1.5rem] bg-secondary/30 border-border/40 min-h-[120px]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price ($)</Label>
                        <Input
                          placeholder="Monthly/Total"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="rounded-full bg-secondary/30 border-border/40 h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location</Label>
                        <Input
                          placeholder="City/Area"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="rounded-full bg-secondary/30 border-border/40 h-12"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Generating */}
              {step === 'generating' && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 text-center gap-6"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative w-24 h-24 rounded-[2.5rem] bg-primary flex items-center justify-center">
                      <Zap className="w-12 h-12 text-primary-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black">AI is thinking...</h3>
                    <p className="text-muted-foreground text-sm mt-1 max-w-[200px]">Crafting the perfect listing for you.</p>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Review */}
              {step === 'review' && generatedData && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-black">Listing Preview</h3>
                    <p className="text-sm text-muted-foreground">Here's what AI generated. You can edit further in the next step.</p>
                  </div>

                  <Card className="rounded-[2.5rem] bg-secondary/20 border-border/40 overflow-hidden">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {images.map((img, i) => (
                          <img key={i} src={img} alt="" className="w-20 h-20 rounded-[1.2rem] object-cover shrink-0" />
                        ))}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg leading-tight">{generatedData.title as string}</h4>
                        <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                          {generatedData.price && <span className="text-primary font-black">${(generatedData.price as number).toLocaleString()}</span>}
                          {generatedData.city && (
                            <span className="flex items-center gap-1 text-[10px]">
                              <MapPin className="w-3 h-3" />
                              {generatedData.city as string}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Bottom Actions - Floating Pill Style */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
          <div className="max-w-md mx-auto flex gap-3 pointer-events-auto">
            {step !== 'category' && step !== 'generating' && (
              <Button
                variant="secondary"
                onClick={() => setStep(step === 'photos' ? 'category' : step === 'details' ? 'photos' : 'details')}
                className="rounded-full px-6 h-14 font-bold border-border/40"
              >
                Back
              </Button>
            )}
            {step !== 'generating' && (
              <Button
                className="flex-1 rounded-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20"
                onClick={() => {
                  if (step === 'category') setStep('photos');
                  else if (step === 'photos') setStep('details');
                  else if (step === 'details') generateListing();
                  else if (step === 'review') handleComplete();
                }}
                disabled={step === 'category' ? !selectedCategory : step === 'photos' ? !canProceedToDetails : step === 'details' ? !description : false}
              >
                {step === 'details' ? 'Generate Listing' : step === 'review' ? 'Continue' : 'Next Step'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
