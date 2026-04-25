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
    <div className="w-full relative bg-transparent overflow-y-auto scrollbar-hide" style={{ height: 'calc(100dvh - var(--top-bar-height, 60px) - var(--safe-top, 0px))' }}>
      <AtmosphericLayer variant="primary" />
      
      <div className="w-full relative px-4 sm:px-6 pb-12 z-10">
        <PropertyManagement initialCategory={initialCategory} initialMode={initialMode} />
      </div>
    </div>
  );
};

export default OwnerProperties;


