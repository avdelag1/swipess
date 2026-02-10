/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { SavedSearches } from "@/components/SavedSearches";
import { PageHeader } from "@/components/PageHeader";

const ClientSavedSearches = () => {
  return (
    <div className="w-full pb-24">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <PageHeader
            title="Saved Searches"
            subtitle="Your saved search criteria"
          />
          <SavedSearches userRole="client" />
        </div>
      </div>
    </div>
  );
};

export default ClientSavedSearches;
