/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { AccountSecurity } from "@/components/AccountSecurity";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const OwnerSecurity = () => {
  const navigate = useNavigate();
  return (
    <div className="w-full">
      <motion.button
        onClick={() => navigate(-1)}
        whileTap={{ scale: 0.8, transition: { type: "spring", stiffness: 400, damping: 17 } }}
        className="flex items-center gap-1.5 text-sm font-medium text-white/60 hover:text-white transition-colors duration-150 mb-4 px-1"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </motion.button>
      <div className="p-4 sm:p-6 md:p-8 pb-24 sm:pb-8">
        <div className="max-w-4xl mx-auto">
          <AccountSecurity userRole="owner" />
        </div>
      </div>
    </div>
  );
};

export default OwnerSecurity;