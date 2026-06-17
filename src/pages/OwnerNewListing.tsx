import { useNavigate, useSearchParams } from "react-router-dom";
import { Suspense, useEffect, useMemo, useState } from "react";
import { lazyWithRetry } from '@/utils/lazyRetry';
import { useModalStore } from "@/state/modalStore";

const CategorySelectionDialog = lazyWithRetry(() => import('@/components/CategorySelectionDialog').then(m => ({ default: m.CategorySelectionDialog })));
const UnifiedListingForm = lazyWithRetry(() => import('@/components/UnifiedListingForm').then(m => ({ default: m.UnifiedListingForm })));

const OwnerNewListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [initialData, setInitialData] = useState<{
    category: 'property' | 'motorcycle' | 'bicycle' | 'worker';
    mode: 'rent' | 'sale';
    aiDraft?: Record<string, unknown> | null;
  } | null>(null);

  // NOTE: No role-based redirect here. The app allows any authenticated user
  // to switch into owner mode (see useActiveMode → canSwitchMode), so gating
  // this page on the user_roles table kicked legitimate users to the
  // dashboard a few seconds after the role query resolved — including
  // mid-save, which aborted the listing publish.

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const modeParam = searchParams.get('mode');
    const fromAI = searchParams.get('fromAI');
    
    if (categoryParam) {
      const validCategory = ['property', 'motorcycle', 'bicycle', 'worker'].includes(categoryParam) 
        ? categoryParam as 'property' | 'motorcycle' | 'bicycle' | 'worker'
        : 'property';
      const validMode = ['rent', 'sale'].includes(modeParam || '') 
        ? modeParam as 'rent' | 'sale'
        : 'rent';

      let aiDraft: Record<string, unknown> | null = null;
      if (fromAI === '1') {
        try {
          const raw = sessionStorage.getItem('swipess_ai_listing_draft');
          if (raw) {
            const parsed = JSON.parse(raw);
            // 10-minute freshness window
            if (parsed?.data && Date.now() - (parsed.ts || 0) < 10 * 60 * 1000) {
              aiDraft = parsed.data as Record<string, unknown>;
            }
            sessionStorage.removeItem('swipess_ai_listing_draft');
          }
        } catch { /* ignore */ }
      }

      setInitialData({ category: validCategory, mode: validMode, aiDraft });
      setIsFormOpen(true);
      setIsCategorySelectorOpen(false);
    } else {
      setIsCategorySelectorOpen(true);
      setIsFormOpen(false);
    }
  }, [searchParams]);

  const handleCategorySelect = (category: 'property' | 'motorcycle' | 'bicycle' | 'worker', mode: 'rent' | 'sale' | 'both') => {
    setIsCategorySelectorOpen(false);
    setSearchParams({ category, mode: mode === 'both' ? 'rent' : mode });
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    navigate('/owner/properties');
  };
  
  const handleCloseCategorySelector = (open: boolean) => {
    if (!open) {
      setIsCategorySelectorOpen(false);
      navigate('/owner/dashboard');
    }
  };


  const handleAIOpen = () => {
    // Open the global AI Listing modal instead of navigating to a non-existent page
    const { openAIListing } = useModalStore.getState();
    openAIListing();
  };

  const editingProperty = useMemo(() => {
    if (!initialData) return undefined;
    return {
      category: initialData.category,
      mode: initialData.mode,
      ...(initialData.aiDraft || {}),
    };
  }, [initialData]);

  return (
    <>

      <Suspense fallback={null}><CategorySelectionDialog
        open={isCategorySelectorOpen}
        onOpenChange={handleCloseCategorySelector}
        onCategorySelect={handleCategorySelect}
        onAIOpen={handleAIOpen}
      /></Suspense>
      
      <Suspense fallback={null}>
        <UnifiedListingForm
          isOpen={isFormOpen && !!initialData}
          onClose={handleCloseForm}
          editingProperty={editingProperty}
        />
      </Suspense>
    </>
  );
};

export default OwnerNewListing;


