import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Globe, Flame, Sparkles, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { PhotoUploadManager } from '@/components/PhotoUploadManager';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { cn } from '@/lib/utils';

const NATIONALITY_OPTIONS = [
  'United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy',
  'Netherlands', 'Australia', 'Brazil', 'Argentina', 'Colombia', 'India', 'China', 'Japan',
  'South Korea', 'Other',
];

const LANGUAGE_OPTIONS = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Mandarin',
  'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch',
];

const INTEREST_OPTIONS = [
  'Sports & Fitness', 'Arts & Culture', 'Food & Cooking', 'Travel', 'Technology & Gaming',
  'Nature & Outdoors', 'Reading & Writing', 'Music & Concerts', 'Photography',
  'Yoga & Meditation', 'Entrepreneurship', 'Volunteering',
];

interface OnboardingFlowProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingFlow({ open, onComplete }: OnboardingFlowProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [profileImages, setProfileImages] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState('');
  const [nationality, setNationality] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [hasChildren, setHasChildren] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);

  const steps = [
    { title: 'Welcome', icon: Sparkles, description: 'Get started' },
    { title: 'Photos', icon: Camera, description: 'Add your profile photos' },
    { title: 'Basic Info', icon: User, description: 'Tell us about yourself' },
    { title: 'Demographics', icon: Globe, description: 'A bit more about you' },
    { title: 'Interests', icon: Flame, description: 'What do you love?' },
    { title: 'Complete', icon: CheckCircle2, description: 'You\'re all set!' },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const uniqueId = crypto.randomUUID();
      const fileName = `${uniqueId}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { data: _data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        logger.error('Supabase upload error:', error);
        // Provide more helpful error messages
        if (error.message.includes('size')) {
          throw new Error('Image file is too large. Please use a smaller image (max 10MB).');
        } else if (error.message.includes('type')) {
          throw new Error('Invalid image format. Please use JPG, PNG, WebP, or GIF.');
        } else if (error.message.includes('policy')) {
          throw new Error('Permission denied. Please try logging out and back in.');
        }
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      logger.error('Error uploading image:', error);
      throw error;
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter(l => l !== lang));
    } else if (languages.length < 5) {
      setLanguages([...languages, lang]);
    }
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else if (interests.length < 6) {
      setInterests([...interests, interest]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // Welcome
      case 1: return profileImages.length > 0; // Photos
      case 2: return name.trim() && age && gender; // Basic info
      case 3: return nationality && languages.length > 0; // Demographics
      case 4: return interests.length >= 3; // Interests
      default: return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      triggerHaptic('medium');
      uiSounds.playStarShoot();
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      triggerHaptic('light');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: name,
          age: Number(age),
          gender,
          nationality,
          languages,
          has_children: hasChildren,
          interest_categories: interests,
          images: profileImages,
          onboarding_completed: true,
          onboarding_step: 5,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id ?? '');

      if (error) throw error;

      toast({
        title: 'Welcome aboard!',
        description: 'Your profile is complete. Start swiping!',
      });

      onComplete();
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: 'Error',
        description: err.message || 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Welcome
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center space-y-6 py-8"
          >
            <div className="flex justify-center mb-4">
              {/* Visual verification: Logo removed per user request */}
              {/* <SwipessLogo size="lg" /> */}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Welcome!
              </h2>
              <p className="text-lg text-white/80">
                Let's set up your profile in just a few steps.
              </p>
              <p className="text-sm text-white/60 mt-2">
                This will help you find the perfect match faster.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-4">
              {steps.slice(1, -1).map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-white/70" />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 1: // Photos
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <Camera className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <h3 className="text-2xl font-bold text-white mb-2">Add Your Photos</h3>
              <p className="text-white/70">Upload at least one photo to get started</p>
            </div>
            <PhotoUploadManager
              maxPhotos={1}
              currentPhotos={profileImages}
              onPhotosChange={setProfileImages}
              uploadType="profile"
              onUpload={handleImageUpload}
            />
          </motion.div>
        );

      case 2: // Basic Info
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <User className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <h3 className="text-2xl font-bold text-white mb-2">Basic Information</h3>
              <p className="text-white/70">Tell us who you are</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Full Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  className="h-12 bg-white/5 border-white/20 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Age *</Label>
                  <Input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                    placeholder="25"
                    min="18"
                    max="99"
                    className="h-12 bg-white/5 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Gender *</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/20 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20 text-white">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="non-binary">Non-binary</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        );

      case 3: // Demographics
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Globe className="w-12 h-12 mx-auto mb-3 text-red-400" />
              <h3 className="text-2xl font-bold text-white mb-2">A Bit More About You</h3>
              <p className="text-white/70">This helps us find better matches</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Nationality *</Label>
                <Select value={nationality} onValueChange={setNationality}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/20 text-white">
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20 text-white max-h-60">
                    {NATIONALITY_OPTIONS.map(nat => (
                      <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Languages ({languages.length}/5) *</Label>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGE_OPTIONS.map(lang => (
                    <Badge
                      key={lang}
                      variant={languages.includes(lang) ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${languages.includes(lang)
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                          : 'hover:border-blue-400'
                        }`}
                      onClick={() => toggleLanguage(lang)}
                    >
                      {lang}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <Label className="text-white">Do you have children?</Label>
                <Switch
                  checked={hasChildren}
                  onCheckedChange={setHasChildren}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-red-600 data-[state=checked]:to-red-500"
                />
              </div>
            </div>
          </motion.div>
        );

      case 4: // Interests
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <Flame className="w-12 h-12 mx-auto mb-3 text-orange-400" />
              <h3 className="text-2xl font-bold text-white mb-2">What Do You Love?</h3>
              <p className="text-white/70">Select at least 3 interests</p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Interests ({interests.length}/6) *</Label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(interest => (
                  <Badge
                    key={interest}
                    variant={interests.includes(interest) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-all ${interests.includes(interest)
                        ? 'bg-gradient-to-r from-red-600 to-amber-500'
                        : 'hover:border-red-400'
                      }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </motion.div>
        );

      case 5: // Complete
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center space-y-6 py-8"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 to-rose-500 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-3">
                You're All Set!
              </h2>
              <p className="text-lg text-white/80">
                Your profile is complete and ready to go.
              </p>
              <p className="text-sm text-white/60 mt-2">
                Start swiping to find your perfect match!
              </p>
            </div>
            <div className="pt-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-rose-400" />
                <span className="text-white font-medium">{profileImages.length} Photos</span>
                <span className="text-white/50">•</span>
                <span className="text-white font-medium">{languages.length} Languages</span>
                <span className="text-white/50">•</span>
                <span className="text-white font-medium">{interests.length} Interests</span>
              </div>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  const handleSkip = async () => {
    // Mark onboarding as completed even if skipped
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: currentStep,
        })
        .eq('user_id', user?.id ?? '');

      onComplete();
    } catch (error) {
      logger.error('Error skipping onboarding:', error);
      onComplete(); // Still close even if update fails
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleSkip(); }}>
      <DialogContent
        className="sm:max-w-2xl bg-black border-white/5 text-white overflow-hidden p-0 rounded-[2.5rem]"
      >
        <div className="absolute inset-0 pointer-events-none">
          <AtmosphericLayer variant="nexus" opacity={0.1} />
        </div>

        <div className="relative z-10 p-6 sm:p-10 flex flex-col h-full max-h-[90vh]">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter bg-gradient-to-r from-[#FF4D00] to-[#EB4898] bg-clip-text text-transparent">
              {steps[currentStep].title}
            </DialogTitle>
          </DialogHeader>

          {/* Progress Bar: Liquid Design */}
          <div className="space-y-2 mb-8">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">
              <span>Protocol {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% Integrity</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#FF4D00] to-[#EB4898] relative"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
              >
                <div className="absolute top-0 right-0 h-full w-4 bg-white/40 blur-sm" />
              </motion.div>
            </div>
          </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>

        {/* Navigation Buttons: Tactical Grid */}
        <div className="mt-auto flex justify-between items-center gap-4 pt-8 border-t border-white/5">
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-12 px-6 rounded-2xl text-white/40 hover:text-white hover:bg-white/5 font-black uppercase tracking-widest text-[10px] italic transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Reverse
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="h-12 px-6 rounded-2xl text-white/20 hover:text-white/40 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] italic transition-all"
            >
              Skip Protocol
            </Button>
          </div>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="h-12 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-black uppercase tracking-widest text-[10px] italic shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all disabled:opacity-30"
            >
              Next Phase
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="h-12 px-8 rounded-2xl bg-[#FF4D00] text-white hover:bg-[#FF3D00] font-black uppercase tracking-widest text-[10px] italic shadow-[0_10px_30px_rgba(255,77,0,0.3)] active:scale-95 transition-all"
            >
              {isLoading ? 'Syncing...' : 'Initialize Swipess'}
            </Button>
          )}
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


