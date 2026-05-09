import { useSearchParams, useNavigate } from "react-router-dom";
import { UnifiedListingForm } from "@/components/UnifiedListingForm";
import { useEffect, useState } from "react";
import { CategorySelectionDialog } from "@/components/CategorySelectionDialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useModalStore } from "@/state/modalStore";

const OwnerNewListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [initialData, setInitialData] = useState<{
    category: 'property' | 'motorcycle' | 'bicycle' | 'worker';
    mode: 'rent' | 'sale';
    aiDraft?: Record<string, unknown> | null;
  } | null>(null);
  const [_aiGeneratedData, _setAIGeneratedData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (userRole && userRole !== 'owner' && userRole !== 'admin') {
      navigate('/owner/dashboard', { replace: true });
    }
  }, [userRole, navigate]);

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

  return (
    <>

      <CategorySelectionDialog
        open={isCategorySelectorOpen}
        onOpenChange={handleCloseCategorySelector}
        onCategorySelect={handleCategorySelect}
        onAIOpen={handleAIOpen}
      />
      
      {initialData && (
        <UnifiedListingForm
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          editingProperty={initialData}
        />
      )}
    </>
  );
};

export default OwnerNewListing;


