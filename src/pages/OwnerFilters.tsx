/**
 * OWNER FILTERS PAGE - 4K Premium Vibrant Redesign
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Users, Check, RotateCcw, UserCircle, Baby, Briefcase, ShoppingBag, Building2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
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
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
    glow: 'rgba(59,130,246,0.35)',
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
    gradient: 'linear-gradient(135deg, #831843 0%, #ec4899 100%)',
    glow: 'rgba(236,72,153,0.35)',
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
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #60a5fa 100%)',
    glow: 'rgba(96,165,250,0.35)',
  },
  {
    id: 'other',
    label: 'Non-Binary',
    description: 'All identities',
    icon: <UserCircle className="w-7 h-7" />,
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #a855f7 100%)',
    glow: 'rgba(168,85,247,0.35)',
  },
];

const clientTypeOptions: {
  id: ClientType;
  label: string;
  description: string;
  icon: React.ReactNode;
  accentColor: string;
}[] = [
  { id: 'all', label: 'All Types', description: 'Show everyone', icon: <Users className="w-5 h-5" />, accentColor: '#f97316' },
  { id: 'hire', label: 'Hiring', description: 'Need workers', icon: <Briefcase className="w-5 h-5" />, accentColor: '#10b981' },
  { id: 'rent', label: 'Renting', description: 'Looking to rent', icon: <ShoppingBag className="w-5 h-5" />, accentColor: '#3b82f6' },
  { id: 'buy', label: 'Buying', description: 'Looking to buy', icon: <Building2 className="w-5 h-5" />, accentColor: '#f59e0b' },
  { id: 'individual', label: 'Individual', description: 'Single person', icon: <UserCircle className="w-5 h-5" />, accentColor: '#ec4899' },
  { id: 'family', label: 'Family', description: 'Family group', icon: <Baby className="w-5 h-5" />, accentColor: '#a855f7' },
  { id: 'business', label: 'Business', description: 'Corporate needs', icon: <Building2 className="w-5 h-5" />, accentColor: '#06b6d4' },
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

  return (
    <div className="min-h-full" style={{ background: '#070709' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur-xl"
        style={{
          background: 'rgba(7,7,9,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center justify-between px-4 py-4 pt-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-150 active:scale-95 touch-manipulation"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.4)',
              }}
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Client Filters</h1>
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'Refine client search'}
              </p>
            </div>
          </div>

          {hasChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95 touch-manipulation"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.6)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </motion.button>
          )}
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="px-4 py-6 space-y-8 pb-36">
          {/* Gender Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
                    whileTap={{ scale: 0.96 }}
                    className="relative overflow-hidden rounded-3xl text-left transition-all duration-200"
                    style={{
                      height: '110px',
                      background: isSelected ? option.gradient : 'rgba(255,255,255,0.04)',
                      border: isSelected
                        ? '1.5px solid rgba(255,255,255,0.3)'
                        : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: isSelected
                        ? `0 8px 32px ${option.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
                        : '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    {isSelected && (
                      <div
                        className="absolute inset-0 opacity-25"
                        style={{ background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15), transparent 60%)' }}
                      />
                    )}

                    <div className="relative p-4 flex flex-col justify-between h-full">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{
                          background: isSelected ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                          color: isSelected ? 'white' : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {option.icon}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{option.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>
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
                          className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                        >
                          <Check className="w-3.5 h-3.5 text-gray-900" />
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
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 touch-manipulation text-left"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${type.accentColor}18, ${type.accentColor}08)`
                        : 'rgba(255,255,255,0.03)',
                      border: isSelected
                        ? `1px solid ${type.accentColor}50`
                        : '1px solid rgba(255,255,255,0.07)',
                      boxShadow: isSelected
                        ? `0 4px 16px ${type.accentColor}20, inset 0 1px 0 rgba(255,255,255,0.08)`
                        : 'inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isSelected ? `${type.accentColor}25` : 'rgba(255,255,255,0.06)',
                        color: isSelected ? type.accentColor : 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-white block">{type.label}</span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{type.description}</span>
                    </div>
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: type.accentColor, boxShadow: `0 2px 8px ${type.accentColor}50` }}
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

      {/* Bottom Fixed Apply Button */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-xl"
        style={{
          background: 'rgba(7,7,9,0.92)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-md mx-auto">
          <motion.button
            onClick={handleApply}
            whileTap={{ scale: 0.97 }}
            className="w-full h-14 rounded-2xl text-base font-bold text-white transition-all duration-200 touch-manipulation"
            style={hasChanges ? {
              background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
              boxShadow: '0 6px 28px rgba(236,72,153,0.45), inset 0 1px 0 rgba(255,255,255,0.25)',
            } : {
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            {hasChanges ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Select Filters'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
