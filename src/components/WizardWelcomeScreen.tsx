import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';

interface WizardWelcomeScreenProps {
  title: string;
  description: string;
  onContinue: () => void;
  onSkip?: () => void;
}

export function WizardWelcomeScreen({ title, description, onContinue, onSkip }: WizardWelcomeScreenProps) {
  const handleContinue = () => {
    triggerHaptic('medium');
    onContinue();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden rounded-[2.5rem]"
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)', // Deep blue background
        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
      }}
    >
      {/* Dynamic AI Background Gradient */}
      <motion.div 
        className="absolute inset-0 opacity-60 mix-blend-screen"
        style={{ background: 'radial-gradient(circle at 50% 0%, #3b82f6 0%, transparent 70%)' }}
      />

      {/* Top Right Close Button */}
      {onSkip && (
        <button
          onClick={onSkip}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 text-white/70 hover:bg-black/40 hover:text-white backdrop-blur-md transition-all active:scale-90 z-20"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        <div className="w-24 h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(59,130,246,0.5)] backdrop-blur-md">
          <Sparkles className="w-12 h-12 text-white" />
        </div>

        <h2 className="text-4xl font-black text-white tracking-tight mb-5 drop-shadow-lg">
          {title}
        </h2>
        
        <p className="text-white/90 text-base font-medium leading-relaxed mb-12 drop-shadow-sm px-4">
          {description}
        </p>

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={handleContinue}
            className="group relative w-full h-16 rounded-full bg-white text-black font-black text-lg overflow-hidden active:scale-95 transition-all shadow-[0_8px_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
          >
            Let's Build It
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full h-14 rounded-full bg-black/20 text-white font-bold text-base hover:bg-black/40 backdrop-blur-md transition-all active:scale-95 border border-white/10"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
