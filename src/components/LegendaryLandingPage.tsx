// @ts-nocheck
import { memo, useState, useRef, useMemo, useEffect } from 'react';
import {
  motion, useMotionValue, useTransform, AnimatePresence, PanInfo, animate
} from 'framer-motion';
import {
  Shield, Sparkles, Users, Eye, EyeOff, Mail, Lock, User,
  ArrowLeft, Loader, Check, X, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FaGoogle } from 'react-icons/fa';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';
import { Capacitor } from '@capacitor/core';
import LandingBackgroundEffects from './LandingBackgroundEffects';
import StarFieldBackground from './StarFieldBackground';
import swipessLogo from '@/assets/swipess-logo-new.png';

/* ─── Types ─────────────────────────────────────────────── */
type View = 'landing' | 'auth';
type EffectMode = 'off' | 'stars' | 'orbs';

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
  const logoScale  = useTransform(x, [0, 120, 220], [1, 0.96, 0.86]);
  const logoBlur   = useTransform(x, [0, 100, 220], [0, 2, 14]);
  const logoFilter = useTransform(logoBlur, (v) => `blur(${v}px)`);

  const isDragging = useRef(false);
  const triggered  = useRef(false);

  const flyAndOpen = () => {
    if (triggered.current) return;
    triggered.current = true;
    // Fly the logo off to the right, THEN switch view
    animate(x, window.innerWidth * 1.5, {
      duration: 0.28,
      ease: [0.4, 0, 0.8, 1],
      onComplete: () => onEnterAuth(),
    });
  };

  const handleDragStart = () => { isDragging.current = true; };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 50 || info.velocity.x > 300) {
      flyAndOpen();
    } else {
      // Soft spring back
      animate(x, 0, { type: 'spring', stiffness: 260, damping: 22 });
    }
    setTimeout(() => { isDragging.current = false; }, 100);
  };

  const handleTap = () => {
    if (!isDragging.current) flyAndOpen();
  };

  return (
    <motion.div
      key="landing"
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60, filter: 'blur(6px)' }}
      transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {/* Swipable logo */}
      <motion.div
      drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0.08, right: 1 }}
        dragMomentum={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClick={handleTap}
        style={{ x, opacity: logoOpacity, scale: logoScale, filter: logoFilter }}
        whileTap={{ scale: 0.98 }}
        className="cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <img
          src={swipessLogo}
          alt="Swipess"
          className="w-[96vw] max-w-[600px] sm:max-w-[680px] md:max-w-[760px] h-auto object-contain rounded-3xl drop-shadow-2xl mx-auto"
        />
      </motion.div>

      {/* Tagline */}
      <motion.p
        className="-mt-4 relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <span className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium">swipe or tap </span>
        <span
          className="text-3xl sm:text-4xl md:text-5xl font-bold italic"
          style={{
            background: 'linear-gradient(to right, #ff69b4, #ffa500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          to connect
        </span>
      </motion.p>

      {/* Info chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mt-3"
      >
        <div className="flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: Sparkles, label: 'Perfect Deals' },
            { icon: Shield,   label: 'Secure Chat'   },
            { icon: Users,    label: 'Instant Connect'},
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.12] backdrop-blur-md rounded-full border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
            >
              <Icon className="w-3.5 h-3.5 text-white/90" />
              <span className="text-white/90 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Swipe hint arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        className="mt-6 flex items-center gap-1.5 text-white/30"
      >
        <motion.div
          animate={{ x: [0, 8, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-1"
        >
          <ChevronRight className="w-4 h-4" />
          <ChevronRight className="w-4 h-4 -ml-2 opacity-60" />
        </motion.div>
        <span className="text-xs font-medium tracking-wide">swipe right</span>
      </motion.div>

      {/* Effects toggle */}
      <motion.button
        onClick={cycleEffect}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 left-6 z-50 w-11 h-11 rounded-full flex items-center justify-center bg-white/[0.1] backdrop-blur-md border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.4)] text-white/80 text-sm font-bold active:bg-white/20 transition-colors"
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
  const isNativePlatform = Capacitor.isNativePlatform();
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
      toast({
        title: `${isLogin ? 'Sign In' : 'Sign Up'} Failed`,
        description: error.errors?.[0]?.message || error.message || 'Authentication failed.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (e: React.MouseEvent<HTMLButtonElement>, provider: 'google') => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading(true);
    try {
      const { error } = await signInWithOAuth(provider, 'client');
      if (error) throw error;
    } catch (error: any) {
      toast({ title: 'Google Sign-In Failed', description: error.message || 'Failed to sign in with Google', variant: 'destructive' });
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setEmail(''); setPassword(''); setName('');
    setShowPassword(false); setAgreeToTerms(false);
  };

  // stagger variants for form elements
  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.045, delayChildren: 0.08 } },
  };
  const itemVariants = {
    hidden:  { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  };

  return (
    <motion.div
      key="auth"
      className="absolute inset-0 flex flex-col overflow-hidden"
      style={{ background: '#050505' }}
      initial={{ x: 40, opacity: 0, filter: 'blur(8px)' }}
      animate={{ x: 0, opacity: 1, filter: 'blur(0px)' }}
      exit={{ x: 40, opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.34, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <StarFieldBackground />

      {/* Ambient glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/4 rounded-full blur-3xl" />
      </div>

      {/* Back button */}
      <motion.button
        onClick={onBack}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="absolute top-4 left-4 z-20 text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-200 active:scale-95"
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
          <motion.div variants={itemVariants} className="text-center mb-5">
            <h2 className="text-xl font-bold text-white">
              {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome to Swipess' : 'Create account'}
            </h2>
          </motion.div>

          {/* Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/[0.02] border border-white/10 rounded-2xl p-5"
          >
            {/* Google OAuth */}
            {!isForgotPassword && !isNativePlatform && (
              <motion.div variants={itemVariants}>
                <Button
                  type="button"
                  onClick={(e) => handleOAuthSignIn(e, 'google')}
                  disabled={isLoading}
                  variant="outline"
                  className="w-full h-12 font-semibold text-sm text-white hover:border-white/20 transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {isLoading ? <><Loader className="w-4 h-4 mr-2 animate-spin" />Connecting...</> : <><FaGoogle className="w-4 h-4 mr-2 text-white" />Continue with Google</>}
                </Button>
                <div className="relative flex items-center my-4">
                  <div className="flex-grow border-t border-white/10" />
                  <span className="flex-shrink mx-3 text-white/30 text-xs font-medium">or</span>
                  <div className="flex-grow border-t border-white/10" />
                </div>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Name (sign-up) */}
              {!isLogin && !isForgotPassword && (
                <motion.div variants={itemVariants} className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-400 transition-colors" />
                  <Input
                    type="text" value={name} onChange={(e) => setName(e.target.value)} required
                    placeholder="Full Name"
                    className="pl-10 h-11 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/30"
                  />
                </motion.div>
              )}

              {/* Email */}
              <motion.div variants={itemVariants} className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-400 transition-colors" />
                <Input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="Email"
                  className="pl-10 h-11 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/30"
                />
              </motion.div>

              {/* Password */}
              {!isForgotPassword && (
                <motion.div variants={itemVariants}>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-400 transition-colors" />
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password} onChange={(e) => setPassword(e.target.value)} required
                      placeholder="Password"
                      className="pl-10 pr-10 h-11 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/30"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {!isLogin && password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${passwordStrength.color} rounded-full transition-all duration-300`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }} />
                      </div>
                      <span className={`text-[10px] font-medium ${
                        passwordStrength.score <= 1 ? 'text-red-400' :
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
                      <div className="w-4 h-4 rounded border-2 border-white/30 bg-white/5 peer-checked:bg-orange-500 peer-checked:border-transparent transition-all flex items-center justify-center">
                        {agreeToTerms && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <span className="text-xs text-white/50">
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
                        <div className="w-4 h-4 rounded border-2 border-white/30 bg-white/5 peer-checked:bg-orange-500 peer-checked:border-transparent transition-all flex items-center justify-center">
                          {rememberMe && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-white/60">Remember me</span>
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
                  className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 mx-auto">
                  <ArrowLeft className="w-3 h-3" /> Back to Sign In
                </button>
              ) : (
                <p className="text-xs text-white/50">
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
  const [view, setView]         = useState<View>('landing');
  const [effectMode, setEffectMode] = useState<EffectMode>('off');

  const cycleEffect = () => setEffectMode((p) => p === 'off' ? 'stars' : p === 'stars' ? 'orbs' : 'off');
  const effectLabel = effectMode === 'off' ? 'FX' : effectMode === 'stars' ? '✦' : '◉';

  return (
    <div className="h-screen h-dvh relative overflow-hidden" style={{ background: '#050505' }}>
      <LandingBackgroundEffects mode={effectMode} />

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
