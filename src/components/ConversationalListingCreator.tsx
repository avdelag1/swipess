import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Send, Loader2, CheckCircle2, Circle, Upload, MessageSquare, ArrowLeft, ArrowRight, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useConversationalAI } from '@/hooks/ai/useConversationalAI';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { validateImageFile } from '@/utils/fileValidation';

type Step = 'category' | 'photos' | 'conversation' | 'review';

type Category = 'property' | 'motorcycle' | 'bicycle' | 'worker';

const CATEGORY_OPTIONS: { value: Category; label: string; icon: string; description: string }[] = [
  { value: 'property', label: 'Property', icon: '🏠', description: 'Apartments, houses, rooms for rent or sale' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️', description: 'Motorcycles and scooters' },
  { value: 'bicycle', label: 'Bicycle', icon: '🚴', description: 'Bikes and e-bikes' },
  { value: 'worker', label: 'Service', icon: '🔧', description: 'Professional services and workers' },
];

const MAX_PHOTOS: Record<Category, number> = {
  property: 15,
  motorcycle: 5,
  bicycle: 5,
  worker: 10,
};

export function ConversationalListingCreator() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('category');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messageInput, setMessageInput] = useState('');

  const {
    messages,
    extractedData,
    isLoading,
    error,
    isComplete,
    isInitialized,
    sendMessage,
    initializeConversation,
    completionPercentage,
  } = useConversationalAI({
    category: selectedCategory || 'property',
    imageCount: images.length,
  });

  // Image upload helper function
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

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation when entering conversation step
  useEffect(() => {
    if (step === 'conversation' && !isInitialized) {
      initializeConversation();
    }
  }, [step, isInitialized, initializeConversation]);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    setStep('photos');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxPhotos = selectedCategory ? MAX_PHOTOS[selectedCategory] : 15;
    if (files.length + images.length > maxPhotos) {
      toast.error(`You can only add ${maxPhotos - images.length} more photos`);
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast.error('Please log in to upload images');
      return;
    }

    setIsUploading(true);
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
    setIsUploading(false);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleContinueToConversation = () => {
    if (images.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }
    setStep('conversation');
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;

    const message = messageInput;
    setMessageInput('');

    try {
      await sendMessage(message);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleReview = () => {
    setStep('review');
  };

  const handleSubmitListing = async () => {
    if (!selectedCategory) return;

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Prepare listing data
      const listingData = {
        user_id: user.id,
        owner_id: user.id,
        category: selectedCategory,
        images,
        ...extractedData,
        title: (extractedData as Record<string, unknown>).title as string || 'Untitled Listing',
        price: Number((extractedData as Record<string, unknown>).price) || 0,
        location: (extractedData as Record<string, unknown>).city as string || (extractedData as Record<string, unknown>).location as string || 'Unknown',
        status: 'active',
        is_active: true,
        currency: 'USD',
        country: 'Mexico',
      };

      const { error: insertError } = await supabase
        .from('listings')
        .insert([listingData]);

      if (insertError) throw insertError;

      toast.success('Listing created successfully!');
      navigate('/owner-dashboard');
    } catch (error) {
      console.error('Failed to create listing:', error);
      toast.error('Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render different steps
  if (step === 'category') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold">Create Listing with AI</h1>
            </div>
            <p className="text-muted-foreground">Choose what you'd like to list</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORY_OPTIONS.map((option) => (
              <Card
                key={option.value}
                className="cursor-pointer hover:border-primary transition-all hover:shadow-lg"
                onClick={() => handleCategorySelect(option.value)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{option.icon}</div>
                    <div>
                      <CardTitle>{option.label}</CardTitle>
                      <CardDescription>{option.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'photos') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <div className="max-w-4xl mx-auto py-8">
          <Button variant="ghost" onClick={() => setStep('category')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Categories
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-6 h-6" />
                Upload Photos
              </CardTitle>
              <CardDescription>
                Add photos of your {selectedCategory}. You can upload up to {selectedCategory && MAX_PHOTOS[selectedCategory]} photos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag and drop photos
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  PNG, JPG up to 10MB each
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {images.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  {images.length} / {selectedCategory && MAX_PHOTOS[selectedCategory]} photos uploaded
                </p>
              )}

              <Button
                onClick={handleContinueToConversation}
                disabled={images.length === 0 || isUploading}
                className="w-full"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    Continue to AI Chat
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'conversation') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-6">
        <div className="max-w-4xl mx-auto py-8">
          <Button variant="ghost" onClick={() => setStep('photos')} className="mb-6 rounded-full hover:bg-white/10 px-6 font-bold">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Photos
          </Button>

          <Card className="h-[calc(100vh-220px)] flex flex-col rounded-[3rem] border-white/10 bg-background/60 backdrop-blur-3xl shadow-2xl overflow-hidden ring-1 ring-white/5">
            <CardHeader className="border-b border-white/5 py-8 px-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shadow-inner">
                    <MessageSquare className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black tracking-tight">AI Assistant</CardTitle>
                    <CardDescription className="text-sm font-bold opacity-70">Tell us about your listing</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={isComplete ? "default" : "secondary"} className="rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest shadow-lg">
                    {completionPercentage}% Complete
                  </Badge>
                  <Progress value={completionPercentage} className="h-2 w-32 mt-3 rounded-full bg-white/10 transition-all duration-1000" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col overflow-hidden p-8">
              <ScrollArea className="flex-1 pr-6">
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] px-6 py-4 rounded-[2.2rem] text-sm font-bold leading-relaxed shadow-sm",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-[#E4007C] to-[#C4006C] text-white rounded-tr-sm"
                            : "bg-white/10 text-foreground rounded-tl-sm border border-white/5 backdrop-blur-xl"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/10 backdrop-blur-xl rounded-[1.5rem] px-6 py-4 flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-xs font-black uppercase tracking-widest opacity-60">AI is thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="mt-8 space-y-4">
                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-black text-destructive uppercase tracking-widest text-center">{error}</motion.p>
                )}

                <div className="flex gap-3 bg-white/5 p-2 rounded-[2.5rem] border border-white/10 focus-within:border-primary/50 transition-colors shadow-inner">
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Describe your listing..."
                    className="flex-1 bg-transparent border-none focus-visible:ring-0 h-14 px-6 text-base font-bold placeholder:text-muted-foreground/40"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !messageInput.trim()}
                    className="aspect-square h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/20 transition-all hover:scale-105"
                  >
                    <Send className="w-6 h-6" />
                  </Button>
                </div>

                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Button onClick={handleReview} className="w-full h-16 rounded-[2.5rem] mexican-pink-premium" size="lg">
                      Review Listing
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  if (step === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <div className="max-w-4xl mx-auto py-8">
          <Button variant="ghost" onClick={() => setStep('conversation')} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>Review Your Listing</CardTitle>
              <CardDescription>Check all the details before publishing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photos */}
              <div>
                <h3 className="font-semibold mb-2">Photos ({images.length})</h3>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>

              {/* Extracted Data */}
              <div>
                <h3 className="font-semibold mb-2">Listing Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(extractedData).map(([key, value]) => (
                    <div key={key} className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-medium">
                        {Array.isArray(value) ? value.join(', ') : String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep('conversation')}
                  className="flex-1"
                >
                  Edit Details
                </Button>
                <Button
                  onClick={handleSubmitListing}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Publish Listing
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
