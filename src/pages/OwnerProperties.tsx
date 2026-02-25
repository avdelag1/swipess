/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, useEffect } from 'react';
import { PropertyManagement } from "@/components/PropertyManagement";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

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
    <>
      <div className="w-full overflow-x-hidden">
        <motion.button
          onClick={() => navigate(-1)}
          whileTap={{ scale: 0.8, transition: { type: "spring", stiffness: 400, damping: 17 } }}
          className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors duration-150 mb-4 px-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
        <PropertyManagement initialCategory={initialCategory} initialMode={initialMode} />
      </div>
    </>
  );
};

export default OwnerProperties;