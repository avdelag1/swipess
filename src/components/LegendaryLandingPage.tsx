import { memo, useState, useRef, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import {
  motion, useMotionValue, useTransform, AnimatePresence, PanInfo, animate
} from 'framer-motion';
import {
  Shield, Eye, EyeOff, Mail, Lock, User,
  ArrowLeft, Loader, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';

// Lazy-load heavy deps that aren't needed for first paint
const LandingBackgroundEffects = lazy(() => import('./LandingBackgroundEffects'));


const swipessLogo = '/icons/fire-s-logo.png';

/* ─── Types ─────────────────────────────────────────────── */
type View = 'landing' | 'auth';
type EffectMode = 'cheetah' | 'stars' | 'orbs' | 'sunset';

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
    color: score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-orange-500' : score === 3 ? 'bg-yellow-500' : 'bg-green-500',
  };
};

/* ─── Landing view ───────────────────────────────────────── */
const LandingView = memo(({
  onEnterAuth, effectMode, cycleEffect, effectLabel,
}: {
  onEnterAuth: () => void;
  effectMode: EffectMode;
  cycleEffect: () => void;
  effectLabel: string;
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
      // Fire immediately — AnimatePresence exit animation handles the visual transition
      onEnterAuth();
    } else {
      // Snap back — same spring as swipe cards
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 28, mass: 1 });
    }
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleTap = () => {
    if (isDragging.current || triggered.current) return;
    triggered.current = true;
    // Fire immediately — no manual animation needed
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
      {/* Swipable logo */}
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
          <img
            src={swipessLogo}
            alt="Swipess"
            className="w-[70vw] max-w-[420px] sm:max-w-[520px] md:max-w-[600px] h-auto object-contain mx-auto"
          />
        </div>
      </motion.div>


      {/* Effects toggle */}
      <motion.button
        onClick={cycleEffect}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full flex items-center justify-center bg-card border border-border shadow-sm text-foreground/80 text-xl font-bold active:bg-muted transition-colors"
        aria-label="Toggle background effect"
      >
        {effectLabel}
      </motion.button>
    </motion.div>
  );
});

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
  const [showResendConfirmation, setShowResendConfirmation] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const { signIn, signUp, signInWithOAuth } = useAuth();
  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  // Load remembered email on mount
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
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send reset email.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) { toast({ title: 'Email Required', description: 'Please enter your email address.', variant: 'destructive' }); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast({ title: 'Confirmation Email Sent', description: 'Please check your inbox and verify your email.' });
      setShowResendConfirmation(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to resend.', variant: 'destructive' });
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
        const { error } = await signIn(validated.email, validated.password, 'client');
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

      if (error.message?.toLowerCase().includes('email not confirmed')) {
        setShowResendConfirmation(true);
      }

      // DETERMINISTIC SENTIENT RECOVERY
      // Map common auth errors to user-friendly "sentient" advice
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
                  const { nuclearReset } = await import('@/utils/cacheManager');
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

  const handleOAuthSignIn = async (e: React.MouseEvent<HTMLButtonElement>, provider: 'google') => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    const { error } = await signInWithOAuth(provider, 'client');
    if (error) {
      setIsLoading(false);
    }
    // signInWithOAuth already calls toast.error() on failure — no duplicate toast.
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail(''); setPassword(''); setName('');
    setShowPassword(false); setAgreeToTerms(false);
  };

  // stagger variants for form elements
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.03, delayChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const } },
  };

  return (
    <motion.div
      key="auth"
      className="absolute inset-0 flex flex-col overflow-hidden"
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }}
      exit={{ y: 16, opacity: 0, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
    >


      {/* Ambient glows — no blur per GPU policy */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/[0.03] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/[0.02] rounded-full" />
      </div>

      {/* Back button */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="absolute top-4 left-4 z-20 text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg hover:bg-muted transition-all duration-200 active:scale-95"
        style={{ paddingTop: 'max(16px, env(safe-area-inset-top))' }}
      >
        <ArrowLeft className="w-5 h-5" />
      </motion.button>

      {/* Form content */}
      <div className="h-full flex flex-col justify-center p-4 sm:p-5 relative z-10">
        <motion.div
          className="w-full max-w-sm mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          {(isForgotPassword || !isLogin) && (
            <motion.div variants={itemVariants} className="text-center mb-5">
              <h2 className="text-xl font-bold text-foreground">
                {isForgotPassword ? 'Reset Password' : 'Create account'}
              </h2>
            </motion.div>
          )}

          {/* Card */}
          <motion.div
            variants={itemVariants}
            className="bg-card border border-border rounded-2xl p-5"
          >
            {/* Email-only auth (Google OAuth removed) */}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name (sign-up) */}
              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants} className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-400 transition-colors" />
                  <Input
                    type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    placeholder="Full Name"
                    className="pl-10 h-11 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                  />
                </motion.div>
              )}

              {/* Email */}
              <motion.div variants={itemVariants} className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-400 transition-colors" />
                <Input
                  type="email"
                  name="email"
                  autoComplete="username"
                  value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="Email"
                  className="pl-10 h-11 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                />
              </motion.div>

              {/* Password */}
              {!isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-orange-400 transition-colors" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="Password"
                      className="pl-10 pr-10 h-11 text-sm bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!isLogin && password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${passwordStrength.color} rounded-full transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }} />
                      </div>
                      <span className={`text-[10px] font-medium ${passwordStrength.score <= 1 ? 'text-red-400' :
                        passwordStrength.score === 2 ? 'text-orange-400' :
                          passwordStrength.score === 3 ? 'text-yellow-400' : 'text-green-400'
                        }`}>{passwordStrength.label}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Terms (sign-up) */}
              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input type="checkbox" checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} className="sr-only peer" />
                      <div className="w-4 h-4 rounded border-2 border-border bg-muted peer-checked:bg-orange-500 peer-checked:border-transparent transition-all flex items-center justify-center">
                        {agreeToTerms && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      I agree to the{' '}
                      <a href="/terms-of-service" target="_blank" className="text-orange-400 underline">Terms</a>{' & '}
                      <a href="/privacy-policy" target="_blank" className="text-orange-400 underline">Privacy</a>
                    </span>
                  </label>
                </motion.div>
              )}

              {/* Remember me / Forgot password */}
              {isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="sr-only peer" />
                        <div className="w-4 h-4 rounded border-2 border-border bg-muted peer-checked:bg-orange-500 peer-checked:border-transparent transition-all flex items-center justify-center">
                          {rememberMe && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">Remember me</span>
                    </label>
                    <button type="button" onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-orange-400 hover:underline font-medium">
                      Forgot password?
                    </button>
                  </div>
                  {showResendConfirmation && (
                    <button type="button" onClick={handleResendConfirmation} disabled={isLoading}
                      className="w-full text-sm text-orange-400 hover:text-orange-300 font-medium text-center py-1">
                      Resend confirmation email
                    </button>
                  )}
                </motion.div>
              )}

              {/* Submit */}
              <motion.div variants={itemVariants}>
                <Button
                  type="submit" disabled={isLoading}
                  className="w-full h-12 text-sm font-bold text-white transition-all mt-1 hover:opacity-90 active:scale-[0.97]"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ef4444, #e11d48)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 16px rgba(239,68,68,0.35)',
                  }}
                >
                  {isLoading
                    ? <><Loader className="w-4 h-4 mr-2 animate-spin" />Please wait...</>
                    : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'
                  }
                </Button>
              </motion.div>
            </form>

            {/* Toggle sign-in / sign-up */}
            <motion.div variants={itemVariants} className="text-center mt-4">
              {isForgotPassword ? (
                <button type="button" onClick={() => { setIsForgotPassword(false); setEmail(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mx-auto">
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                  <button type="button" onClick={switchMode}
                    className="text-orange-400 hover:underline font-semibold">
                    {isLogin ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Error details modal */}
      {showErrorDetails && errorDetails && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90">
          <div className="bg-zinc-900 border border-red-500/20 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Error Details</h3>
                  <p className="text-xs text-white/60">{errorDetails.timestamp}</p>
                </div>
              </div>
              <button onClick={() => setShowErrorDetails(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-160px)] space-y-4">
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm text-white font-mono break-words">{errorDetails.message}</p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                <pre className="text-xs text-white/70 font-mono overflow-x-auto whitespace-pre-wrap">{errorDetails.fullError}</pre>
              </div>
            </div>
            <div className="border-t border-white/10 px-6 py-4 flex gap-3">
              <Button onClick={() => { navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2)); toast({ title: 'Copied!' }); }}
                variant="outline" className="flex-1 border-white/10 hover:bg-white/5">Copy Error</Button>
              <Button onClick={() => setShowErrorDetails(false)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white">Close</Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
});

/* ─── Root component ─────────────────────────────────────── */
function LegendaryLandingPage() {
  const [view, setView] = useState<View>('landing');
  const [effectMode, setEffectMode] = useState<EffectMode>('stars');
  const { theme } = useTheme();
  const isLightTheme = theme === 'light';

  // Cycle: stars → orbs → cheetah → sunset → stars
  const cycleEffect = () => setEffectMode((p) => {
    if (p === 'stars') return 'orbs';
    if (p === 'orbs') return 'cheetah';
    if (p === 'cheetah') return 'sunset';
    return 'stars';
  });
  const effectLabel =
    effectMode === 'stars' ? '✦' :
    effectMode === 'orbs' ? '◉' :
    effectMode === 'cheetah' ? '◆' :
    '☁️';

  return (
    <div className="h-screen h-dvh relative overflow-hidden bg-background">
      <Suspense fallback={null}>
        <LandingBackgroundEffects mode={effectMode} isLightTheme={isLightTheme} />
      </Suspense>

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingView
            key="landing"
            onEnterAuth={() => setView('auth')}
            effectMode={effectMode}
            cycleEffect={cycleEffect}
            effectLabel={effectLabel}
          />
        ) : (
          <AuthView
            key="auth"
            onBack={() => setView('landing')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(LegendaryLandingPage);
