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
  popular?: boolean;
}

const categories: Category[] = [
  {
    id: 'property',
    name: 'Property',
    description: 'Apartments, houses, condos, villas',
    icon: <Home className="w-7 h-7" />,
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    iconColor: 'text-emerald-500 bg-emerald-500/10',
    popular: true,
  },
  {
    id: 'motorcycle',
    name: 'Motorcycle',
    description: 'Motorcycles, scooters, ATVs',
    icon: <CircleDot className="w-7 h-7" />,
    gradient: 'from-orange-500/20 via-orange-500/5 to-transparent',
    iconColor: 'text-orange-500 bg-orange-500/10',
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    description: 'Bikes, e-bikes, mountain bikes',
    icon: <Bike className="w-7 h-7" />,
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    iconColor: 'text-purple-500 bg-purple-500/10',
  },
  {
    id: 'worker',
    name: 'Jobs & Services',
    description: 'Chef, cleaner, nanny, handyman, and more',
    icon: <Briefcase className="w-7 h-7" />,
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    iconColor: 'text-amber-500 bg-amber-500/10',
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
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleCategorySelect = (category: Category) => {
    setSelectedCategory(category);
    // Workers/services don't need rent/sale mode - go directly to form
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
    
    // Reset state
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b bg-gradient-to-r from-primary/5 via-background to-background">
          
          {/* AI BUTTON - Prominent at top */}
          <Button
            onClick={handleOpenAI}
            className="w-full mb-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 shadow-lg shadow-purple-500/25"
            size="lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            ✨ Generate Listing with AI
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg sm:text-xl font-bold">
                {step === 'category' ? 'Create New Listing' : `${selectedCategory?.name} Listing`}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
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
                      transition={{ delay: index * 0.04 }}
                      onClick={() => handleCategorySelect(category)}
                      className={cn(
                        "group relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-300",
                        "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]",
                        "bg-gradient-to-br", category.gradient,
                        "border-border/50"
                      )}
                    >
                      {category.popular && (
                        <Badge className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[10px] sm:text-xs px-2 py-0.5">
                          Popular
                        </Badge>
                      )}

                      <div className={cn("p-2.5 sm:p-3 rounded-lg sm:rounded-xl shrink-0", category.iconColor)}>
                        {category.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-base sm:text-lg group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-1">
                          {category.description}
                        </p>
                      </div>

                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all self-center shrink-0" />
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
                      "flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6",
                      "bg-gradient-to-r", selectedCategory.gradient
                    )}>
                      <div className={cn("p-2.5 sm:p-3 rounded-lg sm:rounded-xl", selectedCategory.iconColor)}>
                        {selectedCategory.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">{selectedCategory.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{selectedCategory.description}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2.5 sm:space-y-3">
                    <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Listing Type</h4>
                    {modes.map((mode, index) => (
                      <motion.button
                        key={mode.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.08 }}
                        onClick={() => handleModeSelect(mode.id)}
                        className={cn(
                          "group w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 text-left transition-all duration-300",
                          "hover:border-primary hover:bg-primary/5 hover:shadow-md active:scale-[0.98]",
                          "border-border/50 bg-card"
                        )}
                      >
                        <span className="text-2xl sm:text-3xl">{mode.emoji}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground text-sm sm:text-base group-hover:text-primary transition-colors">
                            {mode.label}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {mode.description}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
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
