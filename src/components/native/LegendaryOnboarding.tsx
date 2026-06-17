import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

const SLIDES = [
  {
    title: "Discover Properties",
    desc: "Find your ideal client. Buyers, tenants. And connect with direct owners.",
    icon: MapPin,
    color: "from-blue-400 to-cyan-500",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Trusted Network",
    desc: "Find the perfect roommate or tenant. Connect with trusted people and rent together.",
    icon: Users,
    color: "from-rose-400 to-pink-500",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "AI Concierge",
    desc: "Your personal assistant for finding the best local deals and private parties.",
    icon: Sparkles,
    color: "from-amber-400 to-orange-500",
    image: "/images/ai_chat_onboarding.png"
  },
  {
    title: "Resident Identity",
    desc: "Your digital VAP card proves you belong to the elite Swipess community.",
    icon: ShieldCheck,
    color: "from-indigo-400 to-violet-500",
    image: "/images/resident_girl_onboarding.png"
  }
];

export const LegendaryOnboarding = ({ onFinish }: { onFinish: () => void }) => {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const handleNext = () => {
    haptics.impact('medium');
    if (index === SLIDES.length - 1) {
      onFinish();
    } else {
      setIndex(i => i + 1);
    }
  };

  const isLast = index === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex flex-col">
      <AnimatePresence mode="sync">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img src={slide.image} className="w-full h-full object-cover opacity-60" alt={slide.title} />
          
          {index === 3 && (
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none mb-32">
               <motion.div 
                 initial={{ y: 20, opacity: 0, rotate: -2 }}
                 animate={{ y: 0, opacity: 1, rotate: 0 }}
                 transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 25 }}
                 className="w-full max-w-[300px] rounded-[2rem] backdrop-blur-xl bg-white/10 border border-white/20 p-6 shadow-2xl relative overflow-hidden"
               >
                 <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
                 <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
                 <div className="relative z-10">
                   <div className="flex justify-between items-start mb-8">
                     <ShieldCheck className="w-8 h-8 text-white/80" />
                     <div className="text-right">
                       <p className="text-white font-black text-lg tracking-widest uppercase">Resident</p>
                       <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Verified</p>
                     </div>
                   </div>
                   <div className="space-y-4">
                     <div>
                       <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-0.5">Origin</p>
                       <p className="text-white font-bold text-xl">New York</p>
                     </div>
                     <div>
                       <p className="text-white/50 text-[10px] font-bold uppercase tracking-wider mb-0.5">Duration</p>
                       <p className="text-white font-medium text-sm">1 Year Lease</p>
                     </div>
                   </div>
                 </div>
               </motion.div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Skip button — top right */}
      {!isLast && (
        <button
          onClick={() => { haptics.tap(); onFinish(); }}
          className="absolute top-14 right-6 z-10 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/70 text-[12px] font-bold uppercase tracking-wider backdrop-blur-sm active:scale-95 transition-all"
        >
          Skip
        </button>
      )}

      <div className="relative flex-1 flex flex-col justify-end p-8 pb-16">
        <AnimatePresence mode="sync">
          <motion.div
            key={index}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-gradient-to-br shadow-2xl", slide.color)}>
              <slide.icon className="w-8 h-8 text-white" />
            </div>

            <div className="space-y-2">
              <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic leading-[0.9]">
                {slide.title}
              </h1>
              <p className="text-lg text-white/60 font-bold leading-tight max-w-[280px]">
                {slide.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="mt-12 flex items-center justify-between">
          <div className="flex gap-2">
            {SLIDES.map((_, i) => (
              <div
                key={i}
                className={cn("h-1.5 rounded-full transition-all duration-500", i === index ? "w-8 bg-white" : "w-2 bg-white/20")}
              />
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className={cn(
              "h-14 rounded-full bg-white flex items-center justify-center text-black font-bold text-[13px] tracking-wide shadow-[0_0_30px_rgba(255,255,255,0.25)] gap-2 px-6",
            )}
          >
            {isLast ? (
              <>
                <Check className="w-5 h-5" strokeWidth={3} />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

const Check = ({ className, strokeWidth }: { className?: string, strokeWidth?: number }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
