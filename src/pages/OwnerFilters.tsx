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
  { id: 'other', label: 'Non-Binary', description: 'Non-binary clients' },
];

const clientTypeOptions: { id: ClientType; label: string; description: string }[] = [
  { id: 'all', label: 'All Types', description: 'Show all client types' },
  { id: 'hire', label: 'Hiring Services', description: 'Need workers or services' },
  { id: 'rent', label: 'Renting Property', description: 'Looking for rentals' },
  { id: 'buy', label: 'Buying Property', description: 'Looking to purchase' },
  { id: 'individual', label: 'Individual', description: 'Single person looking' },
  { id: 'family', label: 'Family', description: 'Family looking together' },
  { id: 'business', label: 'Business', description: 'Company or business needs' },
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
    <div className="min-h-full flex flex-col pb-40">
      {/* Header */}
      <header className="shrink-0 px-4 pt-[max(env(safe-area-inset-top,12px),12px)] pb-3 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-9 w-9 rounded-full hover:bg-muted/80"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
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
              className="text-foreground hover:text-foreground hover:bg-muted/80 rounded-full font-medium"
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
            <p className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Gender
            </p>
            <div className="grid grid-cols-2 gap-3">
              {genderOptions.map((option) => {
                const isSelected = selectedGender === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedGender(option.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-200 shadow-md border-2",
                      isSelected
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 border-primary"
                        : "bg-card hover:bg-muted/70 hover:border-muted-foreground/30 border-border"
                    )}
                  >
                    <motion.div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mb-2.5 transition-all duration-200 shadow-sm",
                        isSelected ? "bg-primary-foreground/20" : "bg-muted"
                      )}
                      animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                      transition={springTransition}
                    >
                      {isSelected ? (
                        <Check className="w-6 h-6 text-primary-foreground font-bold" />
                      ) : (
                        <Users className="w-6 h-6 text-foreground" />
                      )}
                    </motion.div>
                    <span className={cn(
                      "text-sm font-bold mb-0.5",
                      isSelected ? "text-primary-foreground" : "text-foreground"
                    )}>
                      {option.label}
                    </span>
                    <span className={cn(
                      "text-xs",
                      isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                    )}>
                      {option.description}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Client Type */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Looking For
            </p>
            <div className="space-y-3">
              {clientTypeOptions.map((option) => {
                const isSelected = selectedClientType === option.id;
                return (
                  <motion.button
                    key={option.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedClientType(option.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-200 shadow-md border-2",
                      isSelected
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/30 border-primary"
                        : "bg-card hover:bg-muted/70 hover:border-muted-foreground/30 border-border"
                    )}
                  >
                    <div className="flex items-center gap-3.5">
                      <motion.div
                        className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm",
                          isSelected ? "bg-primary-foreground/20" : "bg-muted"
                        )}
                        animate={isSelected ? { scale: [1, 1.08, 1] } : {}}
                        transition={springTransition}
                      >
                        {isSelected ? (
                          <Check className="w-5 h-5 text-primary-foreground font-bold" />
                        ) : (
                          <Briefcase className="w-5 h-5 text-foreground" />
                        )}
                      </motion.div>
                      <div className="text-left">
                        <span className={cn(
                          "block font-bold text-base",
                          isSelected ? "text-primary-foreground" : "text-foreground"
                        )}>
                          {option.label}
                        </span>
                        <span className={cn(
                          "text-xs",
                          isSelected ? "text-primary-foreground/90" : "text-muted-foreground"
                        )}>
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
                          className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center"
                        >
                          <Check className="w-5 h-5 text-primary-foreground font-bold" />
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
              <div className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-sm">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="font-bold text-primary">
                    {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {activeFilterCount === 0 && (
            <div className="text-center py-10">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <p className="text-base font-medium text-foreground">
                Set filters to find your ideal clients
              </p>
            </div>
          )}

          {/* Bottom spacer */}
          <div className="h-32" />
        </div>
      </div>

      {/* Footer - Apply Button */}
      <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pt-4 pb-3 bg-gradient-to-t from-background via-background/95 to-transparent backdrop-blur-sm">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleApply}
            className="w-full h-14 text-base font-bold rounded-2xl shadow-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/95 text-primary-foreground border-2 border-primary"
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
