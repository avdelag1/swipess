/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Eye, EyeOff, Lock, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { SwipessLogo } from './SwipessLogo';
import LandingBackgroundEffects from './LandingBackgroundEffects';

import { triggerHaptic } from '@/utils/haptics';
import { getContentValue, useSiteContent } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';

const ACCESS_GRANTED_KEY = 'swipess_access_granted';
const PROMO_UNLOCK_KEY = 'swipess_promo_unlocked';

function persistAccessGrant() {
  try { localStorage.setItem(ACCESS_GRANTED_KEY, 'true'); } catch { /* empty */ }
  try { localStorage.setItem(PROMO_UNLOCK_KEY, 'true'); } catch { /* empty */ }
  try { sessionStorage.setItem('swipess_promo_session_unlocked', 'true'); } catch { /* empty */ }
}

export function isAccessGranted(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  try {
    if (localStorage.getItem(ACCESS_GRANTED_KEY) === 'true') return true;
    if (localStorage.getItem(PROMO_UNLOCK_KEY) === 'true') return true;
  } catch { /* empty */ }
  return false;
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
  const gateFontFamily = getContentValue(siteContent, 'gate_font_family');
  const gateTitleColor = getContentValue(siteContent, 'gate_title_color', '#ffffff');
  const gateSubtitleColor = getContentValue(siteContent, 'gate_subtitle_color', 'rgba(255,255,255,0.6)');
  const btnColor = getContentValue(siteContent, 'gate_btn_color', '#FFFFFF');
  
  const inputWidth = getContentValue(siteContent, 'input_width', '100%');
  const inputHeight = getContentValue(siteContent, 'input_height', 56);
  const inputBgColor = getContentValue(siteContent, 'input_bg_color', 'rgba(255,255,255,0.05)');
  const inputTextColor = getContentValue(siteContent, 'input_text_color', '#ffffff');
  const inputPlaceholderColor = getContentValue(siteContent, 'input_placeholder_color', 'rgba(255,255,255,0.45)');
  
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

  // Load custom font dynamically if configured
  if (gateFontFamily) {
    const linkId = 'gate-custom-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.href = `https://fonts.googleapis.com/css2?family=${gateFontFamily.replace(/\s+/g, '+')}:wght@300;400;500;600;700;800;900&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }

  return (
    <div 
      className="fixed inset-0 overflow-y-auto overflow-x-hidden"
      style={{ 
        backgroundColor: gateBgColor,
        fontFamily: gateFontFamily ? `"${gateFontFamily}", sans-serif` : undefined,
        '--input-placeholder-color': inputPlaceholderColor
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
          className="fixed inset-0 pointer-events-none ambient-page-bg ambient-page-bg--dark opacity-80"
        />
      )}
      
      <LandingBackgroundEffects mode={shootingStarsEnabled ? "stars" : "off"} />
      
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.09) 0%, transparent 65%)' }}
      />

      <AnimatePresence mode="sync">
        {!success ? (
          <motion.div
            key="code-entry"
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-50 flex flex-col lg:flex-row items-center justify-center min-h-[100dvh] px-6 py-10 gap-12 lg:gap-24 max-w-[1200px] mx-auto w-full"
          >
            {/* Advertising Block */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left text-white max-w-md lg:max-w-lg lg:-mt-10">
              <SwipessLogo size="3xl" variant="transparent" className="w-[70vw] max-w-[280px] lg:max-w-[340px] mb-8 drop-shadow-2xl" />
              <h1 className="text-3xl lg:text-5xl font-black mb-6 leading-tight tracking-tight text-white drop-shadow-md">
                The exclusive ecosystem for visionaries.
              </h1>
              <p className="text-lg text-white/80 font-medium mb-10 leading-relaxed drop-shadow">
                Discover trusted properties, luxury experiences, and high-end services. All one swipe away. Join the private network today.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity hover:scale-105 active:scale-95 transform-gpu drop-shadow-xl">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" alt="Download on the App Store" className="h-[45px] lg:h-[50px]" />
                </a>
                <a href="#" className="opacity-90 hover:opacity-100 transition-opacity hover:scale-105 active:scale-95 transform-gpu drop-shadow-xl">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" className="h-[45px] lg:h-[50px]" />
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
              className="flex flex-col items-center gap-6 w-full max-w-sm rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center gap-2 mb-2 w-full">
                <Lock className="w-8 h-8 text-white/80 mb-1 drop-shadow-md" />
                {gateTitle ? (
                  <h1 className="text-2xl font-bold text-center tracking-wide drop-shadow-md" style={{ color: gateTitleColor }}>
                    {gateTitle}
                  </h1>
                ) : (
                  <h2 className="text-xl font-bold text-white tracking-widest uppercase drop-shadow-md text-center">Enter Access Code</h2>
                )}
              </div>

              <form onSubmit={handleSubmit} className="w-full flex flex-col items-center space-y-4">
                <div 
                  className="relative flex items-center justify-center transition-all duration-300"
                  style={{ width: inputWidth, height: `${inputHeight}px` }}
                >
                  <Lock 
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors" 
                    style={{ color: inputPlaceholderColor }} 
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
                    className="gate-input w-full h-full pl-11 pr-12 rounded-full border border-white/20 text-sm font-bold tracking-[0.2em] uppercase focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/10 transition-colors"
                    style={{ 
                      backgroundColor: inputBgColor,
                      color: inputTextColor,
                      WebkitTextSecurity: revealed ? 'none' : 'disc' 
                    } as any}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => setRevealed(v => !v)}
                      className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                      aria-label={revealed ? 'Hide access code' : 'Show access code'}
                      style={{ color: inputPlaceholderColor }}
                    >
                      {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
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
                  disabled={verifying}
                  style={btnColor ? { background: btnColor, height: `${inputHeight}px`, color: btnColor === '#FFFFFF' ? '#000000' : '#ffffff' } : { height: `${inputHeight}px` }}
                  className={`w-full rounded-full font-black uppercase tracking-[0.25em] text-[12px] shadow-lg hover:opacity-90 active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100 ${btnColor ? '' : 'bg-white text-black'}`}
                >
                  <Sparkles className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
                  {verifying ? 'Verifying…' : btnText}
                </button>
              </form>

              {/* Request access — always visible */}
              <button
                type="button"
                onClick={() => setShowRequest(v => !v)}
                className="w-full min-h-12 py-2.5 px-4 rounded-full border border-white/25 bg-white/8 text-white hover:bg-white/12 active:scale-[0.98] transition-all grid grid-cols-[20px_1fr_20px] items-center gap-2.5"
              >
                <MessageSquare className="w-4 h-4 shrink-0 justify-self-center" />
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] leading-tight text-center">
                  {showRequest ? 'Hide request form' : "Don't have a code? Request one"}
                </span>
                <motion.span
                  animate={{ rotate: showRequest ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="shrink-0 justify-self-center"
                >
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
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
                    <div className="rounded-2xl border border-white/15 bg-black/40 p-4 space-y-3 mt-2">
                      <div className="text-center mb-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Request Access</p>
                        <p className="text-[10px] text-white/65 mt-0.5">We&apos;ll send your code within 24 h</p>
                      </div>

                      {submitted ? (
                        <div className="flex flex-col items-center gap-2 py-3 text-center">
                          <Check className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
                          <p className="text-sm font-semibold text-white">Request sent!</p>
                          <p className="text-xs text-white/50">We&apos;ll reach out to you soon.</p>
                        </div>
                      ) : (
                        <form onSubmit={handleRequestSubmit} className="space-y-3">
                          <input
                            type="text"
                            value={form.name}
                            onChange={updateForm('name')}
                            placeholder="Your name *"
                            required
                            className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3.5 text-sm text-white placeholder:text-white/55 outline-none focus:border-white/40 transition-colors"
                          />
                          <input
                            type="email"
                            value={form.email}
                            onChange={updateForm('email')}
                            placeholder="your@email.com *"
                            required
                            className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3.5 text-sm text-white placeholder:text-white/55 outline-none focus:border-white/40 transition-colors"
                          />
                          <input
                            type="tel"
                            value={form.whatsapp}
                            onChange={updateForm('whatsapp')}
                            placeholder="WhatsApp (optional)"
                            className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3.5 text-sm text-white placeholder:text-white/55 outline-none focus:border-white/40 transition-colors"
                          />
                          <textarea
                            value={form.message}
                            onChange={updateForm('message')}
                            placeholder="Tell us more (optional)"
                            rows={2}
                            className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-white/55 outline-none focus:border-white/40 transition-colors resize-none"
                          />
                          {submitError && (
                            <p className="text-xs text-red-400 text-center">{submitError}</p>
                          )}
                          <button
                            type="submit"
                            disabled={submitting || !form.name.trim() || !form.email.trim()}
                            className="w-full min-h-11 py-2.5 rounded-xl bg-white text-black font-black text-sm grid grid-cols-[18px_1fr] items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-60"
                          >
                            {submitting ? (
                              <div className="col-span-2 mx-auto w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5 shrink-0" />
                                <span className="text-center leading-none">Request Code</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p 
                className="text-[9px] font-black uppercase tracking-[0.35em] italic text-center drop-shadow-md mt-2"
                style={{ color: gateSubtitleColor }}
              >
                {gateSubtitle}
              </p>
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