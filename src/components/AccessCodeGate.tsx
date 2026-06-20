/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Eye, EyeOff, Lock, MessageSquare, Send, Sparkles } from 'lucide-react';
import { SwipessLogo } from './SwipessLogo';
import LandingBackgroundEffects from './LandingBackgroundEffects';

import { triggerHaptic } from '@/utils/haptics';
import { getContentValue, useSiteContent } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';

const ACCESS_GRANTED_KEY = 'swipess_access_granted';
const PROMO_UNLOCK_KEY = 'swipess_promo_unlocked';
const DEFAULT_SECRET_CODE = 'URDBEST';

const normalizeCode = (value: string) =>
  value
    .normalize('NFKC')
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase();

function persistAccessGrant() {
  try { localStorage.setItem(ACCESS_GRANTED_KEY, 'true'); } catch { /* empty */ }
  try { localStorage.setItem(PROMO_UNLOCK_KEY, 'true'); } catch { /* empty */ }
  try { sessionStorage.setItem('swipess_promo_session_unlocked', 'true'); } catch { /* empty */ }
}

export function isAccessGranted(): boolean {
  // Native iOS/Android are public app-store builds: App Review (Guideline 2.1)
  // and real users must reach the login screen directly, so the invite-code
  // wall never applies there. The gate stays on web (private beta) only.
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
}

export function AccessCodeGate({ onGranted }: Props) {
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showRequest, setShowRequest] = useState(false);

  const [form, setForm] = useState<RequestForm>({ name: '', email: '', whatsapp: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { data: siteContent } = useSiteContent('swipess_gate');

  const cmsCode = getContentValue(siteContent, 'secret_code');
  const expectedCode = (typeof cmsCode === 'string' && cmsCode.trim()) ? cmsCode.trim() : DEFAULT_SECRET_CODE;
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

    if (normalizeCode(code) !== normalizeCode(expectedCode)) {
      setError('Invalid access code');
      triggerHaptic('error');
      return;
    }

    triggerHaptic('success');
    persistAccessGrant();
    setSuccess(true);
    setTimeout(() => onGranted(), 400);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const { error: dbError } = await supabase
        .from('code_requests' as 'profiles')
        .insert({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          whatsapp: form.whatsapp.trim() || null,
          message: form.message.trim() || null,
        });
      if (dbError) throw dbError;
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

  return (
    <div className="fixed inset-0 bg-black overflow-y-auto overflow-x-hidden">
      {bgImage ? (
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      ) : (
        <div
          aria-hidden
          className="fixed inset-0 pointer-events-none ambient-page-bg ambient-page-bg--dark opacity-80"
        />
      )}
      <LandingBackgroundEffects mode="off" />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,255,255,0.09) 0%, transparent 65%)' }}
      />

      <AnimatePresence mode="sync">
        {!success ? (
          <motion.div
            key="code-entry"
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-[100dvh] px-6 py-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-6 w-full max-w-sm rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 p-8 shadow-2xl"
            >
              <SwipessLogo size="lg" variant="transparent" className="w-[60vw] max-w-[240px]" />

              {gateTitle && (
                <h1 className="text-white text-2xl font-bold text-center tracking-wide">{gateTitle}</h1>
              )}

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
                  <input
                    type={showCode ? 'text' : 'password'}
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(''); }}
                    placeholder="Enter access code"
                    autoFocus
                    autoCapitalize="characters"
                    autoCorrect="off"
                    spellCheck={false}
                    className={`w-full h-14 pl-12 pr-12 rounded-full bg-white/5 border border-white/20 text-white text-sm font-semibold placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/10 transition-colors ${showCode ? 'tracking-wider uppercase' : 'tracking-normal'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCode(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
                    aria-label={showCode ? 'Hide access code' : 'Show access code'}
                  >
                    {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
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
                  className={`w-full h-14 rounded-full font-black uppercase tracking-[0.25em] text-[12px] shadow-[0_8px_28px_rgba(0,0,0,0.45)] hover:brightness-105 active:scale-[0.97] transition-all flex items-center justify-center gap-3 text-white ${btnColor ? '' : 'bg-white/20 border border-white/20'}`}
                >
                  <Sparkles className="w-4 h-4" />
                  {btnText}
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
                    <div className="rounded-2xl border border-white/15 bg-black/40 p-4 space-y-3">
                      <div className="text-center mb-1">
                        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">Request Access</p>
                        <p className="text-[10px] text-white/50 mt-0.5">We&apos;ll send your code within 24 h</p>
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
                            className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40 transition-colors"
                          />
                          <input
                            type="email"
                            value={form.email}
                            onChange={updateForm('email')}
                            placeholder="your@email.com *"
                            required
                            className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40 transition-colors"
                          />
                          <input
                            type="tel"
                            value={form.whatsapp}
                            onChange={updateForm('whatsapp')}
                            placeholder="WhatsApp (optional)"
                            className="w-full h-11 rounded-xl bg-white/5 border border-white/15 px-3.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40 transition-colors"
                          />
                          <textarea
                            value={form.message}
                            onChange={updateForm('message')}
                            placeholder="Tell us more (optional)"
                            rows={2}
                            className="w-full rounded-xl bg-white/5 border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/40 transition-colors resize-none"
                          />
                          {submitError && (
                            <p className="text-xs text-red-400 text-center">{submitError}</p>
                          )}
                          <button
                            type="submit"
                            disabled={submitting || !form.name.trim() || !form.email.trim()}
                            className="w-full min-h-11 py-2.5 rounded-xl bg-white text-black font-bold text-sm grid grid-cols-[18px_1fr] items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-40"
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