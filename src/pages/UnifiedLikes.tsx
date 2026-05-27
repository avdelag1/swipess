import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ClientLikedProperties from "./ClientLikedProperties";
import { LikedClients } from "@/components/LikedClients";
import { cn } from "@/lib/utils";
import useAppTheme from "@/hooks/useAppTheme";

const UnifiedLikes = () => {
  const [activeTab, setActiveTab] = useState<"listings" | "people">("listings");
  const { theme } = useAppTheme();
  const isLight = theme === "light";

  return (
    <div className="w-full h-full flex flex-col relative bg-background">
      {/* Tab Switcher - Liquid Glass HUD style */}
      <div className="px-4 sm:px-8 max-w-7xl mx-auto w-full mt-4 sm:mt-8 mb-2 z-10 relative">
        <div className={cn("flex p-1.5 rounded-[2rem] border shadow-sm backdrop-blur-xl", isLight ? "bg-white/80 border-black/5" : "bg-black/80 border-white/10")}>
          <button
            onClick={() => setActiveTab("listings")}
            className={cn(
              "flex-1 py-3.5 text-xs uppercase tracking-widest font-black rounded-full transition-all duration-300",
              activeTab === "listings"
                ? "bg-[var(--color-brand-accent-2)] text-white shadow-lg shadow-[var(--color-brand-accent-2)]/30"
                : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
            )}
          >
            Liked Listings
          </button>
          <button
            onClick={() => setActiveTab("people")}
            className={cn(
              "flex-1 py-3.5 text-xs uppercase tracking-widest font-black rounded-full transition-all duration-300",
              activeTab === "people"
                ? "bg-[var(--color-brand-accent-2)] text-white shadow-lg shadow-[var(--color-brand-accent-2)]/30"
                : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
            )}
          >
            Liked People
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "listings" ? (
            <motion.div
              key="listings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto no-scrollbar"
            >
              <ClientLikedProperties />
            </motion.div>
          ) : (
            <motion.div
              key="people"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto no-scrollbar"
            >
              <LikedClients />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default UnifiedLikes;
