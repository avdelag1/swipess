import { memo, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  animate, AnimatePresence, motion, PanInfo, useMotionValue, useTransform
} from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import {
  ArrowLeft, Check, Eye, EyeOff, Lock, LogIn, Mail, Sparkles, User, X
} from 'lucide-react';
import { SwipessLogo } from './SwipessLogo';

import LandingBackgroundEffects from './LandingBackgroundEffects';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { forgotPasswordSchema, loginSchema, signupSchema } from '@/schemas/auth';
import { cn } from '@/lib/utils';
import { getContentValue, useSiteContent } from '@/hooks/useSiteContent';
import { appToast } from '@/utils/appNotification';
import { Capacitor } from '@capacitor/core';

// On native iOS there is no native Google Sign-In plugin and the web OAuth
// redirect cannot complete inside the WKWebView, so the Google button is hidden
// there (email + native Sign in with Apple remain). Avoids a dead control that
// Apple review flags under Guideline 2.1.
const isNativeIOS = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

type View = 'landing' | 'auth';

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

const inputCls = (error: boolean) => cn(
  "w-full h-14 bg-white/10 border-b-2 pl-12 pr-4 text-white text-[15px] font-medium tracking-wide placeholder:text-white/60 transition-all rounded-xl focus:outline-none focus:bg-white/15",
  error ? "border-red-500 focus:border-red-400" : "border-white/30 focus:border-white/60 hover:border-white/40"
);

const LandingView = memo(({
  onEnterAuth,
  siteContent
}: {
  onEnterAuth: (mode: 'login' | 'signup') => void;
  siteContent?: any;
}) => {
  const btnColor = getContentValue(siteContent, 'landing_hero_btn_color');
  const btnText = getContentValue(siteContent, 'landing_hero_btn_text', 'Create Account');
  const title = getContentValue(siteContent, 'landing_hero_title');
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
        className="cursor-grab active:cursor-grabbing touch-none select-none relative flex items-center justify-center h-[100px] mb-8"
      >
        <img 
          src="/icons/Swipess-brand-logo-transparent.png"
          alt="Swipess"
          className="w-[340px] sm:w-[380px] max-w-none h-auto object-contain drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)] pointer-events-none"
        />
        {title && (
          <h1 className="mt-6 text-white text-3xl font-black tracking-wide drop-shadow-xl absolute top-full">
            {title}
          </h1>
        )}
      </motion.div>

      <motion.div
        className="mt-12 flex flex-col items-center gap-3 w-full max-w-[280px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <button
          onClick={() => { triggerHaptic('medium'); onEnterAuth('login'); }}
          style={{
            backgroundColor: '#ffffff',
            color: '#000000',
            boxShadow: '0 0 0 2px rgba(255,255,255,0.9)',
          }}
          className="w-full h-14 rounded-full font-black text-[16px] tracking-widest uppercase active:scale-[0.97] transition-all flex items-center justify-center gap-2.5"
        >
          <LogIn className="w-[18px] h-[18px]" strokeWidth={2.5} />
          Sign In
        </button>
        <button
          onClick={() => { triggerHaptic('medium'); onEnterAuth('signup'); }}
          style={{
            background: btnColor || '#FF4D00',
            color: '#ffffff',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)',
            boxShadow: '0 0 0 2px rgba(255,77,0,0.8)',
          }}
          className="w-full h-14 rounded-full font-black text-[16px] tracking-widest uppercase active:scale-[0.97] transition-all flex items-center justify-center gap-2.5"
        >
          <Sparkles className="w-[18px] h-[18px]" strokeWidth={2} />
          {btnText}
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

const AuthView = memo(({ onBack, initialMode = 'login', siteContent }: { onBack: () => void, initialMode?: 'login' | 'signup', siteContent?: any }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [agreed18, setAgreed18] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const [shakeTrigger, setShakeTrigger] = useState(0);
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    setFieldErrors({});
    setShowPassword(false);
  }, [isLogin, isForgotPassword]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setIsLoading(true);
    try {
      const validated = forgotPasswordSchema.parse({ email });
      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      appToast.info('Reset Link Sent');
      setIsForgotPassword(false);
    } catch (error: any) {
      setShakeTrigger(prev => prev + 1);
      triggerHaptic('error');
      if (error.errors) {
        const errs: Record<string, string> = {};
        error.errors.forEach((e: any) => { if (e.path?.[0]) errs[e.path[0]] = e.message; });
        setFieldErrors(errs);
      } else {
        appToast.info('Error');
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

        if (Object.keys(errs).length > 0) {
          setFieldErrors(errs);
          setIsLoading(false);
          triggerHaptic('error');
          setShakeTrigger(prev => prev + 1);
          return;
        }

        const validated = loginSchema.parse({ email, password });
        await signIn(validated.email, validated.password);
      } else {
        const errs: Record<string, string> = {};
        if (!name.trim()) errs.name = 'Name is required';
        if (!email.trim()) errs.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Enter a valid email address';
        if (!password.trim()) errs.password = 'Password is required';
        else if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
          errs.password = 'Use 8+ characters with upper, lower & a number';
        }
        if (!confirmPassword.trim()) errs.confirmPassword = 'Please confirm your password';
        else if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match';
        // Apple/marketplace requirement: enforce the 18+ Terms acceptance the
        // EULA already claims, instead of leaving it implicit.
        if (!agreed18 || !agreedTerms) errs.agree = 'Please confirm you are 18+ and agree to the Terms of Use (EULA) & Privacy Policy';

        if (Object.keys(errs).length > 0) {
          setFieldErrors(errs);
          setIsLoading(false);
          triggerHaptic('error');
          setShakeTrigger(prev => prev + 1);
          return;
        }

        const validated = signupSchema.parse({ name, email, password });
        await signUp(validated.email, validated.password, 'client', validated.name);
      }
    } catch (error: any) {
      setShakeTrigger(prev => prev + 1);
      triggerHaptic('error');
      if (error.errors) {
        const errs: Record<string, string> = {};
        error.errors.forEach((e: any) => { if (e.path) errs[e.path[0]] = e.message; });
        setFieldErrors(errs);
      } else {
        appToast.info('Error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Gate social sign-up buttons (Apple / Google) behind the Terms of Use (EULA)
  // + Privacy agreement. Only enforced during signup — sign-in skips this.
  const requireAgreement = (): boolean => {
    if (isLogin) return true;
    if (agreed18 && agreedTerms) return true;
    setFieldErrors(p => ({ ...p, agree: 'Please confirm you are 18+ and agree to the Terms of Use (EULA) & Privacy Policy' }));
    triggerHaptic('error');
    setShakeTrigger(prev => prev + 1);
    return false;
  };

  return (
    <motion.div
      key="auth"
      className="absolute inset-0 z-20 flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6 w-full max-w-sm mx-auto">
        <button
          onClick={() => { triggerHaptic('light'); if (isForgotPassword) { setIsForgotPassword(false); } else { onBack(); } }}
          className="absolute top-12 left-6 w-11 h-11 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white/80 active:scale-90 transition-all z-30 backdrop-blur-xl hover:bg-white/25 hover:text-white hover:border-white/35"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <motion.div
          className="mb-4 mt-16 flex flex-col items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <SwipessLogo size="md" variant="transparent" />
          {getContentValue(siteContent, 'auth_title') && (
            <h2 className="mt-4 text-white text-xl font-bold tracking-wide text-center">
              {getContentValue(siteContent, 'auth_title')}
            </h2>
          )}
        </motion.div>

        {isForgotPassword && (
          <motion.div className="w-full mb-4 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-[10px] font-black tracking-[0.3em] text-white/50 uppercase italic">Security Protocol — Reset</p>
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-3 w-full"
          noValidate
          animate={shakeTrigger > 0 ? {
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.4 }
          } : {}}
          key={`form-shake-${shakeTrigger}`}
        >
          {!isLogin && !isForgotPassword && (
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 group-focus-within:text-white transition-colors" />
              <Input
                value={name}
                onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }}
                placeholder="Your Name"
                autoComplete="name"
                className={inputCls(!!fieldErrors.name)}
              />
              {fieldErrors.name && <p className="text-red-500/90 text-[10px] font-bold mt-1.5 ml-3 uppercase tracking-wider">{fieldErrors.name}</p>}
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 group-focus-within:text-white transition-colors" />
            <Input
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
              placeholder="Email"
              autoComplete="email"
              className={inputCls(!!fieldErrors.email)}
            />
            {fieldErrors.email && <p className="text-red-500/90 text-[10px] font-bold mt-1.5 ml-3 uppercase tracking-wider">{fieldErrors.email}</p>}
          </div>

          {!isForgotPassword && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 group-focus-within:text-white transition-colors" />
              <Input
                type={showPassword ? "text" : "password"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                placeholder="Password"
                autoComplete={isLogin ? "current-password" : "new-password"}
                className={cn(inputCls(!!fieldErrors.password), "pr-12 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden")}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); triggerHaptic('light'); setShowPassword(!showPassword); }}
                  className="text-white/60 hover:text-white transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-red-500/90 text-[10px] font-bold mt-1.5 ml-3 uppercase tracking-wider">{fieldErrors.password}</p>}
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 group-focus-within:text-white transition-colors" />
              <Input
                type={showPassword ? "text" : "password"}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: '' })); }}
                placeholder="Confirm Password"
                autoComplete="new-password"
                className={cn(inputCls(!!fieldErrors.confirmPassword), "[&::-ms-reveal]:hidden [&::-ms-clear]:hidden")}
              />
              {fieldErrors.confirmPassword && <p className="text-red-500/90 text-[10px] font-bold mt-1.5 ml-3 uppercase tracking-wider">{fieldErrors.confirmPassword}</p>}
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div className="flex justify-between items-center px-1 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="hidden peer" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                <div className="w-4 h-4 rounded border border-white/30 peer-checked:bg-white peer-checked:border-white flex items-center justify-center transition-colors bg-white/5">
                  <Check className={cn("w-3 h-3 transition-opacity", rememberMe ? "opacity-100 text-black" : "opacity-0 text-white")} strokeWidth={3} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/70 group-hover:text-white transition-colors">Remember Me</span>
              </label>
              <button type="button" onClick={() => { triggerHaptic('light'); setIsForgotPassword(true); }} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white transition-colors italic">
                Forgot Access Code?
              </button>
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="px-1 pt-0.5">
              <div className="space-y-2.5">
                {/* Box 1 — age confirmation */}
                <div
                  role="checkbox"
                  aria-checked={agreed18}
                  tabIndex={0}
                  onClick={() => { setAgreed18(v => !v); setFieldErrors(p => ({ ...p, agree: '' })); }}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAgreed18(v => !v); setFieldErrors(p => ({ ...p, agree: '' })); } }}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <span className={cn(
                    "w-[22px] h-[22px] shrink-0 rounded-md border-2 flex items-center justify-center transition-colors",
                    agreed18 ? "bg-[#FF4D00] border-[#FF4D00]" : "border-white/45 bg-white/[0.06]",
                  )}>
                    <Check className={cn("w-3.5 h-3.5 text-white transition-opacity", agreed18 ? "opacity-100" : "opacity-0")} strokeWidth={3.5} />
                  </span>
                  <span className="text-[11px] font-bold tracking-wide text-white/75 leading-snug">
                    I confirm I am 18 or older
                  </span>
                </div>

                {/* Box 2 — terms & privacy */}
                <div
                  role="checkbox"
                  aria-checked={agreedTerms}
                  tabIndex={0}
                  onClick={() => { setAgreedTerms(v => !v); setFieldErrors(p => ({ ...p, agree: '' })); }}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setAgreedTerms(v => !v); setFieldErrors(p => ({ ...p, agree: '' })); } }}
                  className="flex items-start gap-3 cursor-pointer select-none"
                >
                  <span className={cn(
                    "w-[22px] h-[22px] mt-0.5 shrink-0 rounded-md border-2 flex items-center justify-center transition-colors",
                    agreedTerms ? "bg-[#FF4D00] border-[#FF4D00]" : "border-white/45 bg-white/[0.06]",
                  )}>
                    <Check className={cn("w-3.5 h-3.5 text-white transition-opacity", agreedTerms ? "opacity-100" : "opacity-0")} strokeWidth={3.5} />
                  </span>
                  <span className="text-[11px] font-bold tracking-wide text-white/75 leading-snug">
                    I agree to the{' '}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setLegalModal('terms'); }} className="underline text-white/95">Terms of Use (EULA)</button>
                    {' '}&amp;{' '}
                    <button type="button" onClick={(e) => { e.stopPropagation(); setLegalModal('privacy'); }} className="underline text-white/95">Privacy Policy</button>.
                  </span>
                </div>
              </div>
              {fieldErrors.agree && <p className="text-red-500/90 text-[10px] font-bold mt-1.5 ml-3 uppercase tracking-wider">{fieldErrors.agree}</p>}
            </div>
          )}

            <div className="pt-2 relative group">
              <div className="absolute inset-x-4 -bottom-2 h-10 bg-white/20 blur-[30px] opacity-0 group-hover:opacity-100 transition-opacity rounded-full pointer-events-none" />
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: getContentValue(siteContent, 'auth_primary_btn_color') || '#FF4D00',
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  boxShadow: '0 0 0 2px rgba(255,77,0,0.7)',
                }}
                className="w-full h-14 rounded-full font-black text-[16px] tracking-widest uppercase active:scale-[0.96] transition-all flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:pointer-events-none relative overflow-hidden border border-white/30"
              >
                <Sparkles className="w-[18px] h-[18px]" strokeWidth={2} />
                {isLoading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </div>
        </motion.form>

        {!isForgotPassword && (
          <motion.div
            className="mt-3 space-y-3 w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <button
              type="button"
              onClick={() => { triggerHaptic('light'); setIsLogin(!isLogin); setFieldErrors({}); }}
              className="w-full h-14 rounded-full font-black text-[15px] tracking-widest uppercase active:scale-[0.97] transition-all flex items-center justify-center gap-2.5"
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: '#ffffff',
                textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                border: '2px solid rgba(255,255,255,0.6)',
                boxShadow: '0 0 20px rgba(255,255,255,0.15)',
              }}
            >
              {isLogin ? 'Create Account' : 'Back to Sign In'}
            </button>

            <div className="flex items-center gap-5 pt-1 pb-1">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.4em] italic">Or</span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            <button
              disabled={isLoading}
              onClick={async () => { 
                if (!requireAgreement()) return; 
                triggerHaptic('medium'); 
                setIsLoading(true);
                const { error } = await signInWithOAuth('apple');
                if (error) setIsLoading(false);
              }}
              style={{
                backgroundColor: '#ffffff',
                color: '#000000',
                border: '2px solid rgba(255,255,255,0.9)',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.3), 0 6px 24px rgba(255,255,255,0.2)',
              }}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-xl active:scale-[0.97] transition-all font-black uppercase tracking-widest text-[13px]"
            >
              <AppleIcon />
              <span>{isLogin ? 'Sign in with Apple' : 'Sign up with Apple'}</span>
            </button>

            {!isNativeIOS && (
              <button
                disabled={isLoading}
                onClick={async () => { 
                  if (!requireAgreement()) return; 
                  triggerHaptic('medium'); 
                  setIsLoading(true);
                  const { error } = await signInWithOAuth('google');
                  if (error) setIsLoading(false);
                }}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  border: '2px solid rgba(255,255,255,0.9)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.3), 0 6px 24px rgba(255,255,255,0.2)',
                }}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-xl active:scale-[0.97] transition-all font-black uppercase tracking-widest text-[13px]"
              >
                <GoogleIcon />
                <span>{isLogin ? 'Continue with Google' : 'Sign up with Google'}</span>
              </button>
            )}
          </motion.div>
        )}
      </div>

      <div className="shrink-0 pb-6 pt-2 flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-[0.3em] text-white italic">
          <button onClick={() => setLegalModal('privacy')} className="hover:text-white/70 transition-colors">Privacy</button>
          <div className="w-1 h-1 rounded-full bg-white/30" />
          <button onClick={() => setLegalModal('terms')} className="hover:text-white/70 transition-colors">Terms</button>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/30 italic">&copy; 2026 Swipess</p>
      </div>

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
                  <p className="text-sm font-bold leading-relaxed text-white">By creating an account or signing in, you agree to these Terms of Use (EULA) and the Privacy Policy. If you do not agree, do not use Swipess.</p>
                  <div className="h-px bg-white/10 my-6" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E01E2A] mb-2">01 — Eligibility</h3>
                  <p className="text-sm opacity-80 leading-relaxed">You must be at least 18 years old and have the legal capacity to enter binding agreements to use Swipess.</p>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E01E2A] mt-6 mb-2">02 — Zero Tolerance for Objectionable Content</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Swipess has ZERO TOLERANCE for objectionable content and abusive behavior. You agree not to post content that is offensive, illegal, hateful, sexually explicit, harassing, or otherwise objectionable, and not to harass or abuse other users. Content is automatically filtered and moderated; violators are removed and permanently banned.</p>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E01E2A] mt-6 mb-2">03 — Reporting &amp; Blocking</h3>
                  <p className="text-sm opacity-80 leading-relaxed">You can report any content or user, and block abusive users, at any time from their profile or your chats. Blocking removes them from your experience immediately. We review every report and remove violating content and offending users within 24 hours.</p>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E01E2A] mt-6 mb-2">04 — Account Security</h3>
                  <p className="text-sm opacity-80 leading-relaxed">You are responsible for safeguarding your credentials. Fraudulent profiles, scraping, malicious code, and attempts to bypass platform security are prohibited and result in immediate termination.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm font-bold leading-relaxed text-white">We value your privacy and security. Swipess uses advanced end-to-end encryption for sensitive data.</p>
                  <div className="h-px bg-white/10 my-6" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E01E2A] mb-2">01 — Data Collection</h3>
                  <p className="text-sm opacity-80 leading-relaxed">We collect email, authentication tokens, and basic interaction data necessary to operate the matching engine.</p>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E01E2A] mt-6 mb-2">02 — Data Sharing</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Your personal identity is strictly shielded. We do not sell your data to external data brokers.</p>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E01E2A] mt-6 mb-2">03 — Asset Privacy</h3>
                  <p className="text-sm opacity-80 leading-relaxed">Location and discovery history is kept private and only utilized for matchmaking algorithms.</p>
                </div>
              )}
            </div>
            <div className="shrink-0 pt-4 flex flex-col gap-3">
              <button
                onClick={() => { triggerHaptic('medium'); setAgreed18(true); setAgreedTerms(true); setFieldErrors(p => ({ ...p, agree: '' })); setLegalModal(null); }}
                className="w-full h-14 bg-white text-black font-bold text-[14px] tracking-wide rounded-full shadow-[0_2px_20px_rgba(255,255,255,0.15)] hover:bg-white/90 active:scale-[0.97] transition-all flex items-center justify-center gap-3"
              >
                <Check className="w-4 h-4" strokeWidth={3} /> I Agree & Continue
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

function LegendaryLandingPage() {
  const [searchParams] = useSearchParams();
  const requestedIntent = searchParams.get('intent');
  const requestedAuthMode = requestedIntent === 'signup' ? 'signup' : 'login';
  const shouldOpenAuth = requestedIntent === 'signin' || requestedIntent === 'sign-in' || requestedIntent === 'login' || requestedIntent === 'signup';
  const [view, setView] = useState<View>(shouldOpenAuth ? 'auth' : 'landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(requestedAuthMode);
  
  const { data: landingData } = useSiteContent('swipess_landing');
  const { data: authData } = useSiteContent('swipess_auth');
  
  const bgImage = getContentValue(landingData, 'landing_background');

  useEffect(() => {
    if (shouldOpenAuth) {
      setAuthMode(requestedAuthMode);
      setView('auth');
    }
  }, [requestedAuthMode, shouldOpenAuth]);

  return (
    <div className="fixed inset-0 overflow-hidden bg-black text-white">
      <div className="absolute inset-0 pointer-events-none bg-black">
        {bgImage ? (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40" 
            style={{ backgroundImage: `url(${bgImage})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-black" />
        )}
      </div>
      <LandingBackgroundEffects mode={getContentValue(landingData, 'shooting_stars_effect', true) ? "stars" : "off"} />

      <AnimatePresence mode="sync">
        {view === 'landing' ? (
          <LandingView key="landing" onEnterAuth={(mode) => { setAuthMode(mode); setView('auth'); }} siteContent={landingData} />
        ) : (
          <AuthView key="auth" onBack={() => setView('landing')} initialMode={authMode} siteContent={authData} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(LegendaryLandingPage);
