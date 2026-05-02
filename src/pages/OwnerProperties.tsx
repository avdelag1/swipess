/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, useEffect } from 'react';
import { PropertyManagement } from "@/components/PropertyManagement";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AtmosphericLayer } from "@/components/AtmosphericLayer";

const OwnerProperties = () => {
  const navigate = useNavigate();
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
      
      <div className="w-full relative bg-background min-h-screen">
        <PropertyManagement initialCategory={initialCategory} initialMode={initialMode} />
      </div>
    </div>
  );
};

export default OwnerProperties;
