import { memo, useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import {
  motion, useMotionValue, useTransform, AnimatePresence, PanInfo, animate
} from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { playRandomZen } from '@/utils/sounds';
import {
  Eye, EyeOff, Mail, Lock, User,
  ArrowLeft, Loader, Check, Star, Gamepad2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useVisualPreferences } from '@/hooks/useVisualPreferences';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';
import { nuclearReset } from '@/utils/cacheManager';
import { cn } from '@/lib/utils';
import type { EffectMode } from './LandingBackgroundEffects';

// Lazy-load heavy deps that aren't needed for first paint
const LandingBackgroundEffects = lazy(() => import('./LandingBackgroundEffects'));

// Optimized logo with modern format support + fallback
const swipessLogoPng = '/icons/swipess-logo.png';

function LogoImage({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <img
        src={swipessLogoPng}
        alt="Swipess Logo"
        style={{ mixBlendMode: 'screen' }}
        className="w-full h-full object-contain select-none pointer-events-none"
      />
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
  bgMode,
  onStarClick,
}: {
  onEnterAuth: () => void;
  bgMode: EffectMode;
  onStarClick: () => void;
}) => {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const torchBoost = useMotionValue(0);

  const logoOpacity = useTransform(x, [0, 100, 220], [1, 0.6, 0]);
  const logoScale = useTransform(x, [0, 120, 220], [1, 0.96, 0.86]);
  const logoBlur = useTransform(x, [0, 100, 220], [0, 2, 14]);
  const logoFilter = useTransform(logoBlur, (v) => `blur(${v}px)`);

  const torchOpacity = useTransform(
    [x, torchBoost] as const,
    ([xVal, boost]: number[]) => {
      const fromDrag = Math.min(1, Math.max(0, xVal / 160));
      return Math.max(0.18, fromDrag + boost * 0.4);
    }
  );

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
    playRandomZen(0.45);
    triggerHaptic('light');
    onEnterAuth();
  };

  return (
    <motion.div
      key="landing"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4"
      style={{ paddingBottom: '10vh' }}
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] } }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18, ease: [0.4, 0, 1, 1] } }}
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
        className="cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div className="relative">
          <LogoImage
            className="w-[85vw] max-w-[480px] sm:max-w-[580px] md:max-w-[680px] aspect-video border border-white/5 mx-auto"
          />
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{ opacity: torchOpacity }}
          >
            <img
              src="/icons/fire-s-logo.webp"
              alt=""
              className="w-full h-full object-contain"
              style={{ mixBlendMode: 'screen' }}
            />
          </motion.div>
        </div>
      </motion.div>

      {/* Star filter / Game button — bottom-left corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (bgMode === 'stars') {
            navigate('/game/trumps-bad-day');
          } else {
            onStarClick();
          }
        }}
        data-testid="button-star-filter"
        className="absolute bottom-6 left-6 w-11 h-11 flex items-center justify-center rounded-full transition-all active:scale-90"
        style={{
          background: bgMode === 'stars'
            ? 'rgba(250,204,21,0.15)'
            : 'rgba(255,255,255,0.07)',
          border: bgMode === 'stars'
            ? '1px solid rgba(250,204,21,0.35)'
            : '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
        }}
        title={bgMode === 'stars' ? "Play Trump's Game" : 'Star Filter'}
      >
        {bgMode === 'stars' ? (
          <Gamepad2 className="w-5 h-5 text-yellow-300" />
        ) : (
          <Star className="w-5 h-5 text-white/50" />
        )}
      </button>

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
const AuthView = memo(({ onBack }: { onBack: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ message: string; fullError: string } | null>(null);

  const { signIn, signUp } = useAuth();
  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

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
        } else throw error;
      } else {
        if (!agreeToTerms) {
          toast({ title: 'Terms Required', description: 'Please agree to the terms.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        const validated = signupSchema.parse({ name, email, password });
        const { error } = await signUp(validated.email, validated.password, 'client', validated.name);
        if (error) throw error;
      }
    } catch (error: any) {
      const errorInfo = {
        message: error.message || 'Unknown error',
        code: error.code || error.status || 'N/A',
        fullError: JSON.stringify(error, null, 2),
        timestamp: new Date().toISOString(),
        action: isLogin ? 'Sign In' : 'Sign Up',
      };
      setErrorDetails(errorInfo);
      setShowErrorDetails(true);
      toast({ title: 'Authentication Failed', description: error.message, variant: 'destructive' });
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
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }}
      exit={{ y: 16, opacity: 0, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/[0.03] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/[0.02] rounded-full" />
      </div>

      <motion.button onClick={onBack} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.3 }}
        className="absolute top-4 left-4 z-20 text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      <div className="h-full flex flex-col justify-center p-4 sm:p-5 relative z-10">
        <motion.div className="w-full max-w-sm mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-5 shadow-2xl backdrop-blur-md bg-opacity-80">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-orange-300 via-rose-400 to-pink-500 bg-clip-text text-transparent italic font-brand">
                 Welcome
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <GlowingField className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-400" />
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
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
                  {isLoading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Join the Club'}
                </Button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="text-center mt-4">
              <p className="text-xs text-muted-foreground">
                {isLogin ? "Don't have an account? " : 'Have an account? '}
                <button type="button" onClick={switchMode} className="text-orange-400 font-semibold">{isLogin ? 'Sign Up' : 'Sign In'}</button>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {showErrorDetails && errorDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-2xl w-full p-6 text-white text-xs overflow-auto max-h-[80vh]">
            <pre>{errorDetails.fullError}</pre>
            <Button onClick={() => setShowErrorDetails(false)} className="w-full mt-4">Close</Button>
          </div>
        </div>
      )}
    </motion.div>
  );
});

/* ─── Root component ─────────────────────────────────────── */
function LegendaryLandingPage() {
  const [view, setView] = useState<View>('landing');
  const { theme } = useTheme();
  const isLightTheme = theme === 'light';
  const { preferences, setBackgroundMode } = useVisualPreferences();

  const handleStarClick = () => {
    setBackgroundMode('stars');
  };

  const activeMode: EffectMode = view === 'auth' ? 'off' : preferences.background_mode;

  return (
    <div className="h-screen h-dvh relative overflow-hidden" style={{ background: theme === 'light' ? '#ffffff' : theme === 'cheers' ? '#0e0400' : '#050505' }}>
      <Suspense fallback={null}>
        <LandingBackgroundEffects 
          mode={activeMode} 
          isLightTheme={isLightTheme} 
        />
      </Suspense>

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingView
            key="landing"
            onEnterAuth={() => setView('auth')}
            bgMode={preferences.background_mode}
            onStarClick={handleStarClick}
          />
        ) : (
          <AuthView key="auth" onBack={() => setView('landing')} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(LegendaryLandingPage);
