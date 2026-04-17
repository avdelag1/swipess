import { memo, useState, useRef, useMemo, useEffect } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import {
  motion, useMotionValue, useTransform, AnimatePresence, PanInfo, animate
} from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { playRandomZen } from '@/utils/sounds';
import {
  Eye, EyeOff, Mail, Lock, User,
  ArrowLeft, Sun, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import { SwipessLogo } from './SwipessLogo';
import LandingBackgroundEffects, { type EffectMode } from './LandingBackgroundEffects';

import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';
import { cn } from '@/lib/utils';

// Optimized logo with modern format support + heartbeat pulse
function LogoImage({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center translate-y-[-2vh] px-8", className)}>
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative flex items-center justify-center w-full max-w-[320px] md:max-w-[400px]"
        >
          <SwipessLogo 
            size="lg" 
            variant="white"
            className="transition-all duration-700 ease-out" 
          />
        </motion.div>
    </div>
  );
}



/* ─── Types ─────────────────────────────────────────────── */
type View = 'landing' | 'auth';

/* ─── Password strength ──────────────────────────────────── */
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  return {
    score,
    label: score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong',
    color: score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-orange-500' : score === 3 ? 'bg-yellow-500' : 'bg-rose-500',
  };
};

/* ─── Landing view ───────────────────────────────────────── */
const LandingView = memo(({
  onEnterAuth,
  isDark,
  onToggleDark,
}: {
  onEnterAuth: (mode: 'login' | 'signup') => void;
  isDark: boolean;
  onToggleDark: (e: React.MouseEvent) => void;
}) => {
  const x = useMotionValue(0);
  const torchBoost = useMotionValue(0);

  const logoOpacity = useTransform(x, [0, 100, 220], [1, 0.6, 0]);
  const logoScale = useTransform(x, [0, 120, 220], [1, 0.96, 0.86]);
  const logoBlur = useTransform(x, [0, 100, 220], [0, 2, 14]);
  const logoFilter = useTransform(logoBlur, (v) => `blur(${v}px)`);

  const isDragging = useRef(false);
  const triggered = useRef(false);

  const handlePointerDown = () => {
    animate(torchBoost, 1, { duration: 0.05 });
    triggerHaptic('light');
  };

  const handlePointerRelease = () => {
    if (!isDragging.current || x.get() < 50) {
      animate(torchBoost, 0, { duration: 0.3 });
    }
  };

  const handleDragStart = () => { isDragging.current = true; };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldSwipe = info.offset.x > 100 || info.velocity.x > 400;
    if (shouldSwipe) {
      if (triggered.current) return;
      triggered.current = true;
      playRandomZen(0.45);
      triggerHaptic('success');
      // Animate logo flying off to the right before showing auth
      animate(x, window.innerWidth + 100, { type: 'spring', stiffness: 200, damping: 22, mass: 0.6 });
      setTimeout(() => onEnterAuth('login'), 280);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 32, mass: 0.5 });
      animate(torchBoost, 0, { duration: 0.22 });
    }
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleTap = () => {
    if (isDragging.current || triggered.current) return;
    triggered.current = true;
    triggerHaptic('light');
    // Same swipe-right exit animation on tap
    animate(x, window.innerWidth + 100, { type: 'spring', stiffness: 200, damping: 22, mass: 0.6 });
    setTimeout(() => onEnterAuth('login'), 280);
  };

  return (
    <motion.div
      key="landing"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4"
      style={{ paddingBottom: '10vh' }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.7, 0, 0.84, 0] } }}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={{ left: 0.05, right: 0.95 }}
        dragMomentum={false}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        style={{ x, opacity: logoOpacity, scale: logoScale, filter: logoFilter }}
        whileTap={{ scale: 0.98 }}
        className="cursor-grab active:cursor-grabbing touch-none select-none relative"
        initial={{ x: -260, opacity: 0 }}
        animate={{ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 120, damping: 18, mass: 0.8, delay: 0.1 } }}
      >
        <div className="relative overflow-hidden">
          <SwipessLogo 
            size="3xl" 
            variant="white"
            className="w-[60vw] max-w-[240px] sm:max-w-[320px] md:max-w-[400px]" 
          />
          {/* Premium shimmer sweep — every 8s */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.28) 48%, rgba(255,255,255,0.08) 52%, transparent 70%)',
            }}
            initial={{ x: '-120%' }}
            animate={{ x: ['-120%', '180%', '180%'] }}
            transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 8 }}
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-8 text-sm uppercase tracking-[0.3em] font-bold text-white select-none pointer-events-none drop-shadow-md"
          >
            Swipe right to enter
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
});

const GlowingField = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn("relative", className)}>
      {children}
    </div>
  );
};

const SocialAuthButton = ({
  label,
  onClick,
  icon,
  isLoading,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  isLoading?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={isLoading}
    aria-label={`Sign in with ${label}`}
    className="group flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-800/80 px-4 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:border-orange-500 hover:bg-zinc-800 active:scale-[0.98] disabled:opacity-60"
  >
    <span className="flex min-w-0 items-center justify-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-700 text-white transition-colors duration-200 group-hover:bg-zinc-600">
        {icon}
      </span>
      <span className="text-base font-black tracking-tighter uppercase text-white">
        {isLoading ? 'Connecting...' : label}
      </span>
    </span>
  </button>
);

const PasswordToggleButton = ({
  showPassword,
  onClick,
}: {
  showPassword: boolean;
  onClick: () => void;
}) => (
  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
    <button
      type="button"
      onClick={onClick}
      title={showPassword ? 'Hide password' : 'Show password'}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="flex h-full w-10 items-center justify-center text-muted-foreground/70 transition-all duration-200 hover:text-foreground active:scale-90"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  </div>
);

/* ─── Auth view ──────────────────────────────────────────── */
const AuthView = memo(({ onBack, isDark, initialMode = 'login' }: { onBack: () => void, isDark: boolean, initialMode?: 'login' | 'signup' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signIn, signUp, signInWithOAuth } = useAuth();
  const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);
  const _passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('auth_client_email') || '';
    const rememberedPassword = localStorage.getItem('auth_client_password') || '';
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      if (rememberedPassword) setPassword(rememberedPassword);
      setRememberMe(true);
    }
  }, []);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = forgotPasswordSchema.parse({ email });
      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'Check your email', description: "We've sent you a password reset link." });
      setIsForgotPassword(false);
      setEmail('');
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to send reset email.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) return handleForgotPassword(e);
    setIsLoading(true);
    try {
      if (isLogin) {
        const validated = loginSchema.parse({ email, password });
        const { error } = await signIn(validated.email, validated.password);
        if (!error) {
          if (rememberMe) {
            localStorage.setItem('auth_client_email', validated.email);
            localStorage.setItem('auth_client_password', validated.password);
          } else {
            localStorage.removeItem('auth_client_email');
            localStorage.removeItem('auth_client_password');
          }
        }
      } else {
        if (!agreeToTerms) {
          toast({ title: 'Terms Required', description: 'Please agree to the terms.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast({ title: 'Passwords do not match', description: 'Please make sure both passwords match perfectly.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        const validated = signupSchema.parse({ name, email, password });
        await signUp(validated.email, validated.password, 'client', validated.name);
      }
    } catch (error: any) {
      toast({ title: 'Invalid Input', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail(''); setPassword(''); setConfirmPassword(''); setName('');
    setShowPassword(false); setAgreeToTerms(false);
  };

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    triggerHaptic('light');
    setSocialLoading(provider);
    try {
      await signInWithOAuth(provider, 'client');
    } catch {
      // Error handled inside signInWithOAuth
    } finally {
      setSocialLoading(null);
    }
  };

  const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.03, delayChildren: 0.06 } } };
  const itemVariants = { hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const } } };

  return (
    <motion.div
      key="auth"
      className="absolute inset-0 flex flex-col overflow-hidden"
      initial={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)', transition: { duration: 0.3, ease: [0.7, 0, 0.84, 0] } }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/[0.03] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/[0.02] rounded-full" />
      </div>

      <div className="flex-1 min-h-0 relative z-10 overflow-y-auto no-scrollbar py-10 px-4 flex flex-col items-center">
        <motion.div className="w-full max-w-sm my-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="bg-[#0A0A0B]/98 border border-white/10 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_32px_120px_-16px_rgba(0,0,0,1)] backdrop-blur-3xl relative">
            <button
              onClick={() => { 
                triggerHaptic('light'); 
                if (isForgotPassword) {
                  setIsForgotPassword(false);
                } else if (!isLogin) {
                  setIsLogin(true);
                } else {
                  onBack(); 
                }
              }}
              className="absolute top-4 left-4 p-2.5 rounded-2xl bg-zinc-800/90 text-white hover:bg-zinc-700 transition-all active:scale-95 z-20 border border-white/5 shadow-lg"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="text-center mb-8 pt-2">
              <div className="flex justify-center mb-6">
                <SwipessLogo size="md" variant="white" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter text-white italic mb-2 uppercase leading-none">
                {isLogin ? 'Welcome Back' : 'Join Swipess'}
              </h1>
              <p className="text-zinc-400 text-sm font-bold leading-relaxed px-4 opacity-80">
                {isLogin
                  ? 'Good luck finding your perfect deal today.'
                  : 'Your next perfect deal is one swipe away.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <GlowingField className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-orange-400 transition-colors z-10" />
                    <Input type="text" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full Name" className="pl-11 h-14 bg-zinc-800/40 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:border-orange-500 focus-visible:bg-zinc-800/60 appearance-none shadow-none caret-orange-500 rounded-2xl" />
                  </GlowingField>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <GlowingField className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-orange-400 transition-colors z-10" />
                  <Input type="email" name="email" autoComplete="username" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="pl-11 h-14 bg-zinc-800/40 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:border-orange-500 focus-visible:bg-zinc-800/60 appearance-none shadow-none caret-orange-500 rounded-2xl" />
                </GlowingField>
              </motion.div>

              {!isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <GlowingField className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-orange-400 transition-colors z-10" />
                    <Input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="pl-11 pr-12 h-14 bg-zinc-800/40 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:border-orange-500 focus-visible:bg-zinc-800/60 appearance-none shadow-none caret-orange-500 rounded-2xl" />
                    <PasswordToggleButton showPassword={showPassword} onClick={() => setShowPassword(!showPassword)} />
                  </GlowingField>
                </motion.div>
              )}

              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <GlowingField className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70 group-focus-within:text-orange-400 transition-colors z-10" />
                    <Input type={showPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm Password" className="pl-11 pr-12 h-14 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus-visible:border-orange-500/50 appearance-none shadow-none caret-orange-500" />
                    <PasswordToggleButton showPassword={showPassword} onClick={() => setShowPassword(!showPassword)} />
                  </GlowingField>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="flex items-center justify-between px-1 pt-1 pb-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md border border-border bg-muted text-orange-500 focus:ring-orange-500/50 accent-orange-500 flex-shrink-0 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-[13px] text-zinc-300 leading-snug cursor-pointer select-none hover:text-white transition-colors font-bold">
                    Remember me (Password included)
                  </label>
                </div>
                {!isLogin && !isForgotPassword && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="w-4 h-4 rounded-md border border-border bg-muted text-orange-500 focus:ring-orange-500/50 accent-orange-500 flex-shrink-0 cursor-pointer"
                      required
                    />
                    <label htmlFor="terms" className="text-[13px] text-zinc-300 leading-snug cursor-pointer select-none font-bold">
                      Agree to <a href="#" onClick={e=>e.preventDefault()} className="text-white hover:text-orange-400 font-black transition-colors underline decoration-zinc-700">Terms</a>
                    </label>
                  </div>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 text-base font-black uppercase tracking-[0.2em] text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-[0_0_40px_rgba(249,115,22,0.4)] hover:shadow-[0_0_60px_rgba(249,115,22,0.6)] active:scale-[0.98] transition-all relative overflow-hidden rounded-2xl flex items-center justify-center border-none outline-none cursor-pointer"
                >
                  <span className="relative z-10">
                    {isLoading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Join the Club'}
                  </span>
                </button>
              </motion.div>
            </form>

            {!isForgotPassword && (
              <>
                <motion.div variants={itemVariants} className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-zinc-800" />
                  <span className="text-[11px] text-zinc-500 uppercase tracking-[0.2em] font-black">or</span>
                  <div className="flex-1 h-px bg-zinc-800" />
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                  <SocialAuthButton
                    label="Sign in with Apple"
                    onClick={() => handleSocialLogin('apple')}
                    isLoading={socialLoading === 'apple'}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    }
                  />
                  <SocialAuthButton
                    label="Sign in with Google"
                    onClick={() => handleSocialLogin('google')}
                    isLoading={socialLoading === 'google'}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                    }
                  />
                </motion.div>
              </>
            )}

            <motion.div variants={itemVariants} className="mt-4 pt-2 border-t border-zinc-800/50 space-y-3 text-center">
              {isLogin && !isForgotPassword && (
                <button 
                  type="button" 
                  onClick={() => setIsForgotPassword(true)} 
                  className="text-[11px] font-black uppercase tracking-[0.15em] text-orange-400 hover:text-orange-300 transition-colors"
                >
                  Forgot password?
                </button>
              )}
              
              <div className="flex flex-col gap-1 items-center justify-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  {isLogin ? "New to Swipess?" : "Already a member?"}
                </span>
                <button 
                  type="button" 
                  onClick={switchMode} 
                  className="text-xs font-black uppercase tracking-[0.2em] text-white hover:text-orange-400 transition-colors border-b-2 border-orange-500/20 hover:border-orange-500 pb-0.5"
                >
                  {isLogin ? 'Create free account' : 'Sign In Now'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

    </motion.div>
  );
});

/* ─── Root component ─────────────────────────────────────── */
function LegendaryLandingPage() {
  const { navigate } = useAppNavigate();
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<View>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');


  const isDark = true;
  const activeMode: EffectMode = view === 'auth' ? 'off' : 'stars';
  const bgColor = '#000000';

  const toggleTheme = (e?: React.MouseEvent) => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme, e ? { x: e.clientX, y: e.clientY } : undefined);
  };

  return (
    <motion.div
      className={cn(
        "h-screen h-dvh relative overflow-hidden transition-colors duration-300",
        isDark ? "black-matte dark text-foreground" : "white-matte light text-foreground"
      )}
      animate={{ backgroundColor: bgColor }}
    >
      <LandingBackgroundEffects
        mode={activeMode}
        isLightTheme={!isDark}
      />

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingView
            key="landing"
            onEnterAuth={(mode) => {
              setAuthMode(mode);
              setView('auth');
            }}
            isDark={isDark}
            onToggleDark={toggleTheme}
          />
        ) : (
          <AuthView key="auth" onBack={() => setView('landing')} isDark={isDark} initialMode={authMode} />
        )}
      </AnimatePresence>

      <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.25em] text-white">
          <button onClick={() => navigate('/privacy-policy')} className="hover:text-orange-400 transition-colors">Privacy</button>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <button onClick={() => navigate('/terms-of-service')} className="hover:text-orange-400 transition-colors">Terms</button>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <button onClick={() => navigate('/about')} className="hover:text-orange-400 transition-colors">About</button>
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mt-1">© 2026 Swipess Global</p>
      </div>

      </motion.div>
  );
}

export default memo(LegendaryLandingPage);
