import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ 
  title, 
  subtitle, 
  showBack = true, 
  onBack,
  actions,
  className = ""
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-4 mb-6 ${className}`}>
      <div className="flex items-center gap-3">
        {showBack && (
          <motion.button
            onClick={handleBack}
            whileTap={{ scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-white/15 hover:bg-white/25 hover:text-orange-200 transition-all duration-150 active:text-orange-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
