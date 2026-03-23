import { memo, useState, useRef, useMemo, useEffect, lazy, Suspense } from 'react';
import {
  motion, useMotionValue, useTransform, AnimatePresence, PanInfo, animate
} from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, User,
  ArrowLeft, Loader, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';
import { nuclearReset } from '@/utils/cacheManager';
import { cn } from '@/lib/utils';

// Lazy-load heavy deps that aren't needed for first paint
const LandingBackgroundEffects = lazy(() => import('./LandingBackgroundEffects'));

// Optimized logo with fallback
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
}: {
  onEnterAuth: () => void;
}) => {
  const x = useMotionValue(0);
  const logoOpacity = useTransform(x, [0, 100, 220], [1, 0.6, 0]);
  const logoScale = useTransform(x, [0, 120, 220], [1, 0.96, 0.86]);
  const logoBlur = useTransform(x, [0, 100, 220], [0, 2, 14]);
  const logoFilter = useTransform(logoBlur, (v) => `blur(${v}px)`);

  const isDragging = useRef(false);
  const triggered = useRef(false);

  const handleDragStart = () => { isDragging.current = true; };

  const handleDragEnd = (_: any, info: PanInfo) => {
    const shouldSwipe = info.offset.x > 100 || info.velocity.x > 400;
    if (shouldSwipe) {
      if (triggered.current) return;
      triggered.current = true;
      onEnterAuth();
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 28, mass: 1 });
    }
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleTap = () => {
    if (isDragging.current || triggered.current) return;
    triggered.current = true;
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
        dragElastic={0.9}
        dragMomentum={false}
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
  const [_showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ message: string; fullError: string } | null>(null);
  const [_role, _setRole] = useState<'client' | 'owner'>('client');

  const { signIn, signUp, signInWithOAuth: _signInWithOAuth } = useAuth();
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

  const _handleResendConfirmation = async () => {
    if (!email) { toast({ title: 'Email Required', description: 'Please enter your email address.', variant: 'destructive' }); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast({ title: 'Confirmation Email Sent', description: 'Please check your inbox and verify your email.' });
      setShowResendConfirmation(false);
    } catch (error: unknown) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to resend.', variant: 'destructive' });
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

      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setShowResendConfirmation(true);
      }

      let sentientTitle = `${isLogin ? 'Sign In' : 'Sign Up'} Failed`;
      let sentientDescription = error.message || 'Authentication failed.';

      if (error.message === 'Invalid login credentials') {
        sentientTitle = "Login Issue Detected";
        sentientDescription = "We couldn't find a match for those credentials. Would you like to reset your password?";
      } else if (error.message?.includes('Too many requests')) {
        sentientTitle = "Security Cooldown";
        sentientDescription = "Too many attempts. For your safety, please wait a few minutes before trying again.";
      }

      toast({
        title: sentientTitle,
        description: sentientDescription,
        variant: 'destructive',
        action: (
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowErrorDetails(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors border border-white/10"
            >
              Details
            </button>
            <button
              onClick={async () => {
                if (window.confirm("This will clear all local session data and reload the app. Continue?")) {
                  nuclearReset();
                }
              }}
              className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors border border-orange-500/20"
            >
              System Fix
            </button>
          </div>
        )
      });
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
          {isForgotPassword && (
            <motion.div variants={itemVariants} className="text-center mb-5">
              <h2 className="text-xl font-bold text-foreground">Reset Password</h2>
            </motion.div>
          )}

          <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-5 shadow-2xl backdrop-blur-md bg-opacity-80">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black font-brand italic uppercase tracking-tight bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                Welcome to Swipess
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
                  {!isLogin && password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${passwordStrength.color} rounded-full transition-all duration-300`} style={{ width: `${(passwordStrength.score / 4) * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-medium">{passwordStrength.label}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="sr-only peer" />
                    <div className="w-4 h-4 rounded border-2 border-border bg-muted peer-checked:bg-orange-500 peer-checked:border-transparent flex items-center justify-center">
                       {agreeToTerms && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                     <span className="text-xs text-muted-foreground">I agree to the <a href="/terms-of-service" className="text-orange-400">Terms</a></span>
                  </label>
                </motion.div>
              )}

              {isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only peer" />
                      <div className="w-4 h-4 rounded border-2 border-border bg-muted peer-checked:bg-orange-500 peer-checked:border-transparent flex items-center justify-center">
                        {rememberMe && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-sm text-muted-foreground">Remember me</span>
                    </label>
                    <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm text-orange-400 font-medium">Forgot password?</button>
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants}>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-pink-500 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all relative overflow-hidden group"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"
                    style={{ skewX: -20 }}
                  />
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Join the Club'
                  )}
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
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-2xl w-full p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Error Details</h3>
            <pre className="text-xs bg-black/40 p-4 rounded overflow-auto max-h-[50vh]">{errorDetails.message}\n\n{errorDetails.fullError}</pre>
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

  return (
    <div className="h-screen h-dvh relative overflow-hidden" style={{ background: '#050505' }}>
      <Suspense fallback={null}>
        <LandingBackgroundEffects mode={view === 'auth' ? 'off' : 'stars'} isLightTheme={isLightTheme} />
      </Suspense>

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingView
            key="landing"
            onEnterAuth={() => setView('auth')}
          />
        ) : (
          <AuthView key="auth" onBack={() => setView('landing')} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(LegendaryLandingPage);
