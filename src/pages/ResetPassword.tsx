import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Eye, EyeOff, Flame, Check, X, Shield, KeyRound, ArrowLeft } from "lucide-react";

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
    color: score <= 1 ? 'bg-red-500' : score === 2 ? 'bg-orange-500' : score === 3 ? 'bg-yellow-500' : 'bg-green-500',
  };
};

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
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
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
        title: "Password updated successfully",
        description: "You can now log in with your new password.",
      });

      // Redirect to home page after 2 seconds
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Error updating password",
        description: error.message || "Please try again or request a new reset link.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Floating fire particles component
  const FireParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            width: `${2 + Math.random() * 4}px`,
            height: `${4 + Math.random() * 8}px`,
            background: `linear-gradient(45deg, ${
              i % 3 === 0 ? '#f97316' : i % 3 === 1 ? '#fbbf24' : '#ea580c'
            }, transparent)`,
            boxShadow: `0 0 ${8 + Math.random() * 16}px ${
              i % 3 === 0 ? '#f97316' : '#fbbf24'
            }60`,
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            bottom: '-10px',
          }}
          animate={{
            y: [0, -(window.innerHeight * 0.8 + Math.random() * 200)],
            x: [0, (Math.random() - 0.5) * 100],
            opacity: [0, 0.8, 0.6, 0],
            scale: [0.3, 1, 0.8, 0.2],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 4,
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900 p-4 relative overflow-hidden">
      <FireParticles />

      {/* Ambient glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        {/* Back Button */}
        <motion.button
          onClick={() => navigate("/")}
          className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors group"
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-sm font-medium">Back to Home</span>
        </motion.button>

        {/* Logo and Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-3xl mb-5 shadow-[0_0_60px_rgba(251,146,60,0.3)]"
            animate={{
              boxShadow: [
                '0 0 40px rgba(251,146,60,0.3)',
                '0 0 60px rgba(251,146,60,0.5)',
                '0 0 40px rgba(251,146,60,0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <KeyRound className="w-10 h-10 text-white drop-shadow-lg" />
            </motion.div>
          </motion.div>

          <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
          <p className="text-white/60">
            Create a strong, secure password for your account
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div
          className="bg-white/5 backdrop-blur-2xl border border-amber-500/30 rounded-3xl p-8 shadow-[0_0_60px_rgba(251,146,60,0.2)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleResetPassword} className="space-y-5">
            {/* New Password Field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Label htmlFor="password" className="text-sm font-medium text-white/80">
                New Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-white/70 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  disabled={loading}
                  className="pl-12 pr-12 h-14 text-base bg-white/5 border-white/20 text-white placeholder:text-white/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <motion.div
                  className="space-y-3 pt-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {/* Strength Bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full ${passwordStrength.color} rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.score <= 1 ? 'text-red-400' :
                      passwordStrength.score === 2 ? 'text-orange-400' :
                      passwordStrength.score === 3 ? 'text-yellow-400' : 'text-green-400'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>

                  {/* Requirements Checklist */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'length', label: '8+ characters' },
                      { key: 'lowercase', label: 'Lowercase' },
                      { key: 'uppercase', label: 'Uppercase' },
                      { key: 'number', label: 'Number' },
                    ].map(({ key, label }) => (
                      <div
                        key={key}
                        className={`flex items-center gap-2 text-xs ${
                          passwordStrength.checks[key as keyof typeof passwordStrength.checks]
                            ? 'text-green-400'
                            : 'text-white/40'
                        }`}
                      >
                        {passwordStrength.checks[key as keyof typeof passwordStrength.checks] ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Confirm Password Field */}
            <motion.div
              className="space-y-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-white/80">
                Confirm Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-white/70 transition-colors" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  disabled={loading}
                  className={`pl-12 pr-12 h-14 text-base bg-white/5 border-white/20 text-white placeholder:text-white/30 ${
                    confirmPassword && (passwordsMatch ? 'border-green-500/50' : 'border-red-500/50')
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password match indicator */}
              {confirmPassword && (
                <motion.div
                  className={`flex items-center gap-2 text-xs ${passwordsMatch ? 'text-green-400' : 'text-red-400'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {passwordsMatch ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3.5 h-3.5" />
                      <span>Passwords do not match</span>
                    </>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Button
                type="submit"
                disabled={loading || !passwordsMatch || passwordStrength.score < 4}
                className="w-full h-14 text-base font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white shadow-lg hover:shadow-[0_8px_32px_rgba(251,146,60,0.4)] transition-all mt-4 relative overflow-hidden group disabled:opacity-50"
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                  animate={{ x: ['100%', '-100%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                />

                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    <Shield className="w-5 h-5" />
                    Update Password
                  </span>
                )}
              </Button>
            </motion.div>
          </form>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          className="flex items-center justify-center gap-2 mt-6 text-white/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Shield className="w-4 h-4" />
          <span className="text-xs">Your password is encrypted and secure</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
