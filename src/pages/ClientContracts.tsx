import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { LegalHub } from "@/components/legal/LegalHub";

const ClientContracts = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-background p-4 pb-32 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back nav */}
        <motion.button
          onClick={() => navigate('/client/settings')}
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hub
        </motion.button>

        {/* The Flagship Legal Hub */}
        <LegalHub />
      </div>
    </div>
  );
};

export default ClientContracts;


