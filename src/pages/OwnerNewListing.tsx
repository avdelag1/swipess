import { useNavigate, useSearchParams } from "react-router-dom";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { lazyWithRetry } from '@/utils/lazyRetry';
import { useModalStore } from "@/state/modalStore";
import { CategorySelectionDialog } from "@/components/CategorySelectionDialog";
import { ListingDialogShell } from "@/components/ListingDialogShell";
import { prefetchListingFlowModule } from "@/utils/prefetchListingFlow";

const UnifiedListingForm = lazyWithRetry(() => import('@/components/UnifiedListingForm').then(m => ({ default: m.UnifiedListingForm })));

const OwnerNewListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const hasOpenedCategoryRef = useRef(false);
  const hasOpenedFormRef = useRef(false);
  const [initialData, setInitialData] = useState<{
    category: 'property' | 'motorcycle' | 'bicycle' | 'yacht' | 'worker';
    mode: 'rent' | 'sale';
    aiDraft?: Record<string, unknown> | null;
  } | null>(null);

  useEffect(() => {
    prefetchListingFlowModule();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const modeParam = searchParams.get('mode');
    const fromAI = searchParams.get('fromAI');
    
    if (categoryParam) {
      const validCategory = ['property', 'motorcycle', 'bicycle', 'yacht', 'worker'].includes(categoryParam)
        ? categoryParam as 'property' | 'motorcycle' | 'bicycle' | 'yacht' | 'worker'
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

  if (isCategorySelectorOpen) hasOpenedCategoryRef.current = true;
  if (isFormOpen) hasOpenedFormRef.current = true;

  const handleCategorySelect = (category: 'property' | 'motorcycle' | 'bicycle' | 'yacht' | 'worker', mode: 'rent' | 'sale' | 'both') => {
    requestAnimationFrame(() => setIsCategorySelectorOpen(false));
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
      {(hasOpenedCategoryRef.current || isCategorySelectorOpen) && (
        <CategorySelectionDialog
          open={isCategorySelectorOpen}
          onOpenChange={handleCloseCategorySelector}
          onCategorySelect={handleCategorySelect}
          onAIOpen={handleAIOpen}
        />
      )}
      
      {(hasOpenedFormRef.current || isFormOpen) && (
        <Suspense fallback={isFormOpen ? <ListingDialogShell /> : null}>
          <UnifiedListingForm
            isOpen={isFormOpen && !!initialData}
            onClose={handleCloseForm}
            editingProperty={editingProperty}
          />
        </Suspense>
      )}
    </>
  );
};

export default OwnerNewListing;