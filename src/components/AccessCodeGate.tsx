/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, Sparkles } from 'lucide-react';
import { SwipessLogo } from './SwipessLogo';
import LandingBackgroundEffects from './LandingBackgroundEffects';
import { AtmosphericLayer } from './AtmosphericLayer';
import { triggerHaptic } from '@/utils/haptics';
import { getContentValue, useSiteContent } from '@/hooks/useSiteContent';

const ACCESS_CODE_KEY = 'swipess_access_granted';

function setAccessCode(code: string) {
  try { localStorage.setItem(ACCESS_CODE_KEY, code); } catch { /* empty */ }
}

export function isAccessGranted(): boolean {
  // Always show the gate — never skip it
  return false;
}

interface Props {
  onGranted: () => void;
}

export function AccessCodeGate({ onGranted }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const { data: siteContent } = useSiteContent('swipess_gate');
  
  const expectedCode = getContentValue(siteContent, 'secret_code');
  const gateTitle = getContentValue(siteContent, 'gate_title');
  const gateSubtitle = getContentValue(siteContent, 'gate_subtitle', 'Authorized access only');
  const bgImage = getContentValue(siteContent, 'gate_background');
  const btnColor = getContentValue(siteContent, 'gate_btn_color');
  const btnText = getContentValue(siteContent, 'gate_btn_text', 'Enter');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Enter access code');
      triggerHaptic('error');
      return;
    }
    
    // Check against CMS code if configured
    if (expectedCode && code.trim() !== expectedCode) {
      setError('Invalid access code');
      triggerHaptic('error');
      return;
    }

    triggerHaptic('success');
    setSuccess(true);
    setAccessCode(code.trim());
    setTimeout(() => onGranted(), 400);
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {bgImage ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40" 
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : (
        <div className="absolute inset-0 pointer-events-none bg-black">
          <AtmosphericLayer variant="Swipes" opacity={0.15} />
        </div>
      )}
      <LandingBackgroundEffects mode="off" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.09) 0%, transparent 65%)' }} />

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
              className="flex flex-col items-center gap-8 w-full max-w-xs relative z-10 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-8 shadow-2xl"
            >
              <SwipessLogo size="lg" variant="transparent" className="w-[60vw] max-w-[240px]" />

              {gateTitle && (
                <h1 className="text-white text-2xl font-bold text-center tracking-wide">{gateTitle}</h1>
              )}

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(''); }}
                    placeholder="Enter access code"
                    autoFocus
                    className="w-full h-14 pl-12 pr-4 rounded-full bg-white/5 border border-white/20 text-white text-sm font-bold tracking-wider uppercase placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/10 transition-colors"
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
                  style={btnColor ? { background: btnColor } : undefined}
                  className={`w-full h-14 rounded-full font-black uppercase tracking-[0.25em] text-[12px] shadow-[0_8px_28px_rgba(0,0,0,0.45)] hover:brightness-105 active:scale-[0.97] transition-all flex items-center justify-center gap-3 ${btnColor ? 'text-white' : 'bg-white text-black'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  {btnText}
                </button>
              </form>

              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40 italic text-center drop-shadow-md">
                {gateSubtitle}
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
              className="w-20 h-20 rounded-full bg-white/10 border-2 border-white/50 flex items-center justify-center"
            >
              <Check className="w-8 h-8 text-white" strokeWidth={3} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
