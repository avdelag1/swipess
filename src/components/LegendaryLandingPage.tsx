import { memo, useState, useRef, useMemo, useEffect } from 'react';
import { useAppNavigate } from "@/hooks/useAppNavigate";
import {
  motion, useMotionValue, useTransform, AnimatePresence, PanInfo, animate
} from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { playRandomZen } from '@/utils/sounds';
import {
  Mail, Lock, User, ArrowLeft, Sparkles, ChevronRight, Check
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
    className="group flex h-16 w-full items-center justify-center gap-4 rounded-[2rem] bg-[#0a0a0b] border border-white/10 hover:border-white/20 active:scale-[0.97] transition-all shadow-2xl"
  >
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-[#FF4D00]/20 group-hover:text-[#FF4D00] transition-colors border border-white/5">
      {icon}
    </div>
    <span className="text-[11px] font-black tracking-[0.25em] uppercase text-white drop-shadow-md">
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
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
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
      toast({ title: 'Reset Link Sent', description: "Check your inbox for reset instructions." });
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
             {isForgotPassword ? 'Reset Access' : isLogin ? 'Access Portal' : 'Get Started'}
          </h1>
          <p className="text-[10px] font-black tracking-[0.25em] text-white/40 uppercase italic">
            SECURE NEURAL CONNECTION REQUIRED
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="STATION ID (NAME)" className="pl-12 h-15 bg-black/60 border-white/10 text-white placeholder:text-white/20 rounded-[1.5rem] focus:border-brand-primary/50 transition-all font-bold italic text-sm" />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="COMM-LINK (EMAIL)" className="pl-12 h-15 bg-black/60 border-white/10 text-white placeholder:text-white/20 rounded-[1.5rem] focus:border-brand-primary/50 transition-all font-bold italic text-sm" />
          </div>

          {!isForgotPassword && (
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="CYPHER KEY" className="pl-12 h-15 bg-black/60 border-white/10 text-white placeholder:text-white/20 rounded-[1.5rem] focus:border-brand-primary/50 transition-all font-bold italic text-sm" />
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div className="relative">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="VERIFY CYPHER KEY" className="pl-12 h-15 bg-[#0d0d0f] border-white/10 text-white placeholder:text-white/20 rounded-[1.2rem] focus:border-[#FF4D00]/50 transition-all font-bold italic text-sm" />
            </div>
          )}

          <div className="flex items-center justify-between px-2 pt-2 pb-1">
             <button 
               type="button" 
               onClick={() => { triggerHaptic('light'); setRememberMe(!rememberMe); }}
               className="flex items-center gap-2 group transition-all"
             >
                <div className={cn(
                  "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                  rememberMe ? "bg-[#FF4D00] border-[#FF4D00] scale-110" : "border-white/10 group-hover:border-white/20"
                )}>
                  {rememberMe && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white">Save Access?</span>
             </button>
             
             {isLogin && (
               <button 
                 type="button" 
                 onClick={() => { triggerHaptic('light'); setIsForgotPassword(true); }}
                 className="text-[10px] font-black uppercase tracking-widest text-[#FF4D00] hover:text-[#FF4D00] transition-all"
               >
                 Forgot Key?
               </button>
             )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-16 rounded-[2rem] bg-[#FF4D00] text-white font-black uppercase tracking-[0.3em] text-[13px] shadow-[0_15px_45px_rgba(255,77,0,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border-none mt-2"
          >
            <Sparkles className="w-4 h-4" />
            <span className="drop-shadow-md">
              {isLoading ? 'SYNCING...' : isForgotPassword ? 'RESET ACCESS' : isLogin ? 'AUTHORIZE' : 'INITIALIZE'}
            </span>
          </button>
        </form>

        {!isForgotPassword && (
          <div className="mt-8 space-y-6">
            <div className="flex items-center gap-4">
               <div className="flex-1 h-[1px] bg-white/5" />
               <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">Or Auth via ID</span>
               <div className="flex-1 h-[1px] bg-white/5" />
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <SocialAuthButton label="Authorized Apple" onClick={() => handleSocialLogin('apple')} icon={<ChevronRight className="w-4 h-4" />} />
              <SocialAuthButton label="Authorized Google" onClick={() => handleSocialLogin('google')} icon={<Sparkles className="w-4 h-4" />} />
            </div>

            <div className="flex flex-col gap-4 items-center justify-center pt-6">
               <div className="flex items-center gap-6">
                  <button onClick={() => { setIsForgotPassword(true); triggerHaptic('light'); }} className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white transition-colors">Forgot Password?</button>
                  <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
                  <button onClick={() => triggerHaptic('light')} className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] hover:text-white transition-colors">Forgot Email?</button>
               </div>
               
               <button 
                 onClick={() => { triggerHaptic('medium'); setIsLogin(!isLogin); }} 
                 className="w-full py-4 rounded-[1.5rem] bg-white/5 border border-white/5 text-[11px] font-black text-white uppercase tracking-[0.3em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
               >
                 {isLogin ? 'Create Station ID' : 'Back to Comm-Link'}
                 <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
        <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20 italic">© 2026 Swipess</p>
      </div>
    </div>
  );
}

export default memo(LegendaryLandingPage);
