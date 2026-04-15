import { memo, useState, useRef, useMemo, useEffect } from 'react';
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
    <div className={cn("relative flex items-center justify-center translate-y-[-2vh]", className)}>
        <motion.div
          animate={{
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative flex items-center justify-center"
        >
          <SwipessLogo 
            size="2xl" 
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
  onEnterAuth: () => void;
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
      onEnterAuth();
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
    onEnterAuth();
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
            animate={{ x: ['−120%', '180%', '180%'] }}
            transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatDelay: 8 }}
          />
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
            className="mt-6 text-[10px] uppercase tracking-[0.4em] font-medium text-white/40 select-none pointer-events-none"
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
    className="group flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-border bg-card/90 px-4 text-sm font-semibold text-foreground shadow-lg shadow-black/20 transition-all duration-200 hover:border-primary/40 hover:bg-accent/50 active:scale-[0.98] disabled:opacity-60"
  >
    <span className="flex min-w-0 items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background/50 text-foreground/90 transition-colors duration-200 group-hover:bg-background/70">
        {icon}
      </span>
      <span className="truncate text-base font-bold tracking-tight">
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
  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
    <button
      type="button"
      onClick={onClick}
      title={showPassword ? 'Hide password' : 'Show password'}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background/80 text-muted-foreground transition-all duration-150 hover:text-foreground active:scale-95"
    >
      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
    </button>
  </div>
);

/* ─── Auth view ──────────────────────────────────────────── */
const AuthView = memo(({ onBack, isDark }: { onBack: () => void, isDark: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
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
    if (rememberedEmail) {
      setEmail(rememberedEmail);
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
          if (rememberMe) localStorage.setItem('auth_client_email', validated.email);
          else localStorage.removeItem('auth_client_email');
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

      <motion.button 
        onClick={onBack} 
        initial={{ opacity: 0, x: -12 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ delay: 0.15, duration: 0.3 }}
        title="Go back to landing"
        aria-label="Go back to landing"
        className="absolute top-4 left-4 z-20 text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      <div className="h-full flex flex-col justify-center p-4 sm:p-5 relative z-10">
        <motion.div className="w-full max-w-sm mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-5 shadow-2xl backdrop-blur-md bg-opacity-80">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-6">
                <SwipessLogo size="md" variant="white" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-white italic mb-1">
                {isLogin ? 'Welcome Back' : 'Join Swipess'}
              </h1>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed px-4">
                {isLogin
                  ? 'Good luck finding your perfect deal today.'
                  : 'Your next perfect deal is one swipe away.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <GlowingField className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full Name" className="pl-10 h-11" />
                  </GlowingField>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <GlowingField className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-400" />
                  <Input type="email" name="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="pl-10 h-11" />
                </GlowingField>
              </motion.div>

              {!isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <GlowingField className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-400" />
                    <Input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="pl-10 pr-12 h-11" />
                    <PasswordToggleButton showPassword={showPassword} onClick={() => setShowPassword(!showPassword)} />
                  </GlowingField>
                </motion.div>
              )}

              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <GlowingField className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-400" />
                    <Input type={showPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Confirm Password" className="pl-10 pr-12 h-11" />
                    <PasswordToggleButton showPassword={showPassword} onClick={() => setShowPassword(!showPassword)} />
                  </GlowingField>
                </motion.div>
              )}

              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants} className="flex items-center space-x-2 px-1 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="w-4 h-4 rounded border border-white/20 bg-black/40 text-orange-500 focus:ring-orange-500/50 accent-orange-500 flex-shrink-0"
                    required
                  />
                  <label htmlFor="terms" className="text-xs text-muted-foreground leading-snug cursor-pointer select-none">
                    I agree to the <a href="#" onClick={e=>e.preventDefault()} className="text-orange-400 hover:text-orange-300 font-medium transition-colors">Terms of Service</a> and <a href="#" onClick={e=>e.preventDefault()} className="text-orange-400 hover:text-orange-300 font-medium transition-colors">Privacy Policy</a>
                  </label>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all relative overflow-hidden group"
                >
                  {isLoading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Join the Club'}
                </Button>
              </motion.div>
            </form>

            {!isForgotPassword && (
              <>
                <motion.div variants={itemVariants} className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] text-muted-foreground/60 uppercase tracking-widest font-medium">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </motion.div>

                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                  <SocialAuthButton
                    label="Apple"
                    onClick={() => handleSocialLogin('apple')}
                    isLoading={socialLoading === 'apple'}
                    icon={
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    }
                  />
                  <SocialAuthButton
                    label="Google"
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

            <motion.div variants={itemVariants} className="mt-4 space-y-2 text-center">
              {isLogin && !isForgotPassword && (
                <p className="text-xs text-muted-foreground">
                  <button type="button" onClick={() => setIsForgotPassword(true)} className="text-orange-400/80 hover:text-orange-400">
                    Forgot password?
                  </button>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {isLogin ? "New here? " : 'Already have an account? '}
                <button type="button" onClick={switchMode} className="text-orange-400 font-semibold">{isLogin ? 'Create a free account' : 'Sign In'}</button>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

    </motion.div>
  );
});

/* ─── Root component ─────────────────────────────────────── */
function LegendaryLandingPage() {
  const { theme, setTheme } = useTheme();
  const [view, setView] = useState<View>('landing');


  const isDark = true; // FORCE DARK EVERYWHERE
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
        isDark ? "dark black-matte" : "light white-matte text-zinc-900"
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
            onEnterAuth={() => setView('auth')}
            isDark={isDark}
            onToggleDark={toggleTheme}
          />
        ) : (
          <AuthView key="auth" onBack={() => setView('landing')} isDark={isDark} />
        )}
      </AnimatePresence>


      </motion.div>
  );
}

export default memo(LegendaryLandingPage);
