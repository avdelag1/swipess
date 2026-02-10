import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, MessageCircle, Sparkles, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageActivationBannerProps {
  isVisible: boolean;
  onClose: () => void;
  userRole: 'client' | 'owner' | 'admin';
  variant?: 'conversation-limit' | 'activation-required';
}

export function MessageActivationBanner({
  isVisible,
  onClose,
  userRole,
  variant = 'activation-required',
}: MessageActivationBannerProps) {
  const navigate = useNavigate();

  const handleGetActivations = () => {
    navigate('/subscription-packages');
    onClose();
  };

  const bannerContent = variant === 'conversation-limit'
    ? {
        title: '💬 Message Activation Required',
        description: 'You need a message activation to start a new conversation with this person.',
        ctaText: 'Get Message Activations',
        icon: MessageCircle,
      }
    : {
        title: '✨ Unlock Unlimited Messaging',
        description: 'Get message activations or upgrade to Premium to chat with more people!',
        ctaText: 'View Packages',
        icon: Sparkles,
      };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-50 px-4 pt-4"
        >
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#007AFF]/95 to-[#5856D6]/95 backdrop-blur-xl border border-white/20 shadow-2xl">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

              <div className="relative p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/30 backdrop-blur flex items-center justify-center shadow-lg shadow-white/10">
                    <bannerContent.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-sm" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                      {bannerContent.title}
                    </h3>
                    <p className="text-sm text-white font-medium mb-3 sm:mb-4">
                      {bannerContent.description}
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <Button
                        onClick={handleGetActivations}
                        className="bg-white hover:bg-white/95 text-[#007AFF] font-bold shadow-xl shadow-white/20 transition-all duration-200 active:scale-95"
                        size="sm"
                      >
                        {bannerContent.ctaText}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-white hover:bg-white/10 font-medium"
                        size="sm"
                      >
                        Maybe Later
                      </Button>
                    </div>

                    {/* Premium hint */}
                    <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-white/90">
                        <Crown className="w-3.5 h-3.5 text-amber-300" />
                        <span>Premium plans include monthly message credits + visibility boost!</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white font-medium">
                        <MessageCircle className="w-3.5 h-3.5 text-cyan-300" />
                        <span>💬 Free messaging for motorcycles & bicycles!</span>
                      </div>
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-white/25 hover:bg-white/40 backdrop-blur flex items-center justify-center transition-colors shadow-lg"
                    aria-label="Close banner"
                  >
                    <X className="w-4 h-4 text-white drop-shadow-sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
