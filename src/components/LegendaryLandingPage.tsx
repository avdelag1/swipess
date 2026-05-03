import { memo, useState, useRef, useMemo, useEffect } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import {
  motion, useMotionValue, useTransform, AnimatePresence, PanInfo, animate
} from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import {
  Mail, Lock, User, ArrowLeft, Sparkles, Check, LogIn, X
} from 'lucide-react';
import { SwipessLogo } from './SwipessLogo';
import LandingBackgroundEffects, { type EffectMode } from './LandingBackgroundEffects';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';
import { cn } from '@/lib/utils';

/* ─── Types ─────────────────────────────────────────────── */
type View = 'landing' | 'auth';

/* ─── Brand SVG Icons (Apple HIG–compliant) ──────────────── */
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

/* ─── Landing view ───────────────────────────────────────── */
const LandingView = memo(({
  onEnterAuth,
}: {
  onEnterAuth: (mode: 'login' | 'signup') => void;
}) => {
  const x = useMotionValue(0);
  const logoOpacity = useTransform(x, [0, 100, 220], [1, 0.6, 0]);
  const logoScale = useTransform(x, [0, 120, 220], [1, 0.96, 0.86]);
  const logoBlur = useTransform(x, [0, 100, 220], [0, 2, 14]);
  const logoFilter = useTransform(logoBlur, (v) => `blur(${v}px)`);

  const triggered = useRef(false);

  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldSwipe = info.offset.x > 100 || info.velocity.x > 400;
    if (shouldSwipe) {
      if (triggered.current) return;
      triggered.current = true;
      uiSounds.playStarShoot();
      triggerHaptic('success');
      animate(x, window.innerWidth + 100, { type: 'spring', stiffness: 200, damping: 22, mass: 0.6 });
      setTimeout(() => onEnterAuth('login'), 280);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 32, mass: 0.5 });
    }
  };

  const handleTap = () => {
    if (triggered.current) return;
    triggered.current = true;
    triggerHaptic('light');
    animate(x, window.innerWidth + 100, { type: 'spring', stiffness: 200, damping: 22, mass: 0.6 });
    setTimeout(() => onEnterAuth('login'), 280);
  };

  return (
    <motion.div
      key="landing"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={{ left: 0.05, right: 0.95 }}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        style={{ x, opacity: logoOpacity, scale: logoScale, filter: logoFilter }}
        className="cursor-grab active:cursor-grabbing touch-none select-none relative"
      >
        <div className="relative">
          <SwipessLogo 
            size="3xl" 
            variant="transparent"
            className="w-[65vw] max-w-[280px] sm:max-w-[340px] md:max-w-[420px]" 
          />
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 48%, rgba(255,255,255,0.05) 52%, transparent 70%)',
            }}
            animate={{ x: ['-120%', '180%'] }}
            transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 6 }}
          />
        </div>
      </motion.div>

      {/* ─── Fix #4: Clear CTA buttons ─── */}
      <motion.div
        className="mt-12 flex flex-col items-center gap-3 w-full max-w-[280px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <button
          onClick={() => { triggerHaptic('medium'); onEnterAuth('login'); }}
          className="w-full h-14 rounded-[2rem] bg-[#FF4D00] text-white font-black uppercase tracking-[0.25em] text-[12px] shadow-[0_15px_45px_rgba(255,77,0,0.45)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 border border-white/10"
        >
          <LogIn className="w-4 h-4" />
          Sign In
        </button>
        <button
          onClick={() => { triggerHaptic('medium'); onEnterAuth('signup'); }}
          className="w-full h-14 rounded-[2rem] bg-white text-black font-black uppercase tracking-[0.25em] text-[12px] shadow-[0_12px_36px_rgba(255,255,255,0.18)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 hover:bg-white/95"
        >
          <Sparkles className="w-4 h-4 text-[#FF4D00]" />
          Create Account
        </button>
        <motion.p
          animate={{ opacity: [0.4, 0.85, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mt-2 text-[9px] uppercase tracking-[0.35em] font-bold text-white italic"
        >
          or swipe logo to enter &rarr;
        </motion.p>
      </motion.div>
    </motion.div>
  );
});

/* ─── Fix #2 & #3: Apple-HIG-compliant social auth buttons ── */
const AppleAuthButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-white text-black active:scale-[0.97] transition-all shadow-lg border-none"
  >
    <AppleIcon />
    <span className="text-[14px] font-bold tracking-tight !text-black">
      Sign in with Apple
    </span>
  </button>
);

const GoogleAuthButton = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="group flex h-[52px] w-full items-center justify-center gap-3 rounded-2xl bg-[#141415] border border-white/10 hover:border-white/20 active:scale-[0.97] transition-all shadow-lg"
  >
    <GoogleIcon />
    <span className="text-[14px] font-bold tracking-tight !text-white">
      Continue with Google
    </span>
  </button>
);

/* ─── Auth view ──────────────────────────────────────────── */
const AuthView = memo(({ onBack, initialMode = 'login' }: { onBack: () => void, initialMode?: 'login' | 'signup' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { signIn, signUp, signInWithOAuth } = useAuth();

  useEffect(() => {
    setFieldErrors({});
  }, [isLogin, isForgotPassword]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsLoading(true);
    try {
      const validated = forgotPasswordSchema.parse({ email });
      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: 'https://swipess.app/reset-password',
      });
      if (error) throw error;
      toast({ title: 'Reset Link Sent', description: "Check your inbox for reset instructions." });
      setIsForgotPassword(false);
    } catch (error: any) {
      if (error.errors) {
        const errs: Record<string, string> = {};
        error.errors.forEach((e: any) => { if (e.path?.[0]) errs[e.path[0]] = e.message; });
        setFieldErrors(errs);
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) return handleForgotPassword(e);
    setFieldErrors({});
    setIsLoading(true);
    triggerHaptic('medium');
    try {
      if (isLogin) {
        const errs: Record<string, string> = {};
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
        if (!password.trim()) errs.password = 'Password is required';
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); setIsLoading(false); triggerHaptic('error'); return; }
        const validated = loginSchema.parse({ email, password });
        await signIn(validated.email, validated.password);
      } else {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'Name is required';
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
        if (!password.trim()) errs.password = 'Password is required';
        else if (password.length < 6) errs.password = 'Must be at least 6 characters';
        if (!confirmPassword.trim()) errs.confirmPassword = 'Please confirm your password';
        else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        if (Object.keys(errs).length > 0) { setFieldErrors(errs); setIsLoading(false); triggerHaptic('error'); return; }
        const validated = signupSchema.parse({ name, email, password });
        await signUp(validated.email, validated.password, 'client', validated.name);
      }
    } catch (error: any) {
      if (error.errors) {
        const errs: Record<string, string> = {};
        error.errors.forEach((e: any) => { if (e.path?.[0]) errs[e.path[0]] = e.message; });
        setFieldErrors(errs);
      } else {
        toast({ title: 'Authorization Failed', description: error.message, variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    triggerHaptic('light');
    await signInWithOAuth(provider, 'client');
  };

  const inputCls = (hasError?: boolean) => cn(
    "pl-11 h-[52px] bg-white/[0.06] border-white/10 text-white placeholder:text-white/40 rounded-2xl focus:border-[#FF4D00]/60 transition-all font-semibold text-sm",
    hasError && "border-red-500/70 focus:border-red-500"
  );

  return (
    <motion.div
      key="auth"
      className="absolute inset-0 flex flex-col z-20 overflow-y-auto"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Back button */}
      <button
        onClick={() => { uiSounds.playStarShoot(); triggerHaptic('light'); isForgotPassword ? setIsForgotPassword(false) : onBack(); }}
        className="absolute top-12 left-6 w-11 h-11 rounded-full bg-white/8 flex items-center justify-center text-white/60 active:scale-90 transition-all z-30"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center justify-center min-h-full px-6 py-20 w-full max-w-sm mx-auto">
        {/* Logo */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <SwipessLogo size="md" variant="transparent" />
        </motion.div>

        {/* Mode switcher — two clean separate buttons */}
        {!isForgotPassword && (
          <motion.div
            className="flex gap-2 w-full mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              type="button"
              onClick={() => { uiSounds.playStarShoot(); triggerHaptic('light'); setIsLogin(true); setFieldErrors({}); }}
              className={cn(
                "flex-1 h-12 rounded-[1.6rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.97]",
                isLogin
                  ? "bg-[#FF4D00] text-white shadow-[0_8px_30px_rgba(255,77,0,0.4)]"
                  : "bg-white/8 text-white/50 hover:text-white/80"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { uiSounds.playStarShoot(); triggerHaptic('light'); setIsLogin(false); setFieldErrors({}); }}
              className={cn(
                "flex-1 h-12 rounded-[1.6rem] font-black uppercase tracking-[0.2em] text-[11px] transition-all active:scale-[0.97]",
                !isLogin
                  ? "bg-white text-black shadow-[0_8px_30px_rgba(255,255,255,0.2)]"
                  : "bg-white/8 text-white/50 hover:text-white/80"
              )}
            >
              Sign Up
            </button>
          </motion.div>
        )}

        {isForgotPassword && (
          <motion.div className="w-full mb-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[11px] font-bold tracking-[0.25em] text-white/50 uppercase">Reset Password</p>
          </motion.div>
        )}

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-3 w-full"
          noValidate
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {!isLogin && !isForgotPassword && (
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input value={name} onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }} placeholder="Your Name" autoComplete="name" className={inputCls(!!fieldErrors.name)} />
              </div>
              {fieldErrors.name && <p className="text-red-400 text-[10px] font-semibold mt-1 ml-3">{fieldErrors.name}</p>}
            </div>
          )}

          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }} placeholder="Email" autoComplete="email" className={inputCls(!!fieldErrors.email)} />
            </div>
            {fieldErrors.email && <p className="text-red-400 text-[10px] font-semibold mt-1 ml-3">{fieldErrors.email}</p>}
          </div>

          {!isForgotPassword && (
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }} placeholder="Password" autoComplete={isLogin ? "current-password" : "new-password"} className={inputCls(!!fieldErrors.password)} />
              </div>
              {fieldErrors.password && <p className="text-red-400 text-[10px] font-semibold mt-1 ml-3">{fieldErrors.password}</p>}
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: '' })); }} placeholder="Confirm Password" autoComplete="new-password" className={inputCls(!!fieldErrors.confirmPassword)} />
              </div>
              {fieldErrors.confirmPassword && <p className="text-red-400 text-[10px] font-semibold mt-1 ml-3">{fieldErrors.confirmPassword}</p>}
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div className="flex justify-end px-1 pt-1">
              <button type="button" onClick={() => { triggerHaptic('light'); setIsForgotPassword(true); }} className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-[#FF4D00] transition-colors">
                Forgot Password?
              </button>
            </div>
          )}

          {/* Primary CTA */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-[2rem] bg-[#FF4D00] text-white font-black uppercase tracking-[0.25em] text-[13px] shadow-[0_12px_40px_rgba(255,77,0,0.4)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Sparkles className="w-4 h-4" />
              {isLoading ? 'Please wait...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </motion.form>

        {/* Social auth */}
        {!isForgotPassword && (
          <motion.div
            className="mt-6 space-y-3 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em]">or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <AppleAuthButton onClick={() => handleSocialLogin('apple')} />
            <GoogleAuthButton onClick={() => handleSocialLogin('google')} />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});

/* ─── Root component ─────────────────────────────────────── */
function LegendaryLandingPage() {
  const { navigate } = useAppNavigate();
  const [view, setView] = useState<View>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  return (
    <div className="h-screen h-dvh relative overflow-hidden bg-black text-white">
      {/* 🛸 ATMOSPHERIC BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(235,72,152,0.08)_0%,transparent_70%)]" />
        <LandingBackgroundEffects mode="stars" isLightTheme={false} />
      </div>

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingView key="landing" onEnterAuth={(mode) => { setAuthMode(mode); setView('auth'); }} />
        ) : (
          <AuthView key="auth" onBack={() => setView('landing')} initialMode={authMode} />
        )}
      </AnimatePresence>

      {/* 🛸 LEGAL FOOTER */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-1.5 opacity-70 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-[0.3em] text-white italic">
          <button onClick={() => setLegalModal('privacy')} className="hover:text-[#EB4898] transition-colors">Privacy</button>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <button onClick={() => setLegalModal('terms')} className="hover:text-[#EB4898] transition-colors">Terms</button>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">© 2026 Swipess</p>
      </div>

      {/* 🛸 LEGAL POPUP MODAL */}
      <AnimatePresence>
        {legalModal && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 top-10 z-[100] bg-black/95 backdrop-blur-3xl rounded-t-[2.5rem] border-t border-white/10 flex flex-col pt-10 px-6 pb-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
          >
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />
            
            <div className="flex justify-between items-center mb-6 shrink-0 mt-4">
              <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">
                {legalModal === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <button 
                onClick={() => setLegalModal(null)} 
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                title="Close"
              >
                 <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6 text-white/80 scrollbar-none pb-12">
               {legalModal === 'terms' ? (
                 <div className="space-y-5">
                    <p className="text-sm font-bold leading-relaxed text-white">By initializing the Swipess experience, you agree to be bound by these Legal Protocols. Access is denied to non-compliant entities.</p>
                    <div className="h-px bg-white/10 my-6" />
                    
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EB4898] mb-2">01 — Entity Eligibility</h3>
                    <p className="text-sm opacity-80 leading-relaxed">Minimum age of 18 required. You must possess the legal authority to enter binding digital agreements.</p>
                    
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EB4898] mt-6 mb-2">02 — Identity Security</h3>
                    <p className="text-sm opacity-80 leading-relaxed">You are solely responsible for the encryption integrity of your access credentials. Notify the Registry immediately upon unauthorized sync.</p>
                    
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EB4898] mt-6 mb-2">03 — Prohibited Acts</h3>
                    <p className="text-sm opacity-80 leading-relaxed">Entities shall not transmit fraudulent logs, harass other users, or bypass platform security. Violations result in immediate ban.</p>
                 </div>
               ) : (
                 <div className="space-y-5">
                    <p className="text-sm font-bold leading-relaxed text-white">We value your privacy and security. Swipess uses advanced end-to-end encryption for sensitive data.</p>
                    <div className="h-px bg-white/10 my-6" />
                    
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EB4898] mb-2">01 — Data Collection</h3>
                    <p className="text-sm opacity-80 leading-relaxed">We collect email, authentication tokens, and basic interaction data necessary to operate the matching engine.</p>
                    
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EB4898] mt-6 mb-2">02 — Data Sharing</h3>
                    <p className="text-sm opacity-80 leading-relaxed">Your personal identity is strictly shielded. We do not sell your data to external data brokers.</p>
                    
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#EB4898] mt-6 mb-2">03 — Asset Privacy</h3>
                    <p className="text-sm opacity-80 leading-relaxed">Location and discovery history is kept private and only utilized for matchmaking algorithms.</p>
                 </div>
               )}
            </div>

            <div className="shrink-0 pt-4 flex flex-col gap-3">
               <button 
                 onClick={() => {
                   triggerHaptic('medium');
                   setLegalModal(null);
                 }} 
                 className="w-full h-14 bg-[#EB4898] text-white font-black uppercase italic tracking-widest rounded-2xl shadow-[0_0_30px_rgba(235,72,152,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <Check className="w-5 h-5" /> I Accept & Acknowledge
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(LegendaryLandingPage);