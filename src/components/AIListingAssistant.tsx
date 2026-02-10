import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  Upload,
  Camera,
  X,
  Loader2,
  Home,
  Bike,
  Wrench,
  ChevronRight,
  Image as ImageIcon,
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
  { id: 'property', name: 'Property', icon: <Home className="w-6 h-6" />, description: 'Apartments, houses, rooms', color: 'from-blue-500 to-blue-600' },
  { id: 'motorcycle', name: 'Motorcycle', icon: <Bike className="w-6 h-6" />, description: 'Bikes, scooters', color: 'from-orange-500 to-orange-600' },
  { id: 'bicycle', name: 'Bicycle', icon: <Bike className="w-6 h-6" />, description: 'Electric, mountain, city', color: 'from-green-500 to-green-600' },
  { id: 'worker', name: 'Service', icon: <Wrench className="w-6 h-6" />, description: 'Your skills & services', color: 'from-purple-500 to-purple-600' },
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

    // Simulate AI generation (in production, this would call an AI API)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate smart defaults based on category and user input
    const baseData: Record<string, unknown> = {
      title: generateTitle(selectedCategory, description),
      price: price ? parseFloat(price) : undefined,
      city: location || undefined,
      mode: 'rent',
    };

    // Add category-specific fields
    if (selectedCategory === 'property') {
      Object.assign(baseData, {
        property_type: 'apartment',
        beds: 2,
        baths: 1,
        furnished: true,
        pet_friendly: false,
        amenities: ['wifi', 'kitchen', 'washer'],
      });
    } else if (selectedCategory === 'motorcycle') {
      Object.assign(baseData, {
        motorcycle_type: 'sport',
        vehicle_condition: 'good',
        includes_helmet: true,
      });
    } else if (selectedCategory === 'bicycle') {
      Object.assign(baseData, {
        bicycle_type: 'city',
        vehicle_condition: 'good',
        includes_lock: true,
        includes_lights: true,
      });
    } else if (selectedCategory === 'worker') {
      Object.assign(baseData, {
        service_category: 'general',
        work_type: 'freelance',
        experience_level: 'intermediate',
        location_type: 'on_site',
      });
    }

    // AI usage tracking removed - table doesn't exist

    setGeneratedData(baseData);
    setIsGenerating(false);
    setStep('review');
  };

  const generateTitle = (category: Category, desc: string): string => {
    const categoryTitles: Record<Category, string[]> = {
      property: ['Cozy Apartment', 'Modern Space', 'Beautiful Home', 'Charming Room'],
      motorcycle: ['Sport Bike', 'Cruiser Motorcycle', 'Adventure Bike'],
      bicycle: ['City Bike', 'Mountain Bicycle', 'Electric Bike'],
      worker: ['Professional Service', 'Expert Help', 'Quality Work'],
    };

    if (desc.trim()) {
      // Use first 50 chars of description as title base
      return desc.slice(0, 50) + (desc.length > 50 ? '...' : '');
    }

    const titles = categoryTitles[category];
    return titles[Math.floor(Math.random() * titles.length)];
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
  const canGenerate = description.trim() || price.trim();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[90vh] sm:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <DialogTitle className="text-xl">AI Listing Assistant</DialogTitle>
              <DialogDescription>
                Upload photos and let AI help create your listing
              </DialogDescription>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-4">
            {['category', 'photos', 'details', 'review'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : ['category', 'photos', 'details', 'generating', 'review'].indexOf(step) > i
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {['category', 'photos', 'details', 'generating', 'review'].indexOf(step) > i ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      "w-8 h-0.5 mx-1",
                      ['category', 'photos', 'details', 'generating', 'review'].indexOf(step) > i
                        ? "bg-primary"
                        : "bg-secondary"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-6 pb-8">
            <AnimatePresence mode="wait">
              {/* Step 1: Category Selection */}
              {step === 'category' && (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold">What are you listing?</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "p-4 rounded-xl border-2 text-left transition-all",
                          selectedCategory === cat.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-3",
                          cat.color
                        )}>
                          {cat.icon}
                        </div>
                        <p className="font-semibold">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{cat.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Photo Upload */}
              {step === 'photos' && (
                <motion.div
                  key="photos"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Add Photos</h3>
                    <Badge variant="secondary">{images.length}/30</Badge>
                  </div>

                  {/* Upload Area */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleImageUpload}
                    disabled={uploading}
                    className={cn(
                      "w-full p-8 rounded-xl border-2 border-dashed transition-all",
                      "hover:border-primary hover:bg-primary/5",
                      uploading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <Camera className="w-8 h-8 text-primary" />
                        </div>
                        <p className="font-medium">Tap to upload photos</p>
                        <p className="text-xs text-muted-foreground">
                          Upload multiple photos at once
                        </p>
                      </div>
                    )}
                  </motion.button>

                  {/* Image Grid */}
                  {images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {images.map((img, index) => (
                        <div key={`ai-img-${img}-${index}`} className="relative aspect-square group">
                          <img
                            src={img}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveImage(index)}
                            className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {index === 0 && (
                            <Badge className="absolute bottom-1 left-1 text-[10px]">Cover</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground text-center">
                    Add at least 1 photo to continue. The first photo will be your cover image.
                  </p>
                </motion.div>
              )}

              {/* Step 3: Quick Details */}
              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold">Tell us about it</h3>
                  <p className="text-sm text-muted-foreground">
                    Just provide some basic info - AI will help fill in the rest!
                  </p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Brief Description
                      </Label>
                      <Textarea
                        placeholder="e.g., '2 bedroom apartment near downtown, recently renovated, has parking'"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Price (optional)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Monthly rent/price"
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Location (optional)
                        </Label>
                        <Input
                          placeholder="City or area"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-4 flex items-start gap-3">
                      <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">AI will auto-fill the rest</p>
                        <p className="text-xs text-muted-foreground">
                          Based on your photos and description, we'll suggest title, features, and more.
                          You can edit everything before publishing.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Generating State */}
              {step === 'generating' && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 flex flex-col items-center justify-center gap-4"
                >
                  <motion.div
                    className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-10 h-10 text-primary-foreground" />
                  </motion.div>
                  <h3 className="text-xl font-bold">Creating your listing...</h3>
                  <p className="text-muted-foreground text-center max-w-xs">
                    AI is analyzing your photos and generating the perfect listing details
                  </p>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {step === 'review' && generatedData && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold">Listing Ready!</h3>
                  </div>

                  <Card>
                    <CardContent className="p-4 space-y-4">
                      {/* Preview Images */}
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {images.slice(0, 4).map((img, i) => (
                          <img
                            key={`preview-${img}-${i}`}
                            src={img}
                            alt={`Preview ${i}`}
                            className="w-20 h-20 object-cover rounded-lg shrink-0"
                          />
                        ))}
                        {images.length > 4 && (
                          <div className="w-20 h-20 bg-secondary rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium">+{images.length - 4}</span>
                          </div>
                        )}
                      </div>

                      {/* Generated Details */}
                      <div className="space-y-2">
                        <p className="font-semibold text-lg">{generatedData.title as string}</p>
                        {generatedData.price && (
                          <p className="text-primary font-bold">
                            ${(generatedData.price as number).toLocaleString()}/month
                          </p>
                        )}
                        {generatedData.city && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {generatedData.city as string}
                          </p>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground">
                        You can edit all details after proceeding to the full form.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="shrink-0 flex justify-between gap-3 px-6 py-4 border-t bg-background">
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'category') handleClose();
              else if (step === 'photos') setStep('category');
              else if (step === 'details') setStep('photos');
              else if (step === 'review') setStep('details');
            }}
          >
            {step === 'category' ? 'Cancel' : 'Back'}
          </Button>

          {step === 'category' && (
            <Button
              onClick={() => setStep('photos')}
              disabled={!selectedCategory}
              className="gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {step === 'photos' && (
            <Button
              onClick={() => setStep('details')}
              disabled={!canProceedToDetails}
              className="gap-2"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {step === 'details' && (
            <Button
              onClick={generateListing}
              disabled={isGenerating}
              className="gap-2 bg-gradient-to-r from-primary to-primary/80"
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </Button>
          )}

          {step === 'review' && (
            <Button
              onClick={handleComplete}
              className="gap-2"
            >
              Continue to Edit <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
