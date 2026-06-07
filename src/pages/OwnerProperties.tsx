/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useEffect, useState } from 'react';
import { PropertyManagement } from "@/components/PropertyManagement";
import { useLocation, useSearchParams } from "react-router-dom";
// import { } from "framer-motion";
import { AtmosphericLayer } from "@/components/AtmosphericLayer";

const OwnerProperties = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [initialCategory, setInitialCategory] = useState<string | null>(null);
  const [initialMode, setInitialMode] = useState<string | null>(null);

  useEffect(() => {
    // Check for category and mode in search params
    const category = searchParams.get('category');
    const mode = searchParams.get('mode');
    if (category) {
      setInitialCategory(category);
      setInitialMode(mode);
    }

    // Check for hash-based navigation (e.g., #add-yacht)
    const hash = location.hash;
    if (hash.startsWith('#add-')) {
      const hashCategory = hash.replace('#add-', '');
      setInitialCategory(hashCategory);
    }
  }, [searchParams, location.hash]);

  return (
    <div className="w-full bg-background pb-32 min-h-screen">
      <AtmosphericLayer variant="primary" />
      <PropertyManagement initialCategory={initialCategory} initialMode={initialMode} />
    </div>
  );
};

export default OwnerProperties;
