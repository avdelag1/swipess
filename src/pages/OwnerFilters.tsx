import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Check, RotateCcw, UserCircle, Baby, Briefcase, ShoppingBag, Building2, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import type { ClientGender, ClientType } from '@/types/filters';

const genderOptions: {
  id: ClientGender;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
}[] = [
    {
      id: 'any',
      label: 'Everyone',
      description: 'All genders',
      icon: <Users className="w-7 h-7" />,
      gradient: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
      glow: 'rgba(51,65,85,0.3)',
    },
    {
      id: 'female',
      label: 'Women',
      description: 'Female clients',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M12 12v8M9 17h6" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #831843 0%, #be185d 100%)',
      glow: 'rgba(190,24,93,0.35)',
    },
    {
      id: 'male',
      label: 'Men',
      description: 'Male clients',
      icon: (
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="10" cy="14" r="4" />
          <path d="M14 10l5-5M14 5h5v5" />
        </svg>
      ),
      gradient: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
      glow: 'rgba(29,78,216,0.35)',
    },
    {
      id: 'other',
      label: 'Non-Binary',
      description: 'All identities',
      icon: <UserCircle className="w-7 h-7" />,
      gradient: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
      glow: 'rgba(109,40,217,0.35)',
    },
  ];

const clientTypeOptions: {
  id: ClientType;
  label: string;
  description: string;
  icon: React.ReactNode;
  accentClass: string;
}[] = [
    { id: 'all', label: 'All Types', description: 'Show everyone', icon: <Users className="w-5 h-5" />, accentClass: 'text-orange-500' },
    { id: 'hire', label: 'Hiring', description: 'Need workers', icon: <Briefcase className="w-5 h-5" />, accentClass: 'text-emerald-500' },
    { id: 'rent', label: 'Renting', description: 'Looking to rent', icon: <ShoppingBag className="w-5 h-5" />, accentClass: 'text-blue-500' },
    { id: 'buy', label: 'Buying', description: 'Looking to buy', icon: <Building2 className="w-5 h-5" />, accentClass: 'text-amber-500' },
    { id: 'individual', label: 'Individual', description: 'Single person', icon: <UserCircle className="w-5 h-5" />, accentClass: 'text-pink-500' },
    { id: 'family', label: 'Family', description: 'Family group', icon: <Baby className="w-5 h-5" />, accentClass: 'text-purple-500' },
    { id: 'business', label: 'Business', description: 'Corporate needs', icon: <Building2 className="w-5 h-5" />, accentClass: 'text-cyan-500' },
  ];

export default function OwnerFilters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme } = useTheme();

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

  return (
    <div className="min-h-full bg-background transition-colors duration-500">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-4 pt-12">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="flex items-center justify-center h-10 w-10 rounded-full bg-secondary border border-border/50 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </motion.button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">Client Filters</h1>
              <p className="text-xs font-medium text-muted-foreground">
                {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'Refine client search'}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/80 border border-border/50 text-sm font-semibold text-foreground/80 shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="px-4 py-6 space-y-8 pb-36">
          {/* Gender Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  Gender
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {genderOptions.map((option) => {
                const isSelected = selectedGender === option.id;
                return (
                  <motion.button
                    key={option.id}
                    onClick={() => setSelectedGender(option.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative overflow-hidden rounded-[2rem] text-left transition-all duration-300",
                      isSelected
                        ? "border-2 border-primary/30 ring-4 ring-primary/5 shadow-lg"
                        : "border border-border/50 bg-card/40 hover:bg-card/60"
                    )}
                    style={{
                      height: '110px',
                      background: isSelected ? option.gradient : undefined,
                    }}
                  >
                    <div className="relative p-4 flex flex-col justify-between h-full">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                        isSelected ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                      )}>
                        {option.icon}
                      </div>
                      <div>
                        <p className={cn("text-sm font-bold", isSelected ? "text-white" : "text-foreground")}>{option.label}</p>
                        <p className={cn("text-[10px] font-medium opacity-70", isSelected ? "text-white" : "text-muted-foreground")}>
                          {option.description}
                        </p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg"
                        >
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* Client Type Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border/50">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  Client Type
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {clientTypeOptions.map((type) => {
                const isSelected = selectedClientType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedClientType(type.id)}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                      isSelected
                        ? "bg-primary/5 border-primary/20 shadow-md shadow-primary/5"
                        : "bg-card/30 border-border/40"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-secondary " + type.accentClass
                    )}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <span className={cn("text-sm font-bold block", isSelected ? "text-primary" : "text-foreground")}>{type.label}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">{type.description}</span>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="w-3.5 h-3.5 text-primary-foreground" />
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

      {/* Bottom Fixed Apply Button - M3 Pill Style */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-background/80 backdrop-blur-xl border-t border-border/40">
        <div className="max-w-md mx-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleApply}
            className={cn(
              "w-full h-14 rounded-full text-base font-bold shadow-xl transition-all duration-300",
              hasChanges
                ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/20"
                : "bg-secondary text-muted-foreground border border-border/50"
            )}
          >
            {hasChanges ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Apply Filters'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
