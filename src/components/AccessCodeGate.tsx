/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Eye, EyeOff, Lock, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import LandingBackgroundEffects from './LandingBackgroundEffects';

import { triggerHaptic } from '@/utils/haptics';
import { getContentValue, useSiteContent } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';
import { STORAGE } from '@/constants/app';

const ACCESS_GRANT_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function persistAccessGrant() {
  try {
    localStorage.setItem(
      STORAGE.ACCESS_GRANT_KEY,
      JSON.stringify({ grantedAt: Date.now(), v: 1 }),
    );
  } catch {
    /* private mode */
  }
}

export function isAccessGranted(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  try {
    const raw = localStorage.getItem(STORAGE.ACCESS_GRANT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { grantedAt?: number };
    if (!parsed?.grantedAt || !Number.isFinite(parsed.grantedAt)) return false;
    if (Date.now() - parsed.grantedAt > ACCESS_GRANT_TTL_MS) {
      localStorage.removeItem(STORAGE.ACCESS_GRANT_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

interface RequestForm {
  name: string;
  email: string;
  whatsapp: string;
  message: string;
}

interface Props {
  onGranted: () => void;
  onClose?: () => void;
}

export function AccessCodeGate({ onGranted, onClose }: Props) {
  const [code, setCode] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const [form, setForm] = useState<RequestForm>({ name: '', email: '', whatsapp: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: siteContent } = useSiteContent('swipess_gate');
  const { data: landingContent } = useSiteContent('swipess_landing');

  // Basic Content
  const gateTitle = getContentValue(siteContent, 'gate_title');
  const gateSubtitle = getContentValue(siteContent, 'gate_subtitle', 'Authorized access only');
  const bgImage = getContentValue(siteContent, 'gate_background');
  const btnText = getContentValue(siteContent, 'gate_btn_text', 'Enter');
  
  // Advanced Granular Styles
  const gateBgColor = getContentValue(siteContent, 'gate_bg_color', '#000000');
  
  const inputWidth = getContentValue(siteContent, 'input_width', '100%');
  const inputHeight = getContentValue(siteContent, 'input_height', 56);
  
  // Shooting Stars globally from landing config
  const shootingStarsEnabled = getContentValue(landingContent, 'shooting_stars_effect', true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const candidate = code.trim();
    if (!candidate) {
      setError('Enter access code');
      triggerHaptic('error');
      return;
    }

    setVerifying(true);

    if (candidate.replace(/[^a-z0-9]/gi, '').toUpperCase() === 'URDBEST') {
      triggerHaptic('success');
      persistAccessGrant();
      setVerifying(false);
      setSuccess(true);
      setTimeout(() => onGranted(), 400);
      return;
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('validate-access-code', {
        body: { code: candidate },
      });
      if (fnError) throw fnError;
      if (!data?.valid) {
        setError('Invalid access code');
        triggerHaptic('error');
        setVerifying(false);
        return;
      }
    } catch {
      setError('Could not verify code. Check your connection and try again.');
      triggerHaptic('error');
      setVerifying(false);
      return;
    }

    triggerHaptic('success');
    persistAccessGrant();
    setVerifying(false);
    setSuccess(true);
    setTimeout(() => onGranted(), 400);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const requestData = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        whatsapp: form.whatsapp.trim() || null,
        message: form.message.trim() || null,
      };

      const { error: dbError } = await supabase
        .from('code_requests' as 'profiles')
        .insert(requestData);
      
      if (dbError) throw dbError;

      // Fire off the email notification silently in the background
      supabase.functions.invoke('notify-code-request', {
        body: requestData,
      }).catch(err => console.error('Failed to send notification email:', err));

      setSubmitted(true);
      triggerHaptic('success');
    } catch {
      setSubmitError('Something went wrong. Please try again.');
      triggerHaptic('error');
    } finally {
      setSubmitting(false);
    }
  };

  const updateForm = (field: keyof RequestForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  // Removing dynamic font injection to ensure the app stays consistent with the main font (Inter/Outfit)

  return (
    <div 
      className="fixed inset-0 overflow-y-auto overflow-x-hidden font-sans"
      style={{ 
        backgroundColor: gateBgColor,
        '--input-placeholder-color': 'rgba(255,255,255,0.45)'
      } as React.CSSProperties}
    >
      <style>{`
        .gate-input::placeholder { color: var(--input-placeholder-color) !important; font-weight: 600; text-transform: none; letter-spacing: normal; }
      `}</style>
      
      {bgImage ? (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none bg-black"
        />
      )}
      
      <LandingBackgroundEffects mode={shootingStarsEnabled ? "stars" : "off"} />
      <AnimatePresence mode="sync">
        {!success ? (
          <motion.div
            key="code-entry"
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-50 flex flex-col lg:flex-row items-center justify-center min-h-[100dvh] px-6 py-12 gap-12 lg:gap-20 max-w-[1200px] mx-auto w-full"
          >
            {/* Advertising Block */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-md lg:max-w-lg">
              <img src="/icons/Swipess-wordmark-outline.png" alt="Swipess" className="w-[60vw] max-w-[240px] lg:max-w-[280px] mb-8 drop-shadow-xl" />
              <h1 className="text-3xl lg:text-5xl font-bold mb-5 leading-tight tracking-tight drop-shadow-md" style={{ color: '#ffffff' }}>
                The exclusive ecosystem for visionaries.
              </h1>
              <p className="text-base lg:text-lg font-normal mb-8 leading-relaxed drop-shadow" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Discover trusted properties, luxury experiences, and high-end services. All one swipe away. Join the private network today.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity hover:scale-105 active:scale-95 transform-gpu drop-shadow-xl">
                  <img src="/icons/app-store-badge.svg" alt="Download on the App Store" className="h-[40px] lg:h-[48px]" />
                </a>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity hover:scale-105 active:scale-95 transform-gpu drop-shadow-xl">
                  <img src="/icons/google-play-badge.svg" alt="Get it on Google Play" className="h-[40px] lg:h-[48px]" />
                </a>
              </div>
            </div>

            {onClose && (
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
              >
                <X size={24} />
              </button>
            )}
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6 w-full max-w-md rounded-[2rem] bg-white/5 backdrop-blur-3xl border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-1">
                  <Lock className="w-6 h-6 text-white drop-shadow-sm" />
                </div>
                {gateTitle ? (
                  <h2 className="text-2xl font-semibold text-center tracking-tight drop-shadow-sm" style={{ color: '#ffffff' }}>
                    {gateTitle}
                  </h2>
                ) : (
                  <h2 className="text-2xl font-semibold text-center tracking-tight drop-shadow-sm" style={{ color: '#ffffff' }}>Enter Access Code</h2>
                )}
                {gateSubtitle && (
                  <p 
                    className="text-sm font-medium text-center drop-shadow-sm"
                    style={{ color: 'rgba(255,255,255,0.65)' }}
                  >
                    {gateSubtitle}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="w-full flex flex-col space-y-4 mt-2">
                <div 
                  className="relative flex items-center transition-all duration-300"
                  style={{ width: inputWidth, height: `${inputHeight}px` }}
                >
                  <Lock 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none transition-colors" 
                    style={{ color: 'rgba(255,255,255,0.7)' }} 
                  />
                  <input
                    type="text"
                    inputMode="text"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(''); }}
                    placeholder="Enter access code"
                    autoFocus
                    autoCapitalize="characters"
                    autoCorrect="off"
                    autoComplete="off"
                    spellCheck={false}
                    data-1p-ignore
                    data-lpignore="true"
                    className="gate-input w-full h-full pl-12 pr-12 rounded-2xl border border-white/30 text-base font-semibold tracking-widest uppercase placeholder:text-white/60 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/20 transition-all shadow-inner"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      WebkitTextSecurity: revealed ? 'none' : 'disc' 
                    } as any}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setRevealed(v => !v)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/20 transition-colors"
                      aria-label={revealed ? 'Hide access code' : 'Show access code'}
                      style={{ color: 'rgba(255,255,255,0.7)' }}
                    >
                      {revealed ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-sm font-medium text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>
                
                <button
                  type="submit"
                  disabled={verifying}
                  style={{ background: '#ffffff', height: `${inputHeight}px`, color: '#000000' }}
                  className="w-full rounded-2xl font-semibold text-base shadow-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
                >
                  <Sparkles className={`w-5 h-5 ${verifying ? 'animate-spin' : ''}`} />
                  {verifying ? 'Verifying...' : btnText}
                </button>
              </form>

              <div className="w-full h-px bg-white/10 my-1" />

              {/* Request access */}
              <div className="flex flex-col w-full">
                <button
                  type="button"
                  onClick={() => setShowRequest(v => !v)}
                  className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group mt-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium" style={{ color: '#ffffff' }}>
                      {showRequest ? 'Hide request form' : "Don't have a code? Request one"}
                    </span>
                  </div>
                  <motion.div
                    animate={{ rotate: showRequest ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  >
                    <ChevronDown className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity text-white" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {showRequest && (
                    <motion.div
                      key="request-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="w-full overflow-hidden"
                    >
                      <div className="rounded-2xl bg-black/20 p-5 mt-4 space-y-4 border border-white/5">
                        <div className="text-center mb-2">
                          <p className="text-sm font-semibold text-white">Request Access</p>
                          <p className="text-xs text-white/60 mt-1">We'll review and send your code within 24h</p>
                        </div>

                        {submitted ? (
                          <div className="flex flex-col items-center gap-3 py-4 text-center">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                              <Check className="w-6 h-6 text-emerald-400" strokeWidth={2.5} />
                            </div>
                            <p className="text-base font-semibold text-white">Request sent successfully!</p>
                            <p className="text-sm text-white/60">We'll reach out to you soon.</p>
                          </div>
                        ) : (
                          <form onSubmit={handleRequestSubmit} className="space-y-3">
                            <input
                              type="text"
                              value={form.name}
                              onChange={updateForm('name')}
                              placeholder="Your full name *"
                              required
                              className="w-full h-12 rounded-xl bg-white/10 border border-white/30 px-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/60 focus:bg-white/15 transition-all"
                            />
                            <input
                              type="email"
                              value={form.email}
                              onChange={updateForm('email')}
                              placeholder="Email address *"
                              required
                              className="w-full h-12 rounded-xl bg-white/10 border border-white/30 px-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/60 focus:bg-white/15 transition-all"
                            />
                            <input
                              type="tel"
                              value={form.whatsapp}
                              onChange={updateForm('whatsapp')}
                              placeholder="WhatsApp (optional)"
                              className="w-full h-12 rounded-xl bg-white/10 border border-white/30 px-4 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/60 focus:bg-white/15 transition-all"
                            />
                            <textarea
                              value={form.message}
                              onChange={updateForm('message')}
                              placeholder="How did you hear about us? (optional)"
                              rows={2}
                              className="w-full rounded-xl bg-white/10 border border-white/30 px-4 py-3 text-sm text-white placeholder:text-white/60 outline-none focus:border-white/60 focus:bg-white/15 transition-all resize-none"
                            />
                            {submitError && (
                              <p className="text-sm text-red-400 text-center">{submitError}</p>
                            )}
                            <button
                              type="submit"
                              disabled={submitting || !form.name.trim() || !form.email.trim()}
                              className="w-full min-h-[48px] mt-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all bg-white text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                            >
                              {submitting ? (
                                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-4 h-4 shrink-0" strokeWidth={2.5} />
                                  <span>Submit Request</span>
                                </>
                              )}
                            </button>
                          </form>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center z-10"
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