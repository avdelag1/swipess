import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, Globe, Heart, Rocket, X, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SwipessLogo } from '@/components/SwipessLogo';

interface ConciergePrivacyPortalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export function ConciergePrivacyPortal({ isOpen, onAccept, onClose }: ConciergePrivacyPortalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm shadow-2xl"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-sm bg-background border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header / Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/10 via-brand-accent/5 to-transparent pointer-events-none" />
            
            <div className="relative p-7 pb-2 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-primary to-brand-accent flex items-center justify-center mb-5 shadow-lg shadow-brand-primary/20">
                <Brain className="w-8 h-8 text-white" />
              </div>
              
              <SwipessLogo size="sm" variant="gradient" className="mb-2" />
              <h2 className="text-xl font-black tracking-tighter text-foreground leading-tight">
                SENTIENT CONCIERGE
              </h2>
              <p className="text-[13px] font-bold text-muted-foreground/80 mt-1 uppercase tracking-widest italic">
                Your Personal AI Assistant
              </p>
            </div>

            <div className="relative p-7 pt-4 space-y-6">
              <div className="space-y-4">
                <FeatureItem 
                  icon={Sparkles} 
                  title="Personalized Learning" 
                  description="Your assistant learns your preferences to curate the perfect Tulum inventory for you."
                  color="text-amber-400"
                />
                <FeatureItem 
                  icon={Globe} 
                  title="Local Intelligence" 
                  description="Deep knowledge of Quintana Roo real estate, legal requirements, and hidden gems."
                  color="text-brand-primary"
                />
                <FeatureItem 
                  icon={ShieldCheck} 
                  title="Privacy Boundaries" 
                  description="The AI sees your listing/profile info to help you, but NEVER sees passwords or payments."
                  color="text-emerald-400"
                />
              </div>

              <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
                <p className="text-[11px] leading-relaxed text-muted-foreground font-medium text-center mb-3">
                  By continuing, you agree to allow the AI to process your public profile and preferences to provide personalized assistance.
                </p>
                <div className="flex gap-2 items-start bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                  <ShieldCheck className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] leading-tight text-red-200/90 font-medium">
                    <span className="font-bold text-red-400">Strict Security:</span> Our AI is an expert broker and legal companion. Requests for illegal activities or policy violations will be actively blocked and flagged.
                  </p>
                </div>
              </div>

              <Button 
                onClick={onAccept}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-brand-primary to-brand-accent text-white font-black text-base shadow-xl active:scale-95 transition-all"
              >
                I UNDERSTAND & ENTER
              </Button>
              
              <button 
                onClick={onClose}
                className="w-full text-xs font-bold text-muted-foreground/60 hover:text-muted-foreground transition-colors"
              >
                NOT NOW
              </button>
            </div>

            {/* Close touch target */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function FeatureItem({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
  return (
    <div className="flex gap-4 items-start text-left">
      <div className={cn("mt-1 flex-shrink-0 w-8 h-8 rounded-xl bg-muted border border-border/50 flex items-center justify-center", color)}>
        <Icon className="w-4.5 h-4.5" strokeWidth={2.5} />
      </div>
      <div>
        <h3 className="text-sm font-black text-foreground tracking-tight">{title}</h3>
        <p className="text-[12px] text-muted-foreground leading-tight mt-0.5 font-medium">{description}</p>
      </div>
    </div>
  );
}
