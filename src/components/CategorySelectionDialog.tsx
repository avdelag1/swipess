import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bike, Briefcase, Building2, Key, Repeat, Sparkles, Tag, X } from "lucide-react";
import { MotorcycleIcon } from "@/components/icons/MotorcycleIcon";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface CategorySelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategorySelect?: (category: 'property' | 'motorcycle' | 'bicycle' | 'worker', mode: 'rent' | 'sale' | 'both') => void;
  onAIOpen?: () => void;
  navigateToNewPage?: boolean;
}

interface Category {
  id: 'property' | 'motorcycle' | 'bicycle' | 'worker';
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  iconColor: string;
  glowColor: string;
  popular?: boolean;
}



const categories: Category[] = [
  {
    id: 'property',
    name: 'Property',
    description: 'Apartments, houses, condos, villas',
    icon: <Building2 className="w-6 h-6" />,
    gradient: 'from-rose-500/10 to-transparent',
    iconColor: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/15',
    glowColor: 'hover:border-rose-300 dark:hover:border-rose-500/30',
    popular: true,
  },
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    description: 'Motorcycles, scooters, ATVs',
    icon: <MotorcycleIcon className="w-6 h-6" />,
    gradient: 'from-orange-500/10 to-transparent',
    iconColor: 'text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-500/15',
    glowColor: 'hover:border-orange-300 dark:hover:border-orange-500/30',
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    description: 'Bikes, e-bikes, mountain bikes',
    icon: <Bike className="w-6 h-6" />,
    gradient: 'from-violet-500/10 to-transparent',
    iconColor: 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/15',
    glowColor: 'hover:border-violet-300 dark:hover:border-violet-500/30',
  },
  {
    id: 'worker',
    name: 'Jobs & Services',
    description: 'Chef, cleaner, nanny, handyman, and more',
    icon: <Briefcase className="w-6 h-6" />,
    gradient: 'from-amber-500/10 to-transparent',
    iconColor: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/15',
    glowColor: 'hover:border-amber-300 dark:hover:border-amber-500/30',
  },
];

// Category-specific mode configurations
const getModes = (categoryId: string) => {
  const modeMap: Record<string, { id: 'rent' | 'sale' | 'both'; label: string; icon: React.ReactNode; description: string }[]> = {
    property: [
      { id: 'rent', label: 'For Rent', icon: <Key className="w-5 h-5" />, description: 'Monthly or short-term rental' },
      { id: 'sale', label: 'For Sale', icon: <Tag className="w-5 h-5" />, description: 'Property for purchase' },
      { id: 'both', label: 'Both Options', icon: <Repeat className="w-5 h-5" />, description: 'Rent & sale available' },
    ],
    motorcycle: [
      { id: 'rent', label: 'For Rent', icon: <Key className="w-5 h-5" />, description: 'Daily, weekly, or monthly rental' },
      { id: 'sale', label: 'For Sale', icon: <Tag className="w-5 h-5" />, description: 'Motorcycle for purchase' },
      { id: 'both', label: 'Both Options', icon: <Repeat className="w-5 h-5" />, description: 'Rent & sale available' },
    ],
    bicycle: [
      { id: 'rent', label: 'For Rent', icon: <Key className="w-5 h-5" />, description: 'Hourly, daily, or weekly rental' },
      { id: 'sale', label: 'For Sale', icon: <Tag className="w-5 h-5" />, description: 'Bicycle for purchase' },
      { id: 'both', label: 'Both Options', icon: <Repeat className="w-5 h-5" />, description: 'Rent & sale available' },
    ],
  };
  return modeMap[categoryId] || modeMap.property;
};

export function CategorySelectionDialog({ 
  open, 
  onOpenChange, 
  onCategorySelect,
  onAIOpen,
  navigateToNewPage = false
}: CategorySelectionDialogProps) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [step, setStep] = useState<'category' | 'mode'>('category');
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    if (category.id === 'worker') {
      if (navigateToNewPage) {
        navigate(`/owner/listings/new?category=${category.id}&mode=rent`);
        onOpenChange(false);
      } else {
        if (onCategorySelect) {
          onCategorySelect(category.id, 'rent');
        }
        onOpenChange(false);
      }
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => {
        setSelectedCategory(null);
        setStep('category');
      }, 150);
      return;
    }
    setStep('mode');
  };

  const handleModeSelect = (mode: 'rent' | 'sale' | 'both') => {
    if (!selectedCategory) return;

    if (navigateToNewPage) {
      navigate(`/owner/listings/new?category=${selectedCategory.id}&mode=${mode}`);
      onOpenChange(false);
    } else {
      if (onCategorySelect) {
        onCategorySelect(selectedCategory.id, mode);
      }
      onOpenChange(false);
    }
    
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    resetTimeoutRef.current = setTimeout(() => {
      setSelectedCategory(null);
      setStep('category');
    }, 150);
  };

  const handleBack = () => {
    setStep('category');
    setSelectedCategory(null);
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => {
        setSelectedCategory(null);
        setStep('category');
      }, 150);
    }
  };

  const handleOpenAI = () => {
    if (onAIOpen) onAIOpen();
    requestAnimationFrame(() => onOpenChange(false));
  };

  const modes = selectedCategory ? getModes(selectedCategory.id) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        hideCloseButton
        motionPreset="fade"
        className={cn(
        "!w-full !max-w-none !h-[100dvh] !max-h-none !rounded-none !p-0",
        "sm:!w-[calc(100%-24px)] sm:!max-w-2xl sm:!h-[85vh] sm:!max-h-[85vh] sm:!rounded-[3rem]",
        "flex flex-col p-0 gap-0 overflow-hidden border dark:bg-black/95 bg-white dark:border-white/10 border-black/10 dark:shadow-[0_40px_100px_rgba(0,0,0,1)] shadow-[0_40px_100px_rgba(0,0,0,0.2)]"
      )}>
        
        <DialogHeader className="shrink-0 px-6 sm:px-8 pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:pt-8 pb-4 sm:pb-6 border-b dark:border-white/5 border-black/5 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <DialogTitle className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter text-foreground">
                {step === 'category' ? 'Create New Listing' : `${selectedCategory?.name} Listing`}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-1 opacity-70">
                {step === 'category'
                  ? 'Select the type of listing you want to create'
                  : 'Choose how you want to list this item'}
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => handleClose(false)}
              aria-label="Close"
              className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 press-snappy shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 relative z-10">
          <div className="p-6 sm:p-8 pb-10 sm:pb-12">
            <AnimatePresence mode="sync">
              {step === 'category' ? (
                <div className="space-y-4">
                  {/* MAGIC AI LISTING CARD */}
                  <button
                    onClick={handleOpenAI}
                    className={cn(
                      "group relative w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-150 press-snappy",
                      "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-rose-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5",
                      "hover:border-indigo-500/40 hover:shadow-indigo-500/10"
                    )}
                  >
                    <div className="absolute top-3 right-3">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    </div>
                    
                    <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent_70%)] animate-pulse" />
                      <Sparkles className="relative z-10 w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black uppercase italic tracking-tighter text-foreground text-lg">Magic AI Listing</h3>
                        <Badge className="bg-indigo-500 text-[9px] h-4 px-1.5 font-black uppercase tracking-[0.2em] border-none">Fastest</Badge>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5 line-clamp-2">
                        Upload photos & describe your asset. AI generates the entire listing in seconds.
                      </p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-indigo-400/40 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <div className="flex items-center gap-4 px-2 py-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-40" />
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40 italic">Or manual mode</span>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-border to-transparent opacity-40" />
                  </div>

                  <motion.div
                    key="category"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.08, ease: "easeOut" }}
                    className="grid grid-cols-1 gap-3"
                  >
                  {categories.map((category, index) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className={cn(
                        "group relative flex items-center gap-4 sm:gap-5 p-5 sm:p-6 rounded-[2rem] text-left transition-all duration-150 press-snappy",
                        "bg-card/60 border border-border/40",
                        "hover:shadow-2xl hover:bg-card/80",
                        category.glowColor
                      )}
                    >
                      {category.popular && (
                        <Badge className="absolute -top-3 right-4 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 z-10 border-none">
                          Popular
                        </Badge>
                      )}

                      <div className={cn(
                        "relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                        category.iconColor
                      )}>
                        {category.icon}
                      </div>

                      <div className="relative z-10 flex-1 min-w-0">
                        <h3 className="font-black italic uppercase tracking-tight text-foreground text-lg">
                          {category.name}
                        </h3>
                        <p className="text-[11px] font-bold text-muted-foreground mt-0.5 line-clamp-1 opacity-70">
                          {category.description}
                        </p>
                      </div>

                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 shrink-0">
                        <ArrowRight className="relative z-10 w-4 h-4 text-foreground/70" />
                      </div>
                    </button>
                  ))}
                </motion.div>
              </div>
            ) : (
                <motion.div
                  key="mode"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.08, ease: "easeOut" }}
                  className="space-y-3 sm:space-y-4"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-1 sm:mb-2 -ml-2 text-muted-foreground hover:text-foreground text-[10px] font-black uppercase tracking-widest"
                  >
                    ← Back to categories
                  </Button>

                  {selectedCategory && (
                    <div className={cn(
                      "flex items-center gap-4 p-5 rounded-[2rem] mb-6 border border-border/40 bg-card/40 backdrop-blur-md shadow-inner"
                    )}>
                      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", selectedCategory.iconColor)}>
                        {selectedCategory.icon}
                      </div>
                      <div>
                        <h3 className="font-black italic uppercase tracking-tighter text-foreground text-base">{selectedCategory.name}</h3>
                        <p className="text-[10px] font-bold opacity-70 text-muted-foreground uppercase tracking-widest mt-0.5">{selectedCategory.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pl-2">
                       <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] italic">Listing Type</h4>
                       <div className="h-px flex-1 bg-gradient-to-r from-border/50 to-transparent" />
                    </div>
                    {modes.map((mode, index) => (
                      <button
                        key={mode.id}
                        onClick={() => handleModeSelect(mode.id)}
                        className={cn(
                          "group w-full flex items-center gap-5 p-5 rounded-[2rem] text-left transition-all duration-150 press-snappy",
                          "bg-card/60 border border-border/40",
                          "hover:border-foreground/20 hover:shadow-2xl hover:bg-card/80"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner",
                          selectedCategory?.id === 'property' ? 'bg-rose-500/20 text-rose-500' :
                          selectedCategory?.id === 'motorcycle' ? 'bg-orange-500/20 text-orange-500' :
                          selectedCategory?.id === 'bicycle' ? 'bg-violet-500/20 text-violet-500' :
                          'bg-amber-500/20 text-amber-500'
                        )}>
                          {mode.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black italic uppercase tracking-tighter text-foreground text-base">
                            {mode.label}
                          </h3>
                          <p className="text-[11px] font-bold text-muted-foreground opacity-70 mt-0.5">
                            {mode.description}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 shrink-0">
                           <ArrowRight className="w-4 h-4 text-foreground/70" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


