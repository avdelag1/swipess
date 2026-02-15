/**
 * OWNER FILTERS PAGE - Premium glass design
 * 
 * Full-screen filter page for owners to filter client profiles.
 * Clean design with rounded corners and prominent save button.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Users, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { ClientGender, ClientType } from '@/types/filters';

const genderOptions: { id: ClientGender; label: string; description: string; icon: React.ReactNode }[] = [
  { 
    id: 'any', 
    label: 'All Genders', 
    description: 'Show everyone',
    icon: <Users className="w-5 h-5" />
  },
  { 
    id: 'female', 
    label: 'Women', 
    description: 'Female clients only',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      </svg>
    )
  },
  { 
    id: 'male', 
    label: 'Men', 
    description: 'Male clients only',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      </svg>
    )
  },
  { 
    id: 'other', 
    label: 'Non-Binary', 
    description: 'Non-binary clients',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="3" />
        <path d="M8 20v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2" />
      </svg>
    )
  },
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
    <div className="min-h-full bg-[#1C1C1E]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-4 pt-12">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold text-white">Filter Clients</h1>
              <p className="text-xs text-white/50">
                {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Customize your search'}
              </p>
            </div>
          </div>

          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-white/60 hover:text-white text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="px-4 py-6 space-y-8 pb-32">
          {/* Gender Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Gender</h2>
            <div className="space-y-2">
              {genderOptions.map((option) => {
                const isSelected = selectedGender === option.id;
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => setSelectedGender(option.id)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                      isSelected
                        ? "bg-orange-500/10 border-orange-500/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      isSelected ? "bg-orange-500/20 text-orange-400" : "bg-white/10 text-white/60"
                    )}>
                      {option.icon}
                    </div>
                    
                    <div className="flex-1 text-left">
                      <span className="text-sm font-medium text-white block">{option.label}</span>
                      <span className="text-xs text-white/50">{option.description}</span>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Client Type Section */}
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-white/60 uppercase tracking-wider">Client Type</h2>
            <div className="space-y-2">
              {clientTypeOptions.map((type) => {
                const isSelected = selectedClientType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedClientType(type.id)}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                      isSelected
                        ? "bg-orange-500/10 border-orange-500/50"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <div className="text-left">
                      <span className="text-sm font-medium text-white block">{type.label}</span>
                      <span className="text-xs text-white/50">{type.description}</span>
                    </div>
                    
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Bottom Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-white/5">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleApply}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200",
              hasChanges
                ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white shadow-lg shadow-orange-500/25"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            )}
            disabled={!hasChanges}
          >
            {hasChanges ? 'Apply Filters' : 'No filters selected'}
          </Button>
        </div>
      </div>
    </div>
  );
}
