import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { ChevronDown, MessageCircle, HelpCircle } from "lucide-react";
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
  { question: "How do I list my property?", answer: "Access the Asset Matrix and tap 'Deploy Asset'. Fill in all technical logs including high-fidelity photos, price, and amenities for total synchronization." },
  { question: "How do I find tenants?", answer: "Scan through potential entity profiles. Authorize interest by swiping right. When a mutual sync occurs, a direct transmission channel is opened." },
  { question: "What happens when an entity likes my property?", answer: "You'll receive a high-priority notification. Review their identity logs and either authorize the match or pass to preserve matrix integrity." },
  { question: "What are business transmission credits?", answer: "Establishing direct links requires credit consumption. Professional Owners receive high-energy quotas based on their Nexus Package." },
  { question: "How do I verify my identity?", answer: "Complete the Identity Verification flow in Settings. Professional verification increases your Trust Index and discovery ranking." },
  { question: "How many assets can I deploy?", answer: "The deployment capacity is determined by your current Nexus Package. Elite Owners enjoy unlimited asset deployment." },
];

export default function FAQOwnerPage() {
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
         <div className="absolute top-[5%] left-[-10%] w-[60%] h-[40%] bg-purple-600/30 blur-[130px] rounded-full" />
         <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[40%] bg-rose-500/30 blur-[110px] rounded-full" />
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-24 pb-48 relative z-10 space-y-12">
        <div className="space-y-3">
           <PageHeader title="OWNER HELP MATRIX" showBack={true} backTo="/owner/settings" />
           <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] italic opacity-40 leading-relaxed max-w-sm", isLight ? "text-black" : "text-white")}> Professional Assistance Hub v14.0 </p>
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
                    ? (isLight ? "bg-black/5 border-black/10" : "bg-white/[0.08] border-purple-500/40 shadow-xl shadow-purple-500/10")
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
                    expandedIndex === index && (isLight ? "rotate-180 text-black" : "rotate-180 text-purple-500")
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
            isLight ? "bg-black/5 border-black/5" : "bg-gradient-to-br from-purple-900/40 to-black border-purple-500/20 shadow-purple-600/10"
          )}
        >
          <HelpCircle className="absolute -top-10 -right-10 w-48 h-48 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          
          <div className="relative z-10 flex flex-col items-center">
             <div className="w-20 h-20 bg-purple-600 rounded-[1.8rem] flex items-center justify-center mb-10 shadow-3xl shadow-purple-600/40">
                <MessageCircle className="w-10 h-10 text-white" />
             </div>
             <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter mb-4", isLight ? "text-black" : "text-white")}>Still Need Assistance?</h3>
             <p className={cn("text-[11px] font-black uppercase tracking-[0.25em] mb-10 opacity-40 max-w-[240px] leading-relaxed italic", isLight ? "text-black" : "text-white")}>
               Contact our elite Professional Dispatch for technical asset protection assistance.
             </p>
             <Button
                variant="outline"
                onClick={() => window.location.href = 'mailto:support@swipess.com'}
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
