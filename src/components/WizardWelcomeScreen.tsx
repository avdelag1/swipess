import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { NEXUS_GRADIENTS } from '@/utils/nexusTheme';
import { triggerHaptic } from '@/utils/haptics';

interface WizardWelcomeScreenProps {
  title: string;
  description: string;
  onContinue: () => void;
}

export function WizardWelcomeScreen({ title, description, onContinue }: WizardWelcomeScreenProps) {
  const handleContinue = () => {
    triggerHaptic('medium');
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden rounded-[2rem]"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
      }}
    >
      {/* Dynamic AI Background Gradient */}
      <motion.div 
        className="absolute inset-0 opacity-40"
        style={{ background: NEXUS_GRADIENTS.ai }}
        animate={{ 
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{ duration: 15, ease: "linear", repeat: Infinity }}
      />
      
      {/* Glass Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
          <Sparkles className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
          {title}
        </h2>
        
        <p className="text-white/70 text-[15px] font-medium leading-relaxed max-w-[280px] mb-10">
          {description}
        </p>

        <button
          onClick={handleContinue}
          className="group relative w-full h-14 rounded-2xl bg-white text-black font-black text-lg overflow-hidden active:scale-95 transition-all shadow-[0_8px_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
        >
          Let's Build It
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}
