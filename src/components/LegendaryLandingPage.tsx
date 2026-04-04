import { memo, useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
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
const AISearchDialog = lazy(() => import('@/components/AISearchDialog').then(m => ({ default: m.AISearchDialog })));
import { SwipessLogo } from './SwipessLogo';

import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';
import { cn } from '@/lib/utils';
import type { EffectMode } from './LandingBackgroundEffects';

// Lazy-load heavy deps that aren't needed for first paint
const LandingBackgroundEffects = lazy(() => import('./LandingBackgroundEffects'));

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
            glow={true}
            className="transition-all duration-700 ease-out" 
          />
        </motion.div>
    </div>
  );
}

// Optimized wordmark matching the Swipess brand identity
function LogoWordmark({ className, size = 'hero', isDark = true }: { className?: string; size?: 'hero' | 'auth'; isDark?: boolean }) {
  return (
    <div className={cn("relative flex flex-col items-center justify-center", size === 'hero' ? 'gap-4' : 'gap-2', className)}>
      <span
        className={cn(
          "font-black uppercase select-none leading-none",
          size === 'hero' ? 'text-5xl sm:text-6xl md:text-7xl tracking-[0.18em]' : 'text-2xl tracking-[0.18em]'
        )}
        style={{
          color: isDark ? '#FFFFFF' : '#0a0a0a',
          textShadow: isDark
            ? '0 0 40px rgba(255,255,255,0.15), 0 2px 8px rgba(0,0,0,0.4)'
            : '0 1px 3px rgba(0,0,0,0.1)',
          letterSpacing: size === 'hero' ? '0.18em' : '0.15em',
        }}
      >
        SwipesS
      </span>
      {size === 'hero' && (
        <div
          className="rounded-full mx-auto"
          style={{
            width: '2.5px',
            height: '3rem',
            background: isDark
              ? 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.08) 100%)'
              : 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 100%)',
          }}
        />
      )}
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
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 28, mass: 1 });
      animate(torchBoost, 0, { duration: 0.3 });
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
      initial={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, scale: 0.94, filter: 'blur(12px)', transition: { duration: 0.4, ease: [0.7, 0, 0.84, 0] } }}
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={{ left: 0.05, right: 0.82 }}
        dragMomentum={false}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTap={handleTap}
        style={{ x, opacity: logoOpacity, scale: logoScale, filter: logoFilter }}
        whileTap={{ scale: 0.97 }}
        className="cursor-grab active:cursor-grabbing touch-none select-none relative"
      >
        <div className="relative">
          <SwipessLogo 
            size="2xl" 
            glow={true}
            className="w-[85vw] max-w-[340px] sm:max-w-[420px] md:max-w-[500px]" 
          />
        </div>
      </motion.div>

      {/* Theme toggle — bottom-left corner */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={(e) => { e.stopPropagation(); onToggleDark(e); triggerHaptic('light'); }}
        data-testid="button-star-filter"
        className={cn(
          "absolute bottom-8 left-8 flex items-center justify-center w-14 h-14 rounded-full transition-colors duration-200 z-50 shadow-2xl overflow-hidden group border",
          isDark ? "bg-white/10 border-white/20 text-white" : "bg-black/5 border-black/10 text-black"
        )}
        style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        <AnimatePresence mode="wait">
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 90 }}
              className="relative z-10"
            >
              <Sun className="w-6 h-6 fill-white" />
            </motion.div>
          ) : (
            <motion.div
              key="stars"
              initial={{ scale: 0, rotate: 90 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -90 }}
              className="relative z-10"
            >
              <Sparkles className="w-6 h-6 fill-black" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Hover Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.button>
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

/* ─── Auth view ──────────────────────────────────────────── */
const AuthView = memo(({ onBack, isDark }: { onBack: () => void, isDark: boolean }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signIn, signUp } = useAuth();
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
    setEmail(''); setPassword(''); setName('');
    setShowPassword(false); setAgreeToTerms(false);
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
                <SwipessLogo size="md" glow={false} />
              </div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-br from-orange-300 via-rose-400 to-pink-500 bg-clip-text text-transparent italic font-brand mb-1">
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
                    <Input type={showPassword ? 'text' : 'password'} name="password" autoComplete={isLogin ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Password" className="pl-10 pr-10 h-11" />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      title={showPassword ? "Hide password" : "Show password"}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </GlowingField>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-sweep"
                  />
                  {isLoading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Join the Club'}
                </Button>
              </motion.div>
            </form>

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
  const [isAIOpen, setIsAIOpen] = useState(false);

  const isDark = theme === 'dark' || theme === 'cheers';
  const activeMode: EffectMode = view === 'auth' ? 'off' : 'stars';
  const bgColor = isDark ? '#050505' : '#f5f5f5';

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
      <Suspense fallback={null}>
        <LandingBackgroundEffects
          mode={activeMode}
          isLightTheme={!isDark}
        />
      </Suspense>

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

      <Suspense fallback={null}>
        <AISearchDialog 
          isOpen={isAIOpen} 
          onClose={() => setIsAIOpen(false)} 
          userRole="client" 
        />
      </Suspense>
      </motion.div>
  );
}

export default memo(LegendaryLandingPage);
