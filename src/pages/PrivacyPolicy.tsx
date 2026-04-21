import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Database, Eye, Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/utils/haptics";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={cn("min-h-screen transition-colors duration-500 overflow-x-hidden", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[5%] left-[-15%] w-[70%] h-[40%] bg-[#EB4898]/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-indigo-500/30 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-24 pb-48 relative z-10 space-y-12">
        
        {/* 🛸 NEXUS HEADER */}
        <div className="flex flex-col gap-3">
           <button onClick={() => { triggerHaptic('medium'); navigate(-1); }} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic mb-4">
              <ArrowLeft className="w-4 h-4" /> BACK TO IDENTITY
           </button>
           <h1 className={cn("text-5xl font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Privacy Policy</h1>
           <div className="flex items-center gap-4 mt-2">
              <div className="px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5">
                 <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic">Data Sovereignty Protocol</span>
              </div>
              <span className={cn("text-[9px] font-black uppercase tracking-widest opacity-30 italic", isLight ? "text-black" : "text-white")}>Last Sync: Nov 2025</span>
           </div>
        </div>

        {/* 🛡️ DATA STATUS */}
        <div className={cn("p-8 rounded-[2.8rem] border flex items-center justify-between backdrop-blur-3xl", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}>
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-[1.4rem] bg-[#EB4898] flex items-center justify-center shadow-2xl">
                   <Lock className="w-8 h-8 text-white" />
                </div>
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#EB4898] italic">Entity Protection</p>
                   <h4 className={cn("text-xl font-black italic tracking-tighter uppercase leading-none mt-1", isLight ? "text-black" : "text-white")}>End-to-End Encryption</h4>
                </div>
             </div>
             <div className="bg-indigo-500 px-4 py-2 rounded-full shadow-lg">
                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Certified Secure</span>
             </div>
        </div>

        {/* 🛸 DECRYPTED PRIVACY STREAM */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className={cn("p-12 rounded-[3.5rem] border shadow-3xl backdrop-blur-3xl", isLight ? "bg-black/5 border-black/10" : "bg-white/[0.03] border-white/5")}>
             <div className="space-y-16">
                {[
                  { id: '01', icon: Database, title: 'Inbound Data Capture', content: 'We collect identity logs you provide directly: Profile metadata, atmospheric preferences, discovery criteria, and decrypted communications.' },
                  { id: '02', icon: Eye, title: 'Network Influence', content: 'Logs are utilized to optimize the discovery matrix, connect property authorities with compliant clients, and process priority syncs.' },
                  { id: '03', icon: Globe, title: 'Sovereign Synchronization', content: 'Data is shared only with authorized matrix partners (Supabase, Google) and relevant entities for establishing direct matches.' },
                  { id: '04', icon: ShieldCheck, title: 'Entity Rights', content: 'You maintain total sovereignty over your identity logs. Access, correction, and permanent purging are available via the Identity Config.' },
                  { id: '05', icon: Lock, title: 'Encryption Protocol', content: 'We implement high-standard SSL and OAuth 2.0 encryption layers to maintain the total integrity of the matrix.' },
                ].map((section) => (
                  <section key={section.id} className="group">
                    <div className="flex items-center gap-4 mb-6">
                       <span className="text-[10px] font-black text-indigo-500 font-mono tracking-widest bg-indigo-500/10 px-3 py-1 rounded-lg">PROTOCOL {section.id}</span>
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
             </div>
        </motion.div>

        {/* 🛸 ACTION BAR */}
        <div className="flex flex-col items-center pt-10">
            <Button
              onClick={() => { triggerHaptic('medium'); navigate(-1); }}
              className="h-16 px-16 rounded-[2rem] bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase italic tracking-[0.2em] shadow-2xl shadow-indigo-500/20"
            >
               RETURN TO HUB
            </Button>
            <p className={cn("text-[10px] font-black uppercase tracking-[0.4em] italic opacity-20 mt-8", isLight ? "text-black" : "text-white")}> NEXUS DISCOVERY • 2025-2026 </p>
        </div>

      </div>
    </div>
  );
}

