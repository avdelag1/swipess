/**
 * OWNER FILTERS PAGE - Colorful design matching client side
 * 
 * Full-screen filter page for owners with gradient headers and colorful selections.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Users, Check, RotateCcw, User, UserCircle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { ClientGender, ClientType } from '@/types/filters';

const genderOptions: { id: ClientGender; label: string; emoji: string; description: string }[] = [
  { 
    id: 'any', 
    label: 'All', 
    emoji: '🌍',
    description: 'Show everyone',
  },
  { 
    id: 'female', 
    label: 'Women', 
    emoji: '👩',
    description: 'Female clients',
  },
  { 
    id: 'male', 
    label: 'Men', 
    emoji: '👨',
    description: 'Male clients',
  },
  { 
    id: 'other', 
    label: 'Other', 
    emoji: '🧑',
    description: 'Non-binary',
  },
];

const clientTypeOptions: { id: ClientType; label: string; emoji: string; description: string }[] = [
  { id: 'all', label: 'All', emoji: '👥', description: 'All types' },
  { id: 'hire', label: 'Hiring', emoji: '💼', description: 'Need services' },
  { id: 'rent', label: 'Rent', emoji: '🏠', description: 'Looking to rent' },
  { id: 'buy', label: 'Buy', emoji: '💰', description: 'Looking to buy' },
  { id: 'individual', label: 'Individual', emoji: '👤', description: 'Single person' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧', description: 'Family' },
  { id: 'business', label: 'Business', emoji: '🏢', description: 'Company' },
];

export default function OwnerFilters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const storeGender = useFilterStore((state) => state.clientGender);
  const storeClientType = useFilterStore((state) => state.clientType);
  const setClientGender = useFilterStore((state) => state.setClientGender);
  const setClientType = useFilterStore((state) => state.setClientType);
  const resetOwnerFilters = useFilterStore((state) => state.resetOwnerFilters);
  
  const [selectedGender, setSelectedGender] = useState<ClientGender>(storeGender);
  const [selectedClientType, setSelectedClientType] = useState<ClientType>(storeClientType);
  
  const activeFilterCount = 
    (selectedGender !== 'any' ? 1 : 0) + 
    (selectedClientType !== 'all' ? 1 : 0);
  
  const hasChanges = activeFilterCount > 0;
  
  const handleApply = useCallback(() => {
    setClientGender(selectedGender);
    setClientType(selectedClientType);
    queryClient.invalidateQueries({ queryKey: ['smart-clients'] });
    queryClient.invalidateQueries({ queryKey: ['owner-interested-clients'] });
    navigate(-1);
  }, [selectedGender, selectedClientType, setClientGender, setClientType, queryClient, navigate]);
  
  const handleReset = useCallback(() => {
    setSelectedGender('any');
    setSelectedClientType('all');
    resetOwnerFilters();
  }, [resetOwnerFilters]);
  
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  return (
    <div className="min-h-full bg-gradient-to-b from-background via-background to-background/95">
      {/* Header with gradient */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-4 pt-12">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full bg-card/50 hover:bg-card/80 border border-border/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Client Filters</h1>
              <p className="text-xs text-muted-foreground">
                {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Customize your search'}
              </p>
            </div>
          </div>

          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/50 hover:bg-card/80"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="px-4 py-6 space-y-8 pb-32">
          {/* Gender Section with gradient header */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-rose-500/20 border border-pink-500/30">
                <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">Gender</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {genderOptions.map((option) => {
                const isSelected = selectedGender === option.id;
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => setSelectedGender(option.id)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border/40 bg-card/40 hover:border-primary/30"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-primary rounded-full p-1"
                      >
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </motion.div>
                    )}
                    <span className="text-2xl">{option.emoji}</span>
                    <span className="text-xs font-semibold text-foreground">{option.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center">{option.description}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Client Type Section with gradient header */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Client Type</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {clientTypeOptions.map((type) => {
                const isSelected = selectedClientType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedClientType(type.id)}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      "relative flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                        : "border-border/40 bg-card/40 hover:border-primary/30"
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-primary rounded-full p-1"
                      >
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </motion.div>
                    )}
                    <span className="text-2xl">{type.emoji}</span>
                    <span className="text-xs font-semibold text-foreground text-center">{type.label}</span>
                    <span className="text-[10px] text-muted-foreground text-center">{type.description}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Bottom Fixed Save Button with gradient */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent border-t border-border/30">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleApply}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200",
              hasChanges
                ? "bg-gradient-to-r from-primary via-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
            disabled={!hasChanges}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {hasChanges ? 'Apply Filters' : 'No filters selected'}
          </Button>
        </div>
      </div>
    </div>
  );
}
