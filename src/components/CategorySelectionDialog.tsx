import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Home, Bike, CircleDot, ArrowRight, Sparkles, Briefcase, Zap } from "lucide-react";
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
    icon: <Home className="w-7 h-7" />,
    gradient: 'from-emerald-500/25 via-emerald-500/8 to-transparent',
    iconColor: 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/20',
    glowColor: 'hover:shadow-emerald-500/15',
    popular: true,
  },
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    description: 'Motorcycles, scooters, ATVs',
    icon: <CircleDot className="w-7 h-7" />,
    gradient: 'from-orange-500/25 via-orange-500/8 to-transparent',
    iconColor: 'text-orange-400 bg-orange-500/15 border border-orange-500/20',
    glowColor: 'hover:shadow-orange-500/15',
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    description: 'Bikes, e-bikes, mountain bikes',
    icon: <Bike className="w-7 h-7" />,
    gradient: 'from-purple-500/25 via-purple-500/8 to-transparent',
    iconColor: 'text-purple-400 bg-purple-500/15 border border-purple-500/20',
    glowColor: 'hover:shadow-purple-500/15',
  },
  {
    id: 'worker',
    name: 'Jobs & Services',
    description: 'Chef, cleaner, nanny, handyman, and more',
    icon: <Briefcase className="w-7 h-7" />,
    gradient: 'from-amber-500/25 via-amber-500/8 to-transparent',
    iconColor: 'text-amber-400 bg-amber-500/15 border border-amber-500/20',
    glowColor: 'hover:shadow-amber-500/15',
  },
];

const modes = [
  { id: 'rent' as const, label: 'For Rent', emoji: '🏠', description: 'Monthly or short-term rental' },
  { id: 'sale' as const, label: 'For Sale', emoji: '💰', description: 'One-time purchase' },
  { id: 'both' as const, label: 'Both Options', emoji: '✨', description: 'Rent & sale available' },
];

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
      }, 300);
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
    }, 300);
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
      }, 300);
    }
  };

  const handleOpenAI = () => {
    onOpenChange(false);
    if (onAIOpen) {
      onAIOpen();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "!top-0 !left-0 !translate-x-0 !translate-y-0 !w-full !max-w-none !h-[100dvh] !max-h-none !rounded-none",
        "sm:!top-[50%] sm:!left-[50%] sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!w-[calc(100%-24px)] sm:!max-w-2xl sm:!h-[85vh] sm:!max-h-[85vh] sm:!rounded-[var(--radius-xl)]",
        "flex flex-col p-0 gap-0 overflow-hidden"
      )}>
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-[calc(env(safe-area-inset-top)+1rem)] sm:pt-6 pb-3 sm:pb-4 border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
          
          {/* AI BUTTON — Shimmer gradient */}
          <motion.button
            onClick={handleOpenAI}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.01 }}
            transition={springTap}
            className="relative w-full mb-4 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white border-0 shadow-2xl shadow-purple-500/30 px-5 py-3.5 font-bold text-base flex items-center justify-center gap-2.5"
          >
            <Zap className="w-5 h-5" />
            ✨ Generate Listing with AI
          </motion.button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold">
                {step === 'category' ? 'Create New Listing' : `${selectedCategory?.name} Listing`}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground/80">
                {step === 'category'
                  ? 'Select the type of listing you want to create'
                  : 'Choose how you want to list this item'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 sm:p-6 pb-6 sm:pb-8">
            <AnimatePresence mode="wait">
              {step === 'category' ? (
                <motion.div
                  key="category"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 gap-3"
                >
                  {categories.map((category, index) => (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.96 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      onClick={() => handleCategorySelect(category)}
                      className={cn(
                        "group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-left transition-all duration-300",
                        "bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]",
                        "hover:border-white/20 hover:bg-white/[0.07]",
                        "shadow-lg hover:shadow-2xl",
                        category.glowColor
                      )}
                    >
                      {/* Category gradient overlay */}
                      <div className={cn("absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br opacity-60", category.gradient)} />
                      
                      {category.popular && (
                        <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px] sm:text-xs px-2.5 py-0.5 shadow-lg shadow-primary/30 z-10">
                          Popular
                        </Badge>
                      )}

                      <div className={cn(
                        "relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                        category.iconColor
                      )}>
                        {category.icon}
                      </div>

                      <div className="relative z-10 flex-1 min-w-0">
                        <h3 className="font-bold text-foreground text-base sm:text-lg group-hover:text-white transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground/80 mt-0.5 line-clamp-1">
                          {category.description}
                        </p>
                      </div>

                      <ArrowRight className="relative z-10 w-5 h-5 text-muted-foreground/40 group-hover:text-white group-hover:translate-x-1 transition-all self-center shrink-0" />
                    </motion.button>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="mode"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
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
                      "relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl mb-4 sm:mb-6 overflow-hidden",
                      "bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]"
                    )}>
                      <div className={cn("absolute inset-0 bg-gradient-to-r opacity-60", selectedCategory.gradient)} />
                      <div className={cn("relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", selectedCategory.iconColor)}>
                        {selectedCategory.icon}
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-bold text-foreground text-sm sm:text-base">{selectedCategory.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground/80">{selectedCategory.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-semibold text-muted-foreground/80 uppercase tracking-wider">Listing Type</h4>
                    {modes.map((mode, index) => (
                      <motion.button
                        key={mode.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ scale: 1.02, y: -1 }}
                        onClick={() => handleModeSelect(mode.id)}
                        className={cn(
                          "group w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-left transition-all duration-300",
                          "bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]",
                          "hover:border-white/20 hover:bg-white/[0.07] hover:shadow-xl"
                        )}
                      >
                        <span className="text-3xl sm:text-4xl">{mode.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground text-sm sm:text-base group-hover:text-white transition-colors">
                            {mode.label}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground/80">
                            {mode.description}
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
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
