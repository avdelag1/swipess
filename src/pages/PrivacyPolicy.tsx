import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, ShieldCheck, Database, Eye, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SentientHud } from "@/components/SentientHud";
import { motion, AnimatePresence } from "framer-motion";
import useAppTheme from "@/hooks/useAppTheme";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { theme, isLight } = useAppTheme();

  return (
    <div className={cn("min-h-screen transition-colors duration-500 overflow-x-hidden", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[5%] left-[-15%] w-[70%] h-[40%] bg-[#EB4898]/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-indigo-500/30 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-48 relative z-10 space-y-12">
        
        {/* 🛸 HEADER */}
        <div className="flex flex-col gap-3">
           <button onClick={() => { triggerHaptic('medium'); navigate(-1); }} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic mb-4 hover:opacity-70 transition-opacity">
              <ArrowLeft className="w-4 h-4" /> BACK
           </button>
           <h1 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Privacy Policy</h1>
           <div className="flex items-center gap-4 mt-2">
              <div className="px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5">
                 <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">Data Privacy Commitment</span>
              </div>
              <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-30 italic", isLight ? "text-black" : "text-white")}>Last Updated: Nov 2025</span>
           </div>
        </div>

        {/* 🛸 DATA STATUS */}
        <div className={cn("p-8 rounded-[2.8rem] border flex items-center justify-between backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.4rem] bg-[#EB4898] flex items-center justify-center shadow-2xl">
                   <Lock className="w-8 h-8 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic">Privacy Protection</p>
                   <h4 className={cn("text-xl font-black italic tracking-tighter uppercase leading-none mt-1", isLight ? "text-black" : "text-white")}>End-to-End Privacy</h4>
                </div>
             </div>
             <div className="bg-indigo-500 px-4 py-2 rounded-full shadow-lg hidden sm:block">
                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Certified Secure</span>
             </div>
        </div>

        {/* 🛸 PRIVACY CONTENT */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={cn("p-12 rounded-[3.5rem] border shadow-3xl backdrop-blur-3xl", isLight ? "bg-black/5 border-black/10" : "bg-white/[0.03] border-white/5")}>
             <div className="space-y-16">
                 {[
                  { id: '01', icon: Database, title: 'Information We Collect', content: 'We collect information you provide directly: Profile details (name, photos, bio), search criteria, messages, property listings, and secure payment data.' },
                  { id: '02', icon: Eye, title: 'How We Use Your Information', content: 'Information is used to optimize the discovery experience, connect property owners with potential clients, process transactions, and maintain platform security.' },
                  { id: '03', icon: Globe, title: 'Data Sharing and Disclosure', content: 'Profile data is visible to other users for matching. We share data with trusted infrastructure partners (Supabase, Google) only as required for service operation.' },
                  { id: '04', icon: ShieldCheck, title: 'Your Rights and Choices', content: 'You maintain absolute control over your personal information. Access, correction, and permanent deletion of account and data are available via Profile Settings.' },
                  { id: '05', icon: Lock, title: 'Security Protocol', content: 'We implement high-standard SSL, OAuth 2.0 encryption, and regular security audits to maintain the total integrity of your information.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                       <span className="text-[10px] font-black text-indigo-500 font-mono tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg">ARTICLE {section.id}</span>
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
                   <h3 className={cn("text-xl font-black uppercase italic tracking-tighter mb-4", isLight ? "text-black" : "text-white")}>GDPR & CCPA Compliance</h3>
                   <p className={cn("text-[13px] font-bold leading-relaxed italic opacity-30", isLight ? "text-black" : "text-white")}>
                      EU and California users maintain specialized rights for data portability and opt-out. For all privacy inquiries, contact our Data Protection Officer at privacy@swipess.com.
                   </p>
                </section>
             </div>
        </motion.div>

        {/* 🛸 ACTION BAR */}
        <div className="flex flex-col items-center pt-10">
            <Button
              onClick={() => { triggerHaptic('medium'); navigate(-1); }}
              className={cn(
                "h-16 px-12 rounded-[2rem] font-black uppercase italic tracking-[0.2em] shadow-2xl active:scale-95 transition-all",
                isLight ? "bg-black text-white" : "bg-white text-black"
              )}
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              RETURN TO DASHBOARD
            </Button>
        </div>
      </div>
      
      <p className="fixed bottom-6 left-10 text-[8px] font-black uppercase tracking-[1em] opacity-10 pointer-events-none z-0">Privacy Protocol v3.0</p>
    </div>
  );
}


