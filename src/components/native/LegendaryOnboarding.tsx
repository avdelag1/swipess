import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

const SLIDES = [
  {
    title: "Discover Tulum",
    desc: "The elite marketplace for premium villas, exotic vehicles, and secret events.",
    icon: MapPin,
    color: "from-teal-400 to-emerald-500",
    image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Swipe to Match",
    desc: "Find the perfect roommate or client with our AI-powered matching logic.",
    icon: Heart,
    color: "from-rose-400 to-pink-500",
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "Resident Identity",
    desc: "Your digital VAP card proves you belong to the elite Swipess community.",
    icon: ShieldCheck,
    color: "from-blue-400 to-indigo-500",
    image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200"
  },
  {
    title: "AI Concierge",
    desc: "Your personal assistant for finding the best local deals and private parties.",
    icon: Sparkles,
    color: "from-amber-400 to-orange-500",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200"
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

  return (
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <img src={slide.image} className="w-full h-full object-cover opacity-60" alt="" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative flex-1 flex flex-col justify-end p-8 pb-16">
        <AnimatePresence mode="wait">
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
            whileTap={{ scale: 0.9 }}
            onClick={handleNext}
            className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            {index === SLIDES.length - 1 ? (
              <Check className="w-6 h-6" strokeWidth={3} />
            ) : (
              <ArrowRight className="w-6 h-6" strokeWidth={3} />
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
