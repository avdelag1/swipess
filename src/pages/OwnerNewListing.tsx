import { useSearchParams, useNavigate } from "react-router-dom";
import { UnifiedListingForm } from "@/components/UnifiedListingForm";
import { useEffect, useState } from "react";
import { CategorySelectionDialog } from "@/components/CategorySelectionDialog";
import { Button } from "@/components/ui/button";

const OwnerNewListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [initialData, setInitialData] = useState<{
    category: 'property' | 'motorcycle' | 'bicycle' | 'worker';
    mode: 'rent' | 'sale';
  } | null>(null);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const modeParam = searchParams.get('mode');

    if (categoryParam) {
      const validCategory = ['property', 'motorcycle', 'bicycle', 'worker'].includes(categoryParam)
        ? categoryParam as 'property' | 'motorcycle' | 'bicycle' | 'worker'
        : 'property';
      const validMode = ['rent', 'sale'].includes(modeParam || '')
        ? modeParam as 'rent' | 'sale'
        : 'rent';

      setInitialData({ category: validCategory, mode: validMode });
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

  return (
    <>
      <CategorySelectionDialog
        open={isCategorySelectorOpen}
        onOpenChange={handleCloseCategorySelector}
        onCategorySelect={handleCategorySelect}
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
