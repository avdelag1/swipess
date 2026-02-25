import { useSearchParams, useNavigate } from "react-router-dom";
import { UnifiedListingForm } from "@/components/UnifiedListingForm";
import { useEffect, useState } from "react";
import { CategorySelectionDialog } from "@/components/CategorySelectionDialog";
import { AIListingAssistant } from "@/components/AIListingAssistant";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const OwnerNewListing = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [initialData, setInitialData] = useState<{
    category: 'property' | 'motorcycle' | 'bicycle' | 'worker';
    mode: 'rent' | 'sale';
  } | null>(null);
  const [aiGeneratedData, setAIGeneratedData] = useState<any>(null);

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

  const handleAIComplete = (data: any) => {
    // Navigate to the form with AI-generated data
    setSearchParams({ 
      category: data.category, 
      mode: 'rent',
      aiData: JSON.stringify(data.formData)
    });
    setIsAIAssistantOpen(false);
  };

  const handleAIOpen = () => {
    setIsAIAssistantOpen(true);
  };

  return (
    <>
      {/* AI Assistant Dialog */}
      <AIListingAssistant
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onComplete={handleAIComplete}
      />

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
