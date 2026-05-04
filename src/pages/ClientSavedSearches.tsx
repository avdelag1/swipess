/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { SavedSearches } from "@/components/SavedSearches";
import { PageHeader } from "@/components/PageHeader";
import { AtmosphericLayer } from "@/components/AtmosphericLayer";
import { Bookmark } from "lucide-react";
import { motion } from "framer-motion";

const ClientSavedSearches = () => {
  return (
    <div className="w-full pb-24 min-h-screen bg-background relative">
      <AtmosphericLayer variant="primary" />
      <div className="p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-4xl mx-auto space-y-8">
          <PageHeader
            title="Saved Searches"
            subtitle="Your curated discovery filters"
            showBack={true}
            icon={<Bookmark className="w-8 h-8 text-primary" />}
          />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <SavedSearches userRole="client" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ClientSavedSearches;
