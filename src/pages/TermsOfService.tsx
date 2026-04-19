import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ScrollText, ShieldCheck, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

export default function TermsOfService() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={cn("min-h-screen transition-colors duration-500 overflow-x-hidden", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[5%] left-[-15%] w-[70%] h-[40%] bg-indigo-500/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-[#EB4898]/30 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-48 relative z-10 space-y-12">
        
        {/* 🛸 HEADER */}
        <div className="flex flex-col gap-3">
           <button onClick={() => { triggerHaptic('medium'); navigate(-1); }} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic mb-4">
              <ArrowLeft className="w-4 h-4" /> BACK TO IDENTITY
           </button>
           <h1 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Terms of Service</h1>
           <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="border-[#EB4898]/30 text-[#EB4898] bg-[#EB4898]/5 text-[9px] font-black uppercase tracking-widest italic">Swipess v14.0 Official System</Badge>
              <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-30 italic", isLight ? "text-black" : "text-white")}>Last Sync: Nov 2025</span>
           </div>
        </div>

        {/* 🛡️ STATUS */}
        <div className={cn("p-8 rounded-[2.8rem] border flex items-center justify-between backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.4rem] bg-indigo-500 flex items-center justify-center shadow-2xl">
                   <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 italic">Legal Integrity</p>
                   <h4 className={cn("text-xl font-black italic tracking-tighter uppercase leading-none mt-1", isLight ? "text-black" : "text-white")}>Binding Authorization</h4>
                </div>
             </div>
             <div className="bg-[#EB4898] px-4 py-2 rounded-full shadow-lg">
                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Sync Active</span>
             </div>
        </div>

        {/* 🛸 DECRYPTED TERMS STREAM */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={cn("p-12 rounded-[3.5rem] border shadow-3xl backdrop-blur-3xl", isLight ? "bg-black/5 border-black/10" : "bg-white/[0.03] border-white/5")}>
             <div className="space-y-16">
                {[
                  { id: '01', title: 'Acceptance of Terms', content: 'By using the Swipess app, you agree to be bound by these Legal Terms. Access is denied to non-compliant users.' },
                  { id: '02', title: 'User Eligibility', content: 'Minimum age of 18 years required. You must possess the legal authority to enter binding digital agreements.' },
                  { id: '03', title: 'Account Security', content: 'You are solely responsible for the security of your access credentials. Notify use immediately upon unauthorized access.' },
                  { id: '04', title: 'Prohibited Actions', content: 'Users shall not transmit fraudulent data, harass other users, or bypass platform security. Violations result in immediate account deactivation.' },
                  { id: '05', title: 'Asset Responsibility (Owners)', content: 'Owners must provide accurate asset information and maintain direct authorization for all property listings.' },
                  { id: '06', title: 'User Compliance', content: 'Users must maintain truthful profile data and respect the operational guidelines of the property owners.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                       <span className="text-[10px] font-black text-[#EB4898] font-mono tracking-widest bg-[#EB4898]/10 px-3 py-1 rounded-lg">SECTION {section.id}</span>
                       <div className={cn("h-[1px] flex-1 opacity-10", isLight ? "bg-black" : "bg-white")} />
                    </div>
                    <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter mb-4", isLight ? "text-black" : "text-white")}>{section.title}</h2>
                    <p className={cn("text-[14px] font-bold leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity", isLight ? "text-black" : "text-white")}>
                       {section.content}
                    </p>
                  </section>
                ))}
             </div>
        </motion.div>

        {/* 🛸 ACTION BAR */}
        <div className="flex flex-col items-center pt-10">
            <Button
              onClick={() => { triggerHaptic('medium'); navigate(-1); }}
              className="h-16 px-16 rounded-[2rem] bg-[#EB4898] hover:bg-[#EB4898]/90 text-white font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-[#EB4898]/20"
            >
               RETURN TO HUB
            </Button>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-20 mt-8", isLight ? "text-black" : "text-white")}> Swipess Registry • 2025-2026 </p>
        </div>

      </div>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
  return (
    <div className={cn("px-3 py-1 rounded-full border", className)}>
      {children}
    </div>
  );
}
