/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState } from 'react';
import { SavedSearches } from "@/components/SavedSearches";
import { Settings, Users, ArrowLeft } from "lucide-react";
import { OwnerClientFilterDialog } from "@/components/OwnerClientFilterDialog";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from '@/components/ui/sonner';
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const OwnerSavedSearches = () => {
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const handleApplyFilter = (_filterId: string) => {
    toast({
      title: "Filter Applied",
      description: "Navigating to client discovery with your filter...",
    });
    navigate('/owner/dashboard');
  };

  return (
    <>
      <div className="w-full p-4 pt-4 pb-32 bg-background min-h-full">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Back nav */}
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.9, transition: { type: "spring", stiffness: 400, damping: 17 } }}
            className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back
          </motion.button>

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-2 h-2 rounded-full bg-[var(--color-brand-accent-2)] shadow-[0_0_8px_var(--color-brand-accent-2)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Client Filters</span>
              </div>
              <p className="text-sm font-medium text-muted-foreground pl-5">Save and manage your ideal client search criteria</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/owner/dashboard')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold border transition-all active:scale-[0.97]",
                  isLight ? "bg-card border-border/40 text-foreground" : "bg-white/[0.04] border-white/[0.06] text-foreground"
                )}
              >
                <Users className="w-4 h-4" />
                <span>View Clients</span>
              </button>
              <button
                onClick={() => setShowFilterDialog(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-black text-white transition-all active:scale-[0.97] shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
              >
                <Settings className="w-4 h-4" />
                <span>Configure</span>
              </button>
            </div>
          </motion.div>

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


