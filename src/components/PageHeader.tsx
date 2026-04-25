import { useNavigate } from "react-router-dom";
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import useAppTheme from "@/hooks/useAppTheme";
import { SwipessLogo } from "./SwipessLogo";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  backTo?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  backTo,
  actions,
  className = ""
}: PageHeaderProps) {
  const navigate = useNavigate();
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backTo) {
      navigate(backTo);
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
            whileTap={{ scale: 0.9, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
            className="shrink-0 flex items-center justify-center gap-1.5 px-4 h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest italic transition-all duration-300 active:scale-95 backdrop-blur-[40px]"
            style={isLight ? {
              color: '#000000',
              background: 'rgba(255, 255, 255, 0.7)',
              border: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            } : {
              color: 'white',
              background: 'rgba(10, 15, 30, 0.4)',
              border: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
        )}
        <div className="flex flex-col min-w-0">
          <h1 className="text-xl font-black text-foreground tracking-tight leading-none uppercase italic truncate">
             {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
              {subtitle}
            </p>
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

