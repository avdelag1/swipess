import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Check, X, Sparkles } from 'lucide-react';
import { SwipessLogo } from './SwipessLogo';
import LandingBackgroundEffects from './LandingBackgroundEffects';
import { AtmosphericLayer } from './AtmosphericLayer';
import { triggerHaptic } from '@/utils/haptics';

const ACCESS_CODE_KEY = 'swipess_access_granted';

function getAccessCode(): string {
  try {
    return localStorage.getItem(ACCESS_CODE_KEY) || '';
  } catch { return ''; }
}

function setAccessCode(code: string) {
  try { localStorage.setItem(ACCESS_CODE_KEY, code); } catch {}
}

export function isAccessGranted(): boolean {
  return !!getAccessCode();
}

interface Props {
  onGranted: () => void;
}

export function AccessCodeGate({ onGranted }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Enter access code');
      triggerHaptic('error');
      return;
    }
    // Accept any non-empty code for now — change this to a specific code if desired
    triggerHaptic('success');
    setSuccess(true);
    setAccessCode(code.trim());
    setTimeout(() => onGranted(), 400);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-black">
        <AtmosphericLayer variant="Swipes" opacity={0.15} />
      </div>
      <LandingBackgroundEffects mode="stars" />

      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="code-entry"
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 flex flex-col items-center justify-center px-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-8 w-full max-w-xs"
            >
              <SwipessLogo size="lg" variant="transparent" className="w-[60vw] max-w-[240px]" />

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(''); }}
                    placeholder="Enter access code"
                    autoFocus
                    className="w-full h-14 pl-12 pr-4 rounded-2xl bg-white/5 border border-white/20 text-white text-sm font-bold tracking-wider uppercase placeholder:text-white/30 focus:outline-none focus:border-[#FF4D4D] focus:ring-1 focus:ring-[#FF4D4D]/30 transition-all"
                  />
                </div>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-[10px] font-bold text-center uppercase tracking-wider"
                  >
                    {error}
                  </motion.p>
                )}
                <button
                  type="submit"
                  className="w-full h-14 rounded-[2rem] bg-gradient-to-b from-[#FF4D4D] to-[#E01E2A] text-white font-black uppercase tracking-[0.25em] text-[12px] shadow-[0_15px_45px_rgba(224,30,42,0.55)] hover:brightness-110 active:scale-[0.97] transition-all flex items-center justify-center gap-3 border border-white/15"
                >
                  <Sparkles className="w-4 h-4" />
                  Enter
                </button>
              </form>

              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic text-center">
                Authorized access only
              </p>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5 }}
              className="w-20 h-20 rounded-full bg-[#FF4D4D]/20 border-2 border-[#FF4D4D] flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-[#FF4D4D]" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
