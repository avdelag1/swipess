import { memo, useState, useRef, useMemo, useEffect } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import {
  motion, useMotionValue, useTransform, AnimatePresence, PanInfo, animate
} from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { playRandomZen } from '@/utils/sounds';
import {
  Mail, Lock, User, ArrowLeft, Sparkles, ChevronRight
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
      playRandomZen(0.45);
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
            variant="white"
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
          <motion.div 
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="mt-12 text-[10px] uppercase tracking-[0.4em] font-black text-white/40 italic"
          >
            Swipe to initialize
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
});

const SocialAuthButton = ({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white text-black hover:bg-neutral-100 active:scale-[0.97] transition-all font-semibold shadow-md"
  >
    <div className="w-6 h-6 flex items-center justify-center">
      {icon}
    </div>
    <span className="text-[14px] font-semibold tracking-wide">
      {label}
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
  const [savePassword, setSavePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, signInWithOAuth } = useAuth();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const validated = forgotPasswordSchema.parse({ email });
      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: 'Login Link Sent', description: "Check your inbox for reset instructions." });
      setIsForgotPassword(false);
    } catch (error: any) {
      toast({ title: 'System Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgotPassword) return handleForgotPassword(e);
    setIsLoading(true);
    triggerHaptic('medium');
    try {
      if (isLogin) {
        const validated = loginSchema.parse({ email, password });
        await signIn(validated.email, validated.password);
      } else {
        if (password !== confirmPassword) {
          toast({ title: 'Parity Mismatch', description: 'Passwords must be identical.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        const validated = signupSchema.parse({ name, email, password });
        await signUp(validated.email, validated.password, 'client', validated.name);
      }
    } catch (error: any) {
      toast({ title: 'Authorization Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'apple' | 'google') => {
    triggerHaptic('light');
    await signInWithOAuth(provider, 'client');
  };

  return (
    <motion.div
      key="auth"
      className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
    >
      {/* 🛸 GLASS FORM PANEL */}
      <div className="w-full max-w-sm bg-[#0d0d0f]/80 backdrop-blur-3xl border border-white/5 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
        
        <button
          onClick={() => { triggerHaptic('light'); isForgotPassword ? setIsForgotPassword(false) : !isLogin ? setIsLogin(true) : onBack(); }}
          className="absolute top-6 left-6 w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 border border-white/5 active:scale-90 transition-all z-20"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center mb-10 pt-4">
          <div className="flex justify-center mb-6">
            <SwipessLogo size="md" variant="white" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none mb-3">
             {isForgotPassword ? 'Reset Access' : isLogin ? 'Access Portal' : 'Swipess Entry'}
          </h1>
          <p className="text-[10px] font-black tracking-[0.25em] text-white/30 uppercase italic">
            Secure Connection Required
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="STATION ID (NAME)" className="pl-12 h-15 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-[1.5rem] focus:border-[#EB4898]/50 transition-all font-bold italic text-sm" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="COMM-LINK (EMAIL)" className="pl-12 h-15 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-[1.5rem] focus:border-[#EB4898]/50 transition-all font-bold italic text-sm" />
          </div>

          {!isForgotPassword && (
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="CYPHER KEY" className="pl-12 h-15 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-[1.5rem] focus:border-[#EB4898]/50 transition-all font-bold italic text-sm" />
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="VERIFY CYPHER" className="pl-12 h-15 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-[1.5rem] focus:border-[#EB4898]/50 transition-all font-bold italic text-sm" />
            </div>
          )}

          {!isForgotPassword && (
            <div className="flex items-center justify-between px-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  savePassword ? "bg-[#EB4898] border-[#EB4898]" : "bg-white/5 border-white/20 group-hover:border-white/40"
                )}>
                  {savePassword && <Sparkles className="w-2.5 h-2.5 text-white" />}
                </div>
                <input type="checkbox" className="hidden" checked={savePassword} onChange={(e) => setSavePassword(e.target.checked)} />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest italic group-hover:text-white/80 transition-colors">Save Password</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-16 rounded-[1.8rem] bg-white text-black font-black uppercase italic tracking-[0.2em] text-[12px] shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 transition-all flex items-center justify-center gap-2 border-none"
          >
            <Sparkles className="w-4 h-4" />
            {isLoading ? 'SYNCING...' : isForgotPassword ? 'RESET LINK' : isLogin ? 'AUTHORIZE' : 'INITIALIZE'}
          </button>
        </form>

        {!isForgotPassword && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
               <div className="flex-1 h-[1px] bg-white/10" />
               <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em] italic">Or Auth via ID</span>
               <div className="flex-1 h-[1px] bg-white/10" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <SocialAuthButton 
                label="Sign in with Apple" 
                onClick={() => handleSocialLogin('apple')} 
                icon={<svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M16.365 21.43c-1.396.953-2.61.953-3.957 0-3.32-2.316-6.408-7.23-6.408-11.45 0-3.411 2.05-5.26 4.316-5.26 1.346 0 2.658.736 3.499.736.816 0 2.028-.736 3.518-.736 2.008 0 3.826 1.054 4.881 2.76-4.148 2.378-3.41 8.28.916 10.015-1.026 2.502-2.455 4.908-4.52 6.305h-.001zm-3.04-16.71c.08-.228.12-.48.12-.752 0-2.038-1.576-3.83-3.565-3.968-.052.261-.06.516-.06.776 0 1.953 1.585 3.656 3.505 3.944z"/></svg>} 
              />
              <SocialAuthButton 
                label="Sign in with Google" 
                onClick={() => handleSocialLogin('google')} 
                icon={<svg viewBox="0 0 48 48" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c11.045 0 20-8.955 20-20 0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/><path d="M43.611 20.083L43.595 20H24v8h11.303a11.96 11.96 0 01-4.004 5.485C34.802 36.315 39 30.643 39 24c0-1.341-.138-2.65-.389-3.917z" fill="#FF3D00"/><path d="M24 44c5.166 0 9.858-1.977 13.409-5.192l-6.19-5.238c-2.008 1.521-4.504 2.43-7.219 2.43-5.222 0-9.653-3.342-11.303-8l-7.736 5.96C8.847 40.59 15.82 44 24 44z" fill="#4CAF50"/><path d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.004 5.485l6.19 5.238C41.05 35.15 44 29.932 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/></svg>} 
              />
            </div>

            <div className="flex flex-col gap-2 items-center justify-center pt-2">
               <button onClick={() => setIsForgotPassword(true)} className="text-[10px] font-black text-[#EB4898] uppercase tracking-widest hover:opacity-100 opacity-80 transition-opacity">Forgot password or email?</button>
               <button onClick={() => { triggerHaptic('light'); setIsLogin(!isLogin); }} className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">
                 {isLogin ? 'Sign up for Swipess' : 'Access existing account'}
               </button>
            </div>
          </div>
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

  return (
    <div className="h-screen h-dvh relative overflow-hidden bg-black text-white">
      {/* 🛸 ATMOSPHERIC BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(235,72,152,0.08)_0%,transparent_70%)]" />
        <LandingBackgroundEffects mode={view === 'auth' ? 'off' : 'stars'} isLightTheme={false} />
      </div>

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <LandingView key="landing" onEnterAuth={(mode) => { setAuthMode(mode); setView('auth'); }} />
        ) : (
          <AuthView key="auth" onBack={() => setView('landing')} initialMode={authMode} />
        )}
      </AnimatePresence>

      {/* 🛸 LEGAL FOOTER */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex flex-col items-center gap-1.5 opacity-30 hover:opacity-80 transition-opacity">
        <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-[0.3em] text-white italic">
          <button onClick={() => navigate('/privacy-policy')} className="hover:text-[#EB4898] transition-colors">Privacy</button>
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <button onClick={() => navigate('/terms-of-service')} className="hover:text-[#EB4898] transition-colors">Terms</button>
        </div>
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">© 2026 SWIPESS SYSTEM v12.0</p>
      </div>
    </div>
  );
}

export default memo(LegendaryLandingPage);
