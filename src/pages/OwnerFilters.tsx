/**
 * OWNER FILTERS PAGE - Premium glass design
 * 
 * Full-screen filter page for owners to filter client profiles.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Users, User, Briefcase, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { ClientGender, ClientType } from '@/types/filters';

const genderOptions: { id: ClientGender; label: string; description: string }[] = [
  { id: 'any', label: 'All Genders', description: 'Show everyone' },
  { id: 'female', label: 'Women', description: 'Female clients' },
  { id: 'male', label: 'Men', description: 'Male clients' },
];

const clientTypeOptions: { id: ClientType; label: string; description: string }[] = [
  { id: 'all', label: 'All Types', description: 'All clients' },
  { id: 'hire', label: 'Hiring Services', description: 'Looking to hire' },
  { id: 'rent', label: 'Renting', description: 'Looking to rent' },
  { id: 'buy', label: 'Buying', description: 'Looking to buy' },
];

const springTransition = { type: 'spring' as const, stiffness: 400, damping: 28 };

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
    <div className="min-h-full flex flex-col pb-24">
      {/* Header */}
      <header className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,12px),12px)] pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="h-9 w-9 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Filters</h1>
              <p className="text-xs text-muted-foreground">
                {activeFilterCount > 0 
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                  : 'Filter client profiles'
                }
              </p>
            </div>
          </div>
          
          {activeFilterCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <X className="w-4 h-4 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
          
          {/* Gender */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Gender
            </p>
            <div className="grid grid-cols-3 gap-2">
              {genderOptions.map((option) => {
                const isSelected = selectedGender === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedGender(option.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3.5 rounded-[var(--radius-md)] border-2 transition-all duration-[var(--duration-fast)]",
                      isSelected
                        ? "border-primary/60 bg-primary/8"
                        : "border-transparent bg-muted/40 hover:bg-muted/60"
                    )}
                  >
                    <motion.div 
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors duration-[var(--duration-fast)]",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      )}
                      animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                      transition={springTransition}
                    >
                      {isSelected ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Users className="w-5 h-5 text-muted-foreground" />
                      )}
                    </motion.div>
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {option.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Client Type */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              Looking For
            </p>
            <div className="space-y-2">
              {clientTypeOptions.map((option) => {
                const isSelected = selectedClientType === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedClientType(option.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-3.5 rounded-[var(--radius-md)] border-2 transition-all duration-[var(--duration-fast)]",
                      isSelected
                        ? "border-primary/60 bg-primary/8"
                        : "border-transparent bg-muted/40 hover:bg-muted/60"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-[var(--duration-fast)]",
                          isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}
                        animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                        transition={springTransition}
                      >
                        {isSelected ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          <Briefcase className="w-5 h-5 text-muted-foreground" />
                        )}
                      </motion.div>
                      <div className="text-left">
                        <span className={cn(
                          "block font-medium text-[15px]",
                          isSelected ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {option.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={springTransition}
                        >
                          <Check className="w-5 h-5 text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springTransition}
            >
              <div className="p-4 rounded-xl bg-primary/5">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {activeFilterCount === 0 && (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-muted/60 flex items-center justify-center">
                <Users className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Set filters to find your ideal clients
              </p>
            </div>
          )}

          {/* Bottom spacer */}
          <div className="h-20" />
        </div>
      </div>

      {/* Footer - Apply Button */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pt-3 pb-2 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleApply}
            className="w-full h-12 text-base font-semibold rounded-[var(--radius-lg)]"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            {activeFilterCount === 0 
              ? 'Show All Clients' 
              : `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}`
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
