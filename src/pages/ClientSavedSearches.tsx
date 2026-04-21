/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { SavedSearches } from "@/components/SavedSearches";


const ClientSavedSearches = () => {
  return (
    <div className="w-full pb-24 view-enter-premium bg-background min-h-full">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <SavedSearches userRole="client" />
        </div>
      </div>
    </div>
  );
};

export default ClientSavedSearches;


