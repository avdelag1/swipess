import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ContractsVault } from "@/components/legal/LegalHub";

const OwnerContracts = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-background pb-32 overflow-y-auto scrollbar-hide" style={{ height: 'calc(100dvh - var(--top-bar-height, 60px) - var(--safe-top, 0px))' }}>
      <div className="w-full px-6 pt-10 space-y-6">
        {/* Back nav (Owner Hub) */}
        <motion.button
          onClick={() => navigate('/owner/dashboard')}
          whileTap={{ scale: 0.9 }}
          className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Owner Terminal
        </motion.button>

        {/* The Flagship Contracts Vault */}
        <ContractsVault />
      </div>
    </div>
  );
};

export default OwnerContracts;


