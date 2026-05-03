import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { Loader2, Lock, Eye, EyeOff, Check, X, ArrowLeft, Sparkles } from "lucide-react";
import { SwipessLogo } from "@/components/SwipessLogo";
import { cn } from "@/lib/utils";

// Password strength checker
const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  return {
    checks,
    score,
    label: score <= 1 ? 'Weak' : score === 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong',
    color: score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-orange-500' : score === 3 ? 'bg-yellow-500' : 'bg-rose-500',
  };
};

// Nexus particles component
const NexusParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 12 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          width: `${1 + Math.random() * 3}px`,
          height: `${1 + Math.random() * 3}px`,
          background: i % 2 === 0 ? '#FF4D00' : '#EB4898',
          boxShadow: `0 0 ${10 + Math.random() * 20}px ${i % 2 === 0 ? '#FF4D00' : '#EB4898'}`,
          borderRadius: '50%',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          scale: [0, 1, 0],
          opacity: [0, 0.8, 0],
          x: [0, (Math.random() - 0.5) * 50],
          y: [0, (Math.random() - 0.5) * 50],
        }}
        transition={{
          duration: 3 + Math.random() * 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);
  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Access Sync Failed",
        description: "Credentials do not match the target parity.",
        variant: "destructive",
      });
      return;
    }

    if (passwordStrength.score < 4) {
      toast({
        title: "Insecure Protocol",
        description: "Password complexity must meet Nexus standards (8+ chars, Case, Numbers).",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      toast({
        title: "Protocol Updated",
        description: "Security sync complete. Accessing gateway...",
      });

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error: unknown) {
      toast({
        title: "Sync Error",
        description: error instanceof Error ? error.message : "Please try again or request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <NexusParticles />

      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FF4D00]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#EB4898]/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/")}
          className="mb-8 flex items-center gap-2 text-white/40 hover:text-white/80 transition-all group"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Back to Gateway</span>
        </motion.button>

        {/* Logo and Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="inline-flex items-center justify-center mb-8">
            <SwipessLogo size="lg" variant="transparent" />
          </div>

          <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-2">Reset Password</h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/30 italic">
            Initialize Strong Access Protocol
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Subtle liquid border overlay */}
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[2.5rem]" />
          
          <form onSubmit={handleResetPassword} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1 italic">
                New Protocol Code
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#FF4D00] transition-colors" />
                <Input
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret code"
                  required
                  className="pl-12 pr-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-2 focus:ring-[#FF4D00]/20 focus:border-[#FF4D00]/50 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <motion.div
                  className="space-y-4 pt-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#FF4D00] to-[#EB4898] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                      />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary italic">
                      {passwordStrength.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-4">
                    {[
                      { key: 'length', label: '8+ CHARS' },
                      { key: 'lowercase', label: 'LOWERCASE' },
                      { key: 'uppercase', label: 'UPPERCASE' },
                      { key: 'number', label: 'NUMBER' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className={cn(
                          "flex items-center gap-2 text-[9px] font-black tracking-widest transition-colors",
                          passwordStrength.checks[key as keyof typeof passwordStrength.checks]
                            ? 'text-[#EB4898]'
                            : 'text-white/10'
                        )}
                      >
                        {passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? (
                          <Check className="w-3 h-3" strokeWidth={3} />
                        ) : (
                          <X className="w-3 h-3" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 ml-1 italic">
                Verify Protocol
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#EB4898] transition-colors" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat secret code"
                  required
                  className={cn(
                    "pl-12 pr-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl focus:ring-2 transition-all font-semibold",
                    confirmPassword && (passwordsMatch ? 'focus:ring-[#EB4898]/20 focus:border-[#EB4898]/50' : 'focus:ring-red-500/20 border-red-500/30 focus:border-red-500')
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading || !passwordsMatch || passwordStrength.score < 4}
                className="w-full h-16 text-[12px] font-black uppercase italic tracking-[0.25em] bg-[#FF4D00] text-white rounded-2xl shadow-[0_15px_45px_rgba(255,77,0,0.3)] hover:brightness-110 active:scale-[0.96] transition-all relative overflow-hidden group disabled:opacity-30 disabled:pointer-events-none"
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ x: ['100%', '-100%'] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                />

                {loading ? (
                  <span className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  <span className="flex items-center gap-3 relative z-10">
                    <Sparkles className="w-5 h-5" />
                    Authorize Update
                  </span>
                )}
              </Button>
            </div>
          </form>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-10 text-white/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] italic">Nexus Security Standard E2E</span>
          <div className="w-1 h-1 rounded-full bg-white/20" />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
