import { FileText, Shield, ChevronRight, BookOpen, Scale, Gavel, Activity } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { LawyerContactModal } from "@/components/LawyerContactModal";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

export default function LegalPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || 'settings';
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [showLawyerModal, setShowLawyerModal] = useState(false);

  const handleBack = () => {
    triggerHaptic('medium');
    if (from === 'dashboard') navigate('/client/dashboard');
    else navigate('/client/settings');
  };

  const legalItems = [
    { icon: Scale, label: 'Protocols & Contracts', description: 'Digital rental agreements & authorization logs', bg: '#06b6d4', action: () => navigate('/client/contracts') },
    { icon: Gavel, label: 'Legal Authority', description: 'Professional legal dispatch assistance', bg: '#8b5cf6', action: () => setShowLawyerModal(true) },
    { icon: FileText, label: 'Terms', description: 'Core service terms & conditions', bg: '#f97316', action: () => navigate('/terms-of-service') },
    { icon: Shield, label: 'Data Integrity', description: 'Privacy policy & data protection protocols', bg: '#EB4898', action: () => navigate('/privacy-policy') },
    { icon: BookOpen, label: 'Entity Conduct (AGL)', description: 'Community standards & behavioral matrix', bg: '#indigo-500', action: () => navigate('/agl') },
  ];

  return (
    <div className={cn("min-h-screen transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[5%] left-[-15%] w-[70%] h-[40%] bg-indigo-500/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-[#EB4898]/30 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-48 relative z-10 space-y-12">
        
        {/* 🛸 HEADER */}
        <div className="space-y-3">
           <PageHeader title="LEGAL MATRIX" showBack={true} onBack={handleBack} />
           <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40 leading-relaxed max-w-sm", isLight ? "text-black" : "text-white")}> Global Legal Standards v14.0 </p>
        </div>

        {/* 🧬 TRUST HUB STATUS */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("p-8 rounded-[2.8rem] border flex items-center justify-between backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.4rem] bg-[#EB4898] flex items-center justify-center shadow-2xl">
                   <Activity className="w-8 h-8 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic">Entity Integrity</p>
                   <h4 className={cn("text-xl font-black italic tracking-tighter uppercase leading-none mt-1", isLight ? "text-black" : "text-white")}>Secure Protocol</h4>
                </div>
             </div>
             <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <span className={cn("text-[9px] font-black uppercase tracking-widest italic", isLight ? "text-black/40" : "text-white/40")}>SSL Active</span>
             </div>
        </motion.div>

        {/* 🛸 LEGAL STREAM */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={fastSpring}
          className={cn(
             "rounded-[3rem] overflow-hidden border shadow-3xl backdrop-blur-3xl",
             isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5"
          )}
        >
          {legalItems.map((item, index) => (
            <div key={item.label}>
              <button
                onClick={() => { triggerHaptic('light'); item.action(); }}
                className="w-full flex items-center gap-6 p-8 hover:bg-white/[0.02] transition-all text-left group"
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl border border-white/10"
                  style={{ backgroundColor: item.bg }}
                >
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className={cn("text-[16px] font-black uppercase italic tracking-tighter group-hover:translate-x-1 transition-transform", isLight ? "text-black" : "text-white")}>{item.label}</div>
                  <div className={cn("text-[10px] font-black uppercase tracking-widest mt-1 opacity-20 leading-relaxed", isLight ? "text-black" : "text-white")}>{item.description}</div>
                </div>
                <ChevronRight className={cn("w-6 h-6 opacity-20", isLight ? "text-black" : "text-white")} />
              </button>
              {index < legalItems.length - 1 && <div className={cn("mx-8 h-[1px]", isLight ? "bg-black/5" : "bg-white/10")} />}
            </div>
          ))}
        </motion.div>

        {/* 🛡️ SECURITY FOOTER */}
        <div className="flex flex-col items-center gap-6 pt-12">
            <Shield className={cn("w-12 h-12 opacity-10", isLight ? "text-black" : "text-white")} />
            <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] italic opacity-20 text-center max-w-xs", isLight ? "text-black" : "text-white")}>
               Transmissions protected by high-standard matrix encryption protocols.
            </p>
        </div>
      </div>

      <LawyerContactModal isOpen={showLawyerModal} onClose={() => setShowLawyerModal(false)} />
    </div>
  );
}
