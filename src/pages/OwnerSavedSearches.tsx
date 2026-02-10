/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState } from 'react';
import { SavedSearches } from "@/components/SavedSearches";
import { Button } from "@/components/ui/button";
import { Settings, Users, ArrowLeft } from "lucide-react";
import { OwnerClientFilterDialog } from "@/components/OwnerClientFilterDialog";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const OwnerSavedSearches = () => {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const navigate = useNavigate();

  const handleApplyFilter = (filterId: string) => {
    toast({
      title: "Filter Applied",
      description: "Navigating to client discovery with your filter...",
    });
    navigate('/owner/dashboard');
  };

  return (
    <>
      <div className="w-full p-4 sm:p-6 md:p-8 pb-24 sm:pb-8">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.8, transition: { type: "spring", stiffness: 400, damping: 17 } }}
            className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors duration-150 mb-4 px-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Client Filters</h1>
              <p className="text-sm sm:text-base text-white/70 mt-1">Save and manage your ideal client search criteria</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/owner/dashboard')}
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">View Clients</span>
                <span className="sm:hidden">Clients</span>
              </Button>
              <Button
                onClick={() => setShowFilterDialog(true)}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Configure Filters</span>
                <span className="sm:hidden">Configure</span>
              </Button>
            </div>
          </div>

          <SavedSearches userRole="owner" onApplyFilter={handleApplyFilter} />
        </div>
      </div>

      <OwnerClientFilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
      />
    </>
  );
};

export default OwnerSavedSearches;