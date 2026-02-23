/**
 * CLIENT FILTERS PAGE - 4K Premium Vibrant Redesign (Theme-Aware)
 */

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Home, Bike, Briefcase, Check, RotateCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useFilterStore } from '@/state/filterStore';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import type { QuickFilterCategory } from '@/types/filters';

const categories: {
  id: QuickFilterCategory;
  label: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  glow: string;
}[] = [
  {
    id: 'property',
    label: 'Properties',
    description: 'Homes & Rentals',
    icon: <Home className="w-8 h-8" />,
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    glow: 'rgba(59,130,246,0.4)',
  },
  {
    id: 'motorcycle',
    label: 'Motorcycles',
    description: 'Bikes & Scooters',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="5" cy="17" r="3" />
        <circle cx="19" cy="17" r="3" />
        <path d="M9 17h6M19 17l-2-5h-4l-3-4H6l1 4" />
        <path d="M14 7h3l2 5" />
      </svg>
    ),
    gradient: 'linear-gradient(135deg, #7c2d12 0%, #f97316 100%)',
    glow: 'rgba(249,115,22,0.4)',
  },
  {
    id: 'bicycle',
    label: 'Bicycles',
    description: 'Cycles & E-bikes',
    icon: <Bike className="w-8 h-8" />,
    gradient: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)',
    glow: 'rgba(16,185,129,0.4)',
  },
  {
    id: 'services',
    label: 'Services',
    description: 'Workers & Pros',
    icon: <Briefcase className="w-8 h-8" />,
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #a855f7 100%)',
    glow: 'rgba(168,85,247,0.4)',
  },
];

const listingTypes = [
  { id: 'both' as const, label: 'All Types', emoji: '✦' },
  { id: 'rent' as const, label: 'Rent Only', emoji: '🏠' },
  { id: 'sale' as const, label: 'Buy Only', emoji: '🔑' },
];

export default function ClientFilters() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isLight = theme === 'white-matte';

  const urlParams = new URLSearchParams(location.search);
  const aiCategory = urlParams.get('category');
  const aiPriceMin = urlParams.get('priceMin');
  const aiPriceMax = urlParams.get('priceMax');

  const storeCategories = useFilterStore((state) => state.categories);
  const storeListingType = useFilterStore((state) => state.listingType);
  const setCategories = useFilterStore((state) => state.setCategories);
  const setListingType = useFilterStore((state) => state.setListingType);
  const resetClientFilters = useFilterStore((state) => state.resetClientFilters);

  const [selectedCategories, setSelectedCategories] = useState<QuickFilterCategory[]>(
    aiCategory ? [aiCategory as QuickFilterCategory] : storeCategories
  );
  const [selectedListingType, setSelectedListingType] = useState<'rent' | 'sale' | 'both'>(storeListingType);

  const activeFilterCount = selectedCategories.length + (selectedListingType !== 'both' ? 1 : 0);
  const hasChanges = activeFilterCount > 0;

  // Theme-aware color tokens
  const colors = isLight
    ? {
        pageBg: '#f5f5f5',
        headerBg: 'rgba(245,245,245,0.92)',
        headerBorder: 'rgba(0,0,0,0.08)',
        textPrimary: '#1a1a1a',
        textSecondary: 'rgba(0,0,0,0.5)',
        textMuted: 'rgba(0,0,0,0.4)',
        cardBg: 'rgba(0,0,0,0.04)',
        cardBorder: 'rgba(0,0,0,0.1)',
        cardShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
        pillBg: 'rgba(0,0,0,0.05)',
        pillBorder: '1px solid rgba(0,0,0,0.08)',
        pillText: 'rgba(0,0,0,0.55)',
        backBtnBg: 'rgba(0,0,0,0.06)',
        backBtnBorder: '1px solid rgba(0,0,0,0.1)',
        backBtnShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 2px 8px rgba(0,0,0,0.06)',
        backBtnIcon: '#333',
        resetBg: 'rgba(0,0,0,0.05)',
        resetBorder: '1px solid rgba(0,0,0,0.1)',
        resetColor: 'rgba(0,0,0,0.6)',
        resetShadow: 'inset 0 1px 0 rgba(255,255,255,0.6)',
        bottomBg: 'rgba(245,245,245,0.95)',
        bottomBorder: 'rgba(0,0,0,0.08)',
        disabledBtnBg: 'rgba(0,0,0,0.06)',
        disabledBtnBorder: '1px solid rgba(0,0,0,0.08)',
        disabledBtnColor: 'rgba(0,0,0,0.3)',
        iconUnselected: 'rgba(0,0,0,0.35)',
        descUnselected: 'rgba(0,0,0,0.4)',
        labelUnselected: '#1a1a1a',
        chipBg: 'rgba(0,0,0,0.06)',
        chipBorder: '1px solid rgba(0,0,0,0.1)',
        chipText: 'rgba(0,0,0,0.7)',
      }
    : {
        pageBg: '#070709',
        headerBg: 'rgba(7,7,9,0.85)',
        headerBorder: 'rgba(255,255,255,0.06)',
        textPrimary: 'white',
        textSecondary: 'rgba(255,255,255,0.4)',
        textMuted: 'rgba(255,255,255,0.4)',
        cardBg: 'rgba(255,255,255,0.04)',
        cardBorder: 'rgba(255,255,255,0.08)',
        cardShadow: '0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
        pillBg: 'rgba(255,255,255,0.05)',
        pillBorder: '1px solid rgba(255,255,255,0.08)',
        pillText: 'rgba(255,255,255,0.5)',
        backBtnBg: 'rgba(255,255,255,0.08)',
        backBtnBorder: '1px solid rgba(255,255,255,0.12)',
        backBtnShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.4)',
        backBtnIcon: 'white',
        resetBg: 'rgba(255,255,255,0.06)',
        resetBorder: '1px solid rgba(255,255,255,0.1)',
        resetColor: 'rgba(255,255,255,0.6)',
        resetShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        bottomBg: 'rgba(7,7,9,0.92)',
        bottomBorder: 'rgba(255,255,255,0.06)',
        disabledBtnBg: 'rgba(255,255,255,0.06)',
        disabledBtnBorder: '1px solid rgba(255,255,255,0.08)',
        disabledBtnColor: 'rgba(255,255,255,0.3)',
        iconUnselected: 'rgba(255,255,255,0.4)',
        descUnselected: 'rgba(255,255,255,0.35)',
        labelUnselected: 'white',
        chipBg: 'rgba(255,255,255,0.1)',
        chipBorder: '1px solid rgba(255,255,255,0.12)',
        chipText: 'rgba(255,255,255,0.8)',
      };

  const handleCategoryToggle = useCallback((categoryId: QuickFilterCategory) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    );
  }, []);

  const handleApply = useCallback(() => {
    setCategories(selectedCategories);
    setListingType(selectedListingType);
    queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
    navigate(-1);
  }, [selectedCategories, selectedListingType, setCategories, setListingType, queryClient, navigate]);

  const handleReset = useCallback(() => {
    setSelectedCategories([]);
    setSelectedListingType('both');
    resetClientFilters();
  }, [resetClientFilters]);

  return (
    <div className="min-h-full" style={{ background: colors.pageBg }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 backdrop-blur-xl"
        style={{
          background: colors.headerBg,
          borderBottom: `1px solid ${colors.headerBorder}`,
        }}
      >
        <div className="flex items-center justify-between px-4 py-4 pt-12">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-150 active:scale-95 touch-manipulation"
              style={{
                background: colors.backBtnBg,
                border: colors.backBtnBorder,
                boxShadow: colors.backBtnShadow,
              }}
            >
              <ArrowLeft className="w-5 h-5" style={{ color: colors.backBtnIcon }} />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ color: colors.textPrimary }}>Discover Filters</h1>
              <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                {activeFilterCount > 0 ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active` : 'Refine your search'}
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
                background: colors.resetBg,
                border: colors.resetBorder,
                color: colors.resetColor,
                boxShadow: colors.resetShadow,
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
          {/* AI Suggestions Banner */}
          {(aiCategory || aiPriceMin || aiPriceMax) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-3xl"
              style={{
                background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(249,115,22,0.12))',
                border: '1px solid rgba(236,72,153,0.25)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-sm font-semibold text-pink-400">AI Suggested Filters</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {aiCategory && (
                  <span className="px-3 py-1 text-xs rounded-full font-medium"
                    style={{ background: colors.chipBg, border: colors.chipBorder, color: colors.chipText }}>
                    {aiCategory}
                  </span>
                )}
                {(aiPriceMin || aiPriceMax) && (
                  <span className="px-3 py-1 text-xs rounded-full font-medium"
                    style={{ background: colors.chipBg, border: colors.chipBorder, color: colors.chipText }}>
                    ${aiPriceMin || '0'} – ${aiPriceMax || '∞'}
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Categories Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: colors.pillBg,
                  border: colors.pillBorder,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.pillText }}>
                  Categories
                </span>
              </div>
              {selectedCategories.length > 0 && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #ec4899, #f97316)',
                    color: 'white',
                  }}
                >
                  {selectedCategories.length} selected
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category.id);
                return (
                  <motion.button
                    key={category.id}
                    onClick={() => handleCategoryToggle(category.id)}
                    whileTap={{ scale: 0.96 }}
                    className="relative overflow-hidden rounded-3xl text-left transition-all duration-250"
                    style={{
                      height: '120px',
                      background: isSelected ? category.gradient : colors.cardBg,
                      border: isSelected
                        ? `1.5px solid rgba(255,255,255,0.3)`
                        : `1px solid ${colors.cardBorder.replace('1px solid ', '')}`,
                      boxShadow: isSelected
                        ? `0 8px 32px ${category.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
                        : colors.cardShadow,
                    }}
                  >
                    {isSelected && (
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          background: `radial-gradient(circle at 30% 70%, rgba(255,255,255,0.15), transparent 60%)`,
                        }}
                      />
                    )}

                    <div className="relative p-4 flex flex-col justify-between h-full">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                        style={{
                          background: isSelected ? 'rgba(255,255,255,0.2)' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'),
                          color: isSelected ? 'white' : colors.iconUnselected,
                        }}
                      >
                        {category.icon}
                      </div>

                      <div>
                        <p className="text-sm font-bold" style={{ color: isSelected ? 'white' : colors.labelUnselected }}>{category.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: isSelected ? 'rgba(255,255,255,0.7)' : colors.descUnselected }}>
                          {category.description}
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
                          style={{
                            background: 'rgba(255,255,255,0.95)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                          }}
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

          {/* Listing Type Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: colors.pillBg,
                  border: colors.pillBorder,
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: colors.pillText }}>
                  Listing Type
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {listingTypes.map((type) => {
                const isSelected = selectedListingType === type.id;
                return (
                  <motion.button
                    key={type.id}
                    onClick={() => setSelectedListingType(type.id)}
                    whileTap={{ scale: 0.96 }}
                    className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl transition-all duration-200"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #ec4899, #f97316)'
                        : colors.cardBg,
                      border: isSelected
                        ? '1.5px solid rgba(255,255,255,0.25)'
                        : `1px solid ${colors.cardBorder.replace('1px solid ', '')}`,
                      boxShadow: isSelected
                        ? '0 6px 24px rgba(236,72,153,0.35), inset 0 1px 0 rgba(255,255,255,0.2)'
                        : colors.cardShadow,
                    }}
                  >
                    <span className="text-lg">{type.emoji}</span>
                    <span
                      className="text-xs font-bold"
                      style={{ color: isSelected ? 'white' : colors.labelUnselected }}
                    >
                      {type.label}
                    </span>
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
          background: colors.bottomBg,
          borderTop: `1px solid ${colors.bottomBorder}`,
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
              background: colors.disabledBtnBg,
              border: colors.disabledBtnBorder,
              color: colors.disabledBtnColor,
            }}
          >
            {hasChanges ? `Apply ${activeFilterCount} Filter${activeFilterCount > 1 ? 's' : ''}` : 'Select Filters'}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
