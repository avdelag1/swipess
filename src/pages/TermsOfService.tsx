import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Scale, FileText, Gavel, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import useAppTheme from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

export default function TermsOfService() {
  const navigate = useNavigate();
  const { theme, isLight } = useAppTheme();

  return (
    <div className={cn("min-h-screen transition-colors duration-500 overflow-x-hidden", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[5%] left-[-15%] w-[70%] h-[40%] bg-indigo-500/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-[#EB4898]/30 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-48 relative z-10 space-y-12">
        
        {/* 🛸 HEADER */}
        <div className="flex flex-col gap-3">
           <button onClick={() => { triggerHaptic('medium'); navigate(-1); }} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic mb-4 hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-4 h-4" /> BACK
           </button>
           <h1 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Terms of Service</h1>
           <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="border-[#EB4898]/30 text-[#EB4898] bg-[#EB4898]/5 text-[9px] font-black uppercase tracking-widest italic">Official Agreement</Badge>
              <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-30 italic", isLight ? "text-black" : "text-white")}>Last Updated: Nov 2025</span>
           </div>
        </div>

        {/* 🛸 STATUS */}
        <div className={cn("p-8 rounded-[2.8rem] border flex items-center justify-between backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.4rem] bg-indigo-500 flex items-center justify-center shadow-2xl">
                   <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-500 italic">Legal Integrity</p>
                   <h4 className={cn("text-xl font-black italic tracking-tighter uppercase leading-none mt-1", isLight ? "text-black" : "text-white")}>Binding Agreement</h4>
                </div>
             </div>
             <div className="bg-[#EB4898] px-4 py-2 rounded-full shadow-lg hidden sm:block">
                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Active</span>
             </div>
        </div>

        {/* 🛸 TERMS STREAM */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={cn("p-12 rounded-[3.5rem] border shadow-3xl backdrop-blur-3xl", isLight ? "bg-black/5 border-black/10" : "bg-white/[0.03] border-white/5")}>
             <div className="space-y-16">
                 {[
                  { id: '01', icon: Gavel, title: 'Acceptance of Terms', content: 'By accessing or using the Swipess application, you agree to be bound by these Legal Terms and our Privacy Policy. Access is strictly restricted to compliant users.' },
                  { id: '02', icon: UserCheck, title: 'User Eligibility', content: 'You must be at least 18 years of age and possess the full legal capacity to enter into binding digital agreements to utilize our services.' },
                  { id: '03', icon: ShieldCheck, title: 'Account Security', content: 'You are exclusively responsible for the confidentiality and security of your account credentials. You must notify us immediately of any unauthorized access.' },
                  { id: '04', icon: Scale, title: 'Prohibited Actions', content: 'Users shall not post fraudulent information, harass others, or attempt to circumvent platform security. Violations result in immediate permanent account termination.' },
                  { id: '05', icon: FileText, title: 'Property Listings', content: 'Owners must provide certified property details, maintain accurate availability, and comply with all local rental laws and regulations.' },
                  { id: '06', icon: UserCheck, title: 'Client Responsibilities', content: 'Clients must maintain truthful profile data, communicate respectfully with owners, and honor all commitments established through the platform.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                       <span className="text-[10px] font-black text-[#EB4898] font-mono tracking-widest bg-[#EB4898]/10 px-3 py-1 rounded-lg">ARTICLE {section.id}</span>
                       <div className={cn("h-[1px] flex-1 opacity-10", isLight ? "bg-black" : "bg-white")} />
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                       <section.icon className={cn("w-6 h-6", isLight ? "text-black" : "text-white")} />
                       <h2 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{section.title}</h2>
                    </div>
                    <p className={cn("text-[14px] font-bold leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity", isLight ? "text-black" : "text-white")}>
                       {section.content}
                    </p>
                  </section>
                ))}

                <section className="pt-10 border-t border-white/5">
                   <h3 className={cn("text-xl font-black uppercase italic tracking-tighter mb-4", isLight ? "text-black" : "text-white")}>Dispute Resolution</h3>
                   <p className={cn("text-[13px] font-bold leading-relaxed italic opacity-30", isLight ? "text-black" : "text-white")}>
                      All disputes shall be resolved through binding arbitration in accordance with the laws of the presiding jurisdiction. Class action rights are waived upon acceptance of these terms.
                   </p>
                </section>
             </div>
        </motion.div>

        {/* 🛸 ACTION BAR */}
        <div className="flex flex-col items-center pt-10">
            <Button
              onClick={() => { triggerHaptic('medium'); navigate(-1); }}
              className={cn(
                "h-16 px-16 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-2xl active:scale-95 transition-all",
                isLight ? "bg-black text-white" : "bg-[#EB4898] hover:bg-[#EB4898]/90 text-white"
              )}
            >
               RETURN TO DASHBOARD
            </Button>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-20 mt-8", isLight ? "text-black" : "text-white")}> Swipess • 2025-2026 </p>
        </div>
      </div>
      
      <p className="fixed bottom-6 right-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Terms Protocol v3.0</p>
    </div>
  );
}


