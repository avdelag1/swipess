import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { ContractsVault } from "@/components/legal/LegalHub";
import { AmbientPageBackground } from "@/components/ui/AmbientPageBackground";
import { cn } from "@/lib/utils";
import useAppTheme from "@/hooks/useAppTheme";

const ClientContracts = () => {
  const navigate = useNavigate();
  const { isLight } = useAppTheme();

  return (
    <AmbientPageBackground className="w-full min-h-screen pb-32">
      <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        <motion.button
          onClick={() => navigate('/client/dashboard')}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "flex items-center gap-2 text-sm font-black uppercase tracking-widest transition-colors",
            isLight ? "text-black/50 hover:text-black" : "text-white/40 hover:text-white",
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </motion.button>

        <ContractsVault />
      </div>
    </AmbientPageBackground>
  );
};

export default ClientContracts;