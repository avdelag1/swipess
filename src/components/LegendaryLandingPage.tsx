import { memo, useState, useRef, useEffect } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import {
  motion, AnimatePresence
} from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { playRandomZen } from '@/utils/sounds';
import {
  Mail, Lock, User, ArrowLeft, Sparkles, ChevronRight, Check, LogIn, X, Eye, EyeOff, ShieldCheck, ShieldAlert, BadgeCheck
} from 'lucide-react';
import { SwipessLogo } from './SwipessLogo';
import LandingBackgroundEffects from './LandingBackgroundEffects';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';
import { cn } from '@/lib/utils';
import { TERMS_PROTOCOL, PRIVACY_PROTOCOL } from './legal/LegalProtocols';

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
  // Render landing view

  return (
    <motion.div
      key="landing"
      className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >


      <motion.div
        className="mb-16"
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <SwipessLogo size="7xl" variant="transparent" />
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 1 }}
          className="text-[10px] font-black uppercase tracking-[0.8em] mt-6 text-white italic"
        >
          Flagship Matrix
        </motion.p>
      </motion.div>

      <motion.div
        className="flex flex-col items-center gap-4 w-full max-w-[320px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <button
          onClick={() => { triggerHaptic('medium'); onEnterAuth('login'); }}
          className="w-full h-16 rounded-[2rem] bg-gradient-to-tr from-white to-white/90 text-black font-black uppercase tracking-[0.2em] text-[17px] shadow-[0_20px_50px_rgba(255,255,255,0.2)] active:scale-[0.97] transition-all flex items-center justify-center gap-3 border border-white/50"
        >
          <LogIn className="w-5 h-5" />
          Sign In
        </button>
        <button
          onClick={() => { triggerHaptic('medium'); onEnterAuth('signup'); }}
          className="w-full h-16 rounded-[2rem] bg-white/5 backdrop-blur-2xl border border-white/20 text-white font-black uppercase tracking-[0.2em] text-[17px] active:scale-[0.97] transition-all flex items-center justify-center gap-3 hover:bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
        >
          <Sparkles className="w-5 h-5 text-[#EB4898]" />
          Create Account
        </button>
      </motion.div>
    </motion.div>
  );
});

/* ─── Social auth buttons ─── */
const AppleAuthButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex h-[48px] w-full items-center justify-center gap-3 rounded-xl bg-black text-white active:scale-[0.97] transition-all shadow-[0_10px_25px_rgba(0,0,0,0.4)] border border-white/10 hover:bg-black/90"
  >
    <AppleIcon />
    <span className="text-[14px] font-semibold tracking-tight leading-none pt-0.5">
      Sign in with Apple
    </span>
  </button>
);

const GoogleAuthButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex h-[48px] w-full items-center justify-center gap-3 rounded-xl bg-black/40 backdrop-blur-xl border border-white/15 hover:border-white/30 active:scale-[0.97] transition-all shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
  >
    <GoogleIcon />
    <span className="text-[14px] font-black uppercase tracking-widest text-white leading-none pt-0.5">
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
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedRole, setSelectedRole] = useState<'client' | 'owner'>('client');
  const [showPassword, setShowPassword] = useState(false);
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
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'Swipess Link Sent', description: "Check your neural inbox for reset parameters." });
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
        const validated = loginSchema.parse({ email, password });
        await signIn(validated.email, validated.password);
      } else {
        const validated = signupSchema.parse({ name, email, password });
        await signUp(validated.email, validated.password, selectedRole, validated.name);
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
    await signInWithOAuth(provider, selectedRole);
  };

  return (
    <motion.div
      key="auth"
      className="absolute inset-0 flex flex-col items-center justify-start sm:justify-center p-4 pt-32 sm:pt-40 pb-20 z-20 overflow-y-auto no-scrollbar"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
    >
      <div className="w-full max-w-sm bg-[#0d0d0f]/85 backdrop-blur-[40px] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden my-auto shrink-0">
        {/* Shimmer effect removed as per user request */}
        
        <button
          onClick={() => { triggerHaptic('light'); if (isForgotPassword) { setIsForgotPassword(false); } else { onBack(); } }}
          className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-black border shadow-xl active:scale-90 transition-all z-20"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 pt-6 flex flex-col items-center">
          <SwipessLogo size="lg" variant="transparent" className="mb-4" />

          {isForgotPassword ? (
            <>
              <h1 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none mb-1.5">
                Reset Password
              </h1>
              <p className="text-[9px] font-bold tracking-[0.2em] text-white/35 uppercase">
                Enter your email link
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1.5 bg-black/40 backdrop-blur-md rounded-[1.5rem] p-1 mb-2 border border-white/5 relative">
                <button
                  type="button"
                  onClick={() => { triggerHaptic('light'); setIsLogin(true); setFieldErrors({}); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 z-10",
                    isLogin ? "text-black" : "text-white/30 hover:text-white/50"
                  )}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { triggerHaptic('light'); setIsLogin(false); setFieldErrors({}); }}
                  className={cn(
                    "flex-1 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-300 z-10",
                    !isLogin ? "text-black" : "text-white/30 hover:text-white/50"
                  )}
                >
                  Sign Up
                </button>
                <motion.div 
                  className="absolute top-1 bottom-1 rounded-[1.1rem] bg-white shadow-[0_5px_15px_rgba(255,255,255,0.3)]"
                  initial={false}
                  animate={{ 
                    left: isLogin ? '1%' : '50.5%',
                    right: isLogin ? '50.5%' : '1%'
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              </div>
              <p className="text-[9px] font-bold tracking-[0.2em] text-white/35 uppercase">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </p>
            </>
          )}
        </div>

        {!isForgotPassword && (
          <div className="mb-2 space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <AppleAuthButton onClick={() => handleSocialLogin('apple')} />
              <GoogleAuthButton onClick={() => handleSocialLogin('google')} />
            </div>
            
            <div className="flex items-center gap-3 pt-1">
               <div className="flex-1 h-[1px] bg-white/5" />
               <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">or</span>
               <div className="flex-1 h-[1px] bg-white/5" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
          {!isLogin && !isForgotPassword && (
            <div className="flex flex-col gap-1.5 mb-1.5">
               <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 ml-1">Identity Protocol</p>
               <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setSelectedRole('client'); }}
                    className={cn(
                      "py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                      selectedRole === 'client' ? "bg-white text-black border-white shadow-lg" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                    )}
                  >
                    Seeker
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setSelectedRole('owner'); }}
                    className={cn(
                      "py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all border",
                      selectedRole === 'owner' ? "bg-white text-black border-white shadow-lg" : "bg-white/5 text-white/40 border-white/5 hover:bg-white/10"
                    )}
                  >
                    Authority
                  </button>
               </div>
            </div>
          )}

          <div className="space-y-3.5">
            {!isLogin && !isForgotPassword && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full Name"
                  className={cn(
                    "w-full h-[44px] bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 text-[12px] font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all",
                    fieldErrors.name && "border-red-500/50 bg-red-500/5"
                  )}
                />
                {fieldErrors.name && <p className="absolute -bottom-4 left-3 text-[10px] font-bold text-red-400 uppercase tracking-tight">{fieldErrors.name}</p>}
              </div>
            )}

            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Protocol"
                className={cn(
                  "w-full h-[44px] bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 text-[12px] font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all",
                  fieldErrors.email && "border-red-500/50 bg-red-500/5"
                )}
              />
              {fieldErrors.email && <p className="absolute -bottom-4 left-3 text-[10px] font-bold text-red-400 uppercase tracking-tight">{fieldErrors.email}</p>}
            </div>

            {!isForgotPassword && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Alpha-Numeric Key"
                  className={cn(
                    "w-full h-[44px] bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 text-[12px] font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all",
                    fieldErrors.password && "border-red-500/50 bg-red-500/5"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                {fieldErrors.password && <p className="absolute -bottom-4 left-3 text-[10px] font-bold text-red-400 uppercase tracking-tight">{fieldErrors.password}</p>}
              </div>
            )}

            {!isLogin && !isForgotPassword && (
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 group-focus-within:text-white transition-colors">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Verify Security Key"
                  className={cn(
                    "w-full h-[44px] bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 text-[12px] font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all",
                    fieldErrors.confirmPassword && "border-red-500/50 bg-red-500/5"
                  )}
                />
                {fieldErrors.confirmPassword && <p className="absolute -bottom-4 left-3 text-[10px] font-bold text-red-400 uppercase tracking-tight">{fieldErrors.confirmPassword}</p>}
              </div>
            )}
          </div>

          {isLogin && !isForgotPassword && (
            <div className="flex items-center justify-between px-1 pt-1">
               <button 
                 type="button" 
                 onClick={() => { triggerHaptic('light'); setRememberMe(!rememberMe); }}
                 className="flex items-center gap-1.5 group transition-all"
               >
                  <div className={cn(
                    "w-4 h-4 rounded-md border-2 transition-all flex items-center justify-center",
                    rememberMe ? "bg-primary border-primary scale-110" : "border-white/10 group-hover:border-white/20"
                  )}>
                    {rememberMe && <Check className="w-2.5 h-2.5 text-black stroke-[4px]" />}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/50 group-hover:text-white transition-colors">Remember</span>
               </button>
               
               <button 
                 type="button" 
                 onClick={() => { triggerHaptic('light'); setIsForgotPassword(true); }}
                 className="text-[9px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-all"
               >
                 Forgot?
               </button>
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="text-[8px] font-bold uppercase tracking-widest text-white/30 text-center px-2 leading-relaxed mt-1">
              By joining, you agree to{' '}
              <button 
                type="button" 
                onClick={() => { triggerHaptic('light'); (window as any).dispatchEvent(new CustomEvent('open-legal', { detail: 'terms' })); }}
                className="text-white hover:text-primary transition-colors underline underline-offset-2"
              >
                Terms
              </button>
              {' '}and{' '}
              <button 
                type="button" 
                onClick={() => { triggerHaptic('light'); (window as any).dispatchEvent(new CustomEvent('open-legal', { detail: 'privacy' })); }}
                className="text-white hover:text-primary transition-colors underline underline-offset-2"
              >
                Privacy
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[48px] rounded-xl bg-primary text-black font-bold uppercase tracking-[0.2em] text-[12px] shadow-[0_15px_35px_rgba(var(--color-brand-primary-rgb),0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border-none mt-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span className="drop-shadow-md">
              {isLoading ? 'Processing...' : isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
            </span>
          </button>
        </form>
      </div>
    </motion.div>
  );
});

/* ─── Root component ─────────────────────────────────────── */
function LegendaryLandingPage() {
  // Navigation hook called but unused currently
  const [view, setView] = useState<View>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [legalModal, setLegalModal] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    const handleOpenLegal = (e: any) => setLegalModal(e.detail);
    window.addEventListener('open-legal', handleOpenLegal);
    return () => window.removeEventListener('open-legal', handleOpenLegal);
  }, []);

  return (
    <div className="h-screen h-dvh relative overflow-hidden bg-black text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--color-brand-primary-rgb),0.08)_0%,transparent_70%)]" />
        <LandingBackgroundEffects mode={view === 'auth' ? 'off' : 'stars'} isLightTheme={false} />
      </div>



      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingView key="landing" onEnterAuth={(mode) => { setAuthMode(mode); setView('auth'); }} />
        ) : (
          <AuthView key="auth" onBack={() => setView('landing')} initialMode={authMode} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === 'landing' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-1.5 opacity-30 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-[0.3em] text-white italic">
              <button onClick={() => setLegalModal('privacy')} className="hover:text-primary transition-colors">Privacy</button>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <button onClick={() => setLegalModal('terms')} className="hover:text-primary transition-colors">Terms</button>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <button onClick={() => setLegalModal('terms')} className="hover:text-primary transition-colors">Legal Hub</button>
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">© 2026 SWIPESS INDUSTRIES</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {legalModal && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-x-0 bottom-0 top-10 z-[100] bg-black/60 backdrop-blur-[40px] saturate-[180%] rounded-t-[2.5rem] border-t border-white/20 flex flex-col pt-10 px-6 pb-8 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
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
               {(() => {
                 const protocol = legalModal === 'terms' ? TERMS_PROTOCOL : PRIVACY_PROTOCOL;
                 return (
                   <div className="space-y-8">
                     <div className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                           <ShieldAlert className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-0.5">Integrity Sync</p>
                           <p className="text-[12px] font-bold text-white/90 leading-tight">{protocol.introduction}</p>
                        </div>
                     </div>

                     <div className="h-px bg-white/5 mx-2" />

                     {protocol.sections.map((section) => (
                       <div key={section.id} className="group transition-all">
                         <div className="flex items-center gap-3 mb-3">
                           <div className="px-2.5 py-1 rounded-md bg-white/10 text-[9px] font-black tracking-widest text-white/50 group-hover:text-white group-hover:bg-primary/40 transition-colors">
                             SEC-{section.id}
                           </div>
                           <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-white/90 group-hover:text-primary transition-colors">{section.title}</h3>
                         </div>
                         <p className="text-[13px] font-medium opacity-60 leading-relaxed group-hover:opacity-100 transition-opacity">
                           {section.content}
                         </p>
                       </div>
                     ))}

                     <div className="pt-6 border-t border-white/5 flex items-center justify-between opacity-30">
                        <div className="flex items-center gap-2">
                           <BadgeCheck className="w-3 h-3" />
                           <span className="text-[8px] font-black uppercase tracking-widest">Protocol Verified</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest">Updated: {protocol.lastUpdated}</span>
                     </div>
                   </div>
                 );
               })()}
            </div>

            <div className="shrink-0 pt-4 flex flex-col gap-3">
               <button 
                 onClick={() => {
                   triggerHaptic('medium');
                   setLegalModal(null);
                 }} 
                 className="w-full h-14 bg-primary text-black font-black uppercase italic tracking-widest rounded-2xl shadow-[0_0_30px_rgba(var(--color-brand-primary-rgb),0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
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
