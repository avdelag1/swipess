import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { ChevronDown, MessageCircle, Sparkles, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";
import { triggerHaptic } from "@/utils/haptics";

const fastSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.8 };

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  { question: "How do I find properties to rent?", answer: "Sync with property listings by swiping. Swipe right to authorize interest, or swipe left to pass. When a mutual sync occurs, a Direct Transmission link opens." },
  { question: "What happens when I authorize interest?", answer: "The property authority is notified. If they verify your profile and sync back, a Match is established, enabling direct messaging." },
  { question: "How do I message property owners?", answer: "Once synced, access the Messaging Dashboard. Decrypted transmissions are available via your active credits." },
  { question: "What are message credits?", answer: "Direct transmissions require energy credits. Standard entities receive a set quota; Premium Operators receive unlimited priority syncs." },
  { question: "How do I upgrade my status?", answer: "Navigate to Settings > Identity Upgrades. Elite status grants priority discovery and expanded transmission capacity." },
  { question: "What is a Super Sync?", answer: "A high-energy signal that highlights your interest, bypassing standard notification filters for immediate owner review." },
];

export default function FAQClientPage() {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    triggerHaptic('light');
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className={cn("min-h-screen transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
      
      {/* 🛸 CINEMATIC ATMOSPHERE */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-[5%] left-[-10%] w-[60%] h-[40%] bg-indigo-500/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-[#EB4898]/30 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-48 relative z-10 space-y-12">
        <div className="space-y-3">
           <PageHeader title="FAQ & KNOWLEDGE" showBack={true} backTo="/client/settings" />
           <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40 leading-relaxed max-w-sm", isLight ? "text-black" : "text-white")}> Client Assistance Hub v14.0 </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={fastSpring}
          className="space-y-4"
        >
          {faqItems.map((item, index) => (
            <div
              key={index}
              className={cn(
                "rounded-[2.2rem] border overflow-hidden transition-all shadow-3xl cursor-pointer group",
                expandedIndex === index 
                    ? (isLight ? "bg-black/5 border-black/10" : "bg-white/[0.08] border-[#EB4898]/40 shadow-xl shadow-[#EB4898]/10")
                    : (isLight ? "bg-black/[0.03] border-black/5 hover:bg-black/[0.05]" : "bg-white/[0.03] border-white/5 hover:bg-white/[0.05]")
              )}
              onClick={() => toggleExpand(index)}
            >
              <div className="flex items-center justify-between p-7">
                <span className={cn("text-[15px] font-black uppercase italic tracking-tighter transition-all group-hover:translate-x-1", isLight ? "text-black" : "text-white")}>{item.question}</span>
                <ChevronDown
                  className={cn(
                    "w-6 h-6 transition-transform duration-500",
                    isLight ? "text-black/30" : "text-white/20",
                    expandedIndex === index && (isLight ? "rotate-180 text-black" : "rotate-180 text-[#EB4898]")
                  )}
                />
              </div>
              <AnimatePresence>
                {expandedIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className={cn(
                        "px-8 pb-8 text-[13px] font-black uppercase tracking-widest mt-2 leading-relaxed italic opacity-40 border-t",
                        isLight ? "text-black border-black/5" : "text-white border-white/5 pt-6"
                    )}>
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration:0.6, delay: 0.2 }}
          className={cn(
            "p-10 rounded-[3.5rem] border shadow-3xl text-center relative overflow-hidden group",
            isLight ? "bg-black/5 border-black/5" : "bg-gradient-to-br from-[#EB4898]/20 to-black border-[#EB4898]/20"
          )}
        >
          <HelpCircle className="absolute -top-10 -right-10 w-48 h-48 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-20 h-20 bg-[#EB4898] rounded-[1.8rem] flex items-center justify-center mb-10 shadow-3xl shadow-[#EB4898]/40">
                <MessageCircle className="w-10 h-10 text-white" />
             </div>
             <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter mb-4", isLight ? "text-black" : "text-white")}>Still Need Assistance?</h3>
             <p className={cn("text-[11px] font-black uppercase tracking-[0.25em] mb-10 opacity-40 max-w-[240px] leading-relaxed italic", isLight ? "text-black" : "text-white")}>
               Contact our elite support team for direct manual assistance.
             </p>
             <Button
                variant="outline"
                onClick={() => window.location.href = 'mailto:support@NEXUS DISCOVERY.com'}
                className="h-16 px-12 rounded-[2rem] bg-white text-black font-black uppercase italic tracking-widest border-none hover:bg-white/90 transition-all shadow-2xl"
             >
                DISPATCH SUPPORT
             </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


