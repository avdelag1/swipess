import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Building2, Bike, ArrowRight, Sparkles, Briefcase, Key, Tag, Repeat } from "lucide-react";
import { MotorcycleIcon } from "@/components/icons/MotorcycleIcon";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
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

const springTap = { type: "spring" as const, stiffness: 500, damping: 30 };

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
    onOpenChange(false);
    if (onAIOpen) {
      onAIOpen();
    }
  };

  const modes = selectedCategory ? getModes(selectedCategory.id) : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "!top-0 !left-0 !translate-x-0 !translate-y-0 !w-full !max-w-none !h-[100dvh] !max-h-none !rounded-none",
        "sm:!top-[50%] sm:!left-[50%] sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!w-[calc(100%-24px)] sm:!max-w-2xl sm:!h-[85vh] sm:!max-h-[85vh] sm:!rounded-[var(--radius-xl)]",
        "flex flex-col p-0 gap-0 overflow-hidden"
      )}>
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-6 pb-3 sm:pb-4 border-b border-border/40">
          <div>
            <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground">
              {step === 'category' ? 'Create New Listing' : `${selectedCategory?.name} Listing`}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {step === 'category'
                ? 'Select the type of listing you want to create'
                : 'Choose how you want to list this item'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 sm:p-6 pb-6 sm:pb-8">
            <AnimatePresence mode="wait">
              {step === 'category' ? (
                <div className="space-y-4">
                  {/* MAGIC AI LISTING CARD */}
                  <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenAI}
                    className={cn(
                      "group relative w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-300",
                      "bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-rose-500/10 border border-indigo-500/20 shadow-lg shadow-indigo-500/5",
                      "hover:border-indigo-500/40 hover:shadow-indigo-500/10"
                    )}
                  >
                    <div className="absolute top-3 right-3">
                      <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                    </div>
                    
                    <div className="relative w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.4),transparent_70%)] animate-pulse" />
                      <Sparkles className="relative z-10 w-7 h-7 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-base">Magic AI Listing</h3>
                        <Badge className="bg-indigo-500 text-[10px] h-4 px-1.5 font-black uppercase tracking-tighter border-none">Fastest</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        Upload photos & describe your asset. AI generates the entire listing in seconds.
                      </p>
                    </div>

                    <ArrowRight className="w-5 h-5 text-indigo-400/40 group-hover:translate-x-1 transition-transform" />
                  </motion.button>

                  <div className="flex items-center gap-2 px-1">
                    <div className="h-[1px] flex-1 bg-border/40" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or create manually</span>
                    <div className="h-[1px] flex-1 bg-border/40" />
                  </div>

                  <motion.div
                    key="category"
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 15 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="grid grid-cols-1 gap-3"
                  >
                  {categories.map((category, index) => (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.025, duration: 0.2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleCategorySelect(category)}
                      className={cn(
                        "group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all duration-200",
                        "bg-card border border-border/60",
                        "hover:shadow-md",
                        category.glowColor
                      )}
                    >
                      {category.popular && (
                        <Badge className="absolute -top-2 right-3 bg-rose-500 text-white text-[10px] px-2 py-0.5 z-10 font-medium">
                          Popular
                        </Badge>
                      )}

                      <div className={cn(
                        "relative z-10 w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        category.iconColor
                      )}>
                        {category.icon}
                      </div>

                      <div className="relative z-10 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-base">
                          {category.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {category.description}
                        </p>
                      </div>

                      <ArrowRight className="relative z-10 w-4 h-4 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform self-center shrink-0" />
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            ) : (
                <motion.div
                  key="mode"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="space-y-3 sm:space-y-4"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleBack}
                    className="mb-1 sm:mb-2 -ml-2 text-muted-foreground hover:text-foreground text-sm"
                  >
                    ← Back to categories
                  </Button>

                  {selectedCategory && (
                    <div className={cn(
                      "flex items-center gap-3 p-4 rounded-2xl mb-4 border border-border/60 bg-card"
                    )}>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", selectedCategory.iconColor)}>
                        {selectedCategory.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{selectedCategory.name}</h3>
                        <p className="text-xs text-muted-foreground">{selectedCategory.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Listing Type</h4>
                    {modes.map((mode, index) => (
                      <motion.button
                        key={mode.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleModeSelect(mode.id)}
                        className={cn(
                          "group w-full flex items-center gap-3 p-4 rounded-2xl text-left transition-all duration-200",
                          "bg-card border border-border/60",
                          "hover:border-border hover:shadow-md"
                        )}
                      >
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 shadow-inner",
                          selectedCategory.id === 'property' ? 'bg-rose-500/20 text-rose-500 shadow-rose-500/10' :
                          selectedCategory.id === 'motorcycle' ? 'bg-orange-500/20 text-orange-500 shadow-orange-500/10' :
                          selectedCategory.id === 'bicycle' ? 'bg-violet-500/20 text-violet-500 shadow-violet-500/10' :
                          'bg-amber-500/20 text-amber-500 shadow-amber-500/10'
                        )}>
                          {mode.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-sm">
                            {mode.label}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {mode.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </motion.button>
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


