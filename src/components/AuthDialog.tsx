import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Eye, EyeOff, Mail, Lock, User, ArrowLeft, Loader,
  Check, X, Shield, Sparkles
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { notifications } from '@/utils/notifications';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FaGoogle } from 'react-icons/fa';
import { loginSchema, signupSchema, forgotPasswordSchema } from '@/schemas/auth';
import { Capacitor } from '@capacitor/core';
import StarFieldBackground from './StarFieldBackground';

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'client' | 'owner';
}

const getStorageKey = (role: 'client' | 'owner', field: string) => `auth_${role}_${field}`;

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

export function AuthDialog({ isOpen, onClose, role }: AuthDialogProps) {
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

  // Check if running on a native platform (iOS/Android)
  const isNativePlatform = Capacitor.isNativePlatform();

  // Role-specific theming - Clean minimal style
  const roleTheme = useMemo(() => ({
    client: {
      accent: 'text-orange-400',
    },
    owner: {
      accent: 'text-orange-400',
    },
  }), []);

  const theme = roleTheme[role];

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  // Reset form state when role changes and load remembered credentials
  useEffect(() => {
    if (isOpen) {
      const rememberedEmail = localStorage.getItem(getStorageKey(role, 'email')) || '';
      const hasRemembered = !!rememberedEmail;

      setEmail(rememberedEmail);
      setPassword('');
      setRememberMe(hasRemembered);
      setName('');
      setIsLogin(true);
      setIsForgotPassword(false);
      setShowPassword(false);
      setShowResendConfirmation(false);
    }
  }, [isOpen, role]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validated = forgotPasswordSchema.parse({ email });

      const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      notifications.app.updateAvailable(); // Using info notification
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
        variant: "info",
      });

      setIsForgotPassword(false);
      setEmail('');
    } catch (error: any) {
      if (error.errors) {
        notifications.auth.invalidEmail();
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to send reset email.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast({
        title: "Confirmation Email Sent",
        description: "Please check your inbox and verify your email.",
      });

      setShowResendConfirmation(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend confirmation email.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isForgotPassword) {
      return handleForgotPassword(e);
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const validated = loginSchema.parse({ email, password });
        const { error } = await signIn(validated.email, validated.password, role);
        if (!error) {
          if (rememberMe) {
            localStorage.setItem(getStorageKey(role, 'email'), validated.email);
          } else {
            localStorage.removeItem(getStorageKey(role, 'email'));
          }
          onClose();
        } else {
          throw error;
        }
      } else {
        if (!agreeToTerms) {
          toast({
            title: "Terms Required",
            description: "Please agree to the terms and conditions to continue.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const validated = signupSchema.parse({ name, email, password });
        const { error } = await signUp(validated.email, validated.password, role, validated.name);
        if (!error) {
          localStorage.removeItem(getStorageKey(role, 'email'));
          localStorage.removeItem(getStorageKey(role, 'password'));
          onClose();
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      // Capture full error details for debugging
      const errorInfo = {
        message: error.message || 'Unknown error',
        code: error.code || error.status || 'N/A',
        stack: error.stack,
        fullError: JSON.stringify(error, null, 2),
        timestamp: new Date().toISOString(),
        action: isLogin ? 'Sign In' : 'Sign Up',
        role: role
      };

      // Log to console for debugging
      console.error('🚨 AUTH ERROR:', errorInfo);
      setErrorDetails(errorInfo);

      if (error.errors) {
        toast({
          title: "Validation Error",
          description: error.errors[0]?.message || "Please check your input.",
          variant: "destructive",
          action: (
            <button
              onClick={() => setShowErrorDetails(true)}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              View Details
            </button>
          ),
        });
      } else {
        // Check if error is related to email confirmation
        if (error.message?.toLowerCase().includes('email not confirmed')) {
          setShowResendConfirmation(true);
          toast({
            title: "Email Not Confirmed",
            description: "Please verify your email address. Check your inbox or click 'Resend confirmation email' below.",
            variant: "destructive",
            action: (
              <button
                onClick={() => setShowErrorDetails(true)}
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                View Details
              </button>
            ),
          });
        } else {
          // Enhanced error message with suggestions
          let errorMessage = error.message || "Authentication failed.";
          let suggestion = "";

          if (error.message?.toLowerCase().includes('database')) {
            suggestion = "Database issue detected. Please contact support.";
          } else if (error.message?.toLowerCase().includes('network')) {
            suggestion = "Network error. Check your connection and try again.";
          } else if (error.message?.toLowerCase().includes('invalid')) {
            suggestion = "Check your email and password are correct.";
          }

          toast({
            title: `${isLogin ? 'Sign In' : 'Sign Up'} Failed`,
            description: (
              <div className="space-y-2">
                <p className="font-medium">{errorMessage}</p>
                {suggestion && <p className="text-xs opacity-80">{suggestion}</p>}
                <button
                  onClick={() => setShowErrorDetails(true)}
                  className="text-xs underline opacity-80 hover:opacity-100 flex items-center gap-1"
                >
                  <Shield className="w-3 h-3" />
                  Click here to see technical details
                </button>
              </div>
            ),
            variant: "destructive",
            duration: 10000, // Show for 10 seconds
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (e: React.MouseEvent<HTMLButtonElement>, provider: 'google') => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    try {
      const { error } = await signInWithOAuth(provider, role);

      if (error) throw error;
    } catch (error: any) {
      // Capture OAuth error details
      const errorInfo = {
        message: error.message || 'OAuth sign-in failed',
        code: error.code || error.status || 'N/A',
        stack: error.stack,
        fullError: JSON.stringify(error, null, 2),
        timestamp: new Date().toISOString(),
        action: 'OAuth Sign In',
        provider: provider,
        role: role
      };

      console.error('🚨 OAUTH ERROR:', errorInfo);
      setErrorDetails(errorInfo);

      toast({
        title: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Sign-In Failed`,
        description: (
          <div className="space-y-2">
            <p className="font-medium">{error.message || 'Failed to sign in with Google'}</p>
            <button
              onClick={() => setShowErrorDetails(true)}
              className="text-xs underline opacity-80 hover:opacity-100 flex items-center gap-1"
            >
              <Shield className="w-3 h-3" />
              Click here to see technical details
            </button>
          </div>
        ),
        variant: "destructive",
        duration: 10000,
      });

      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={onClose}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm animate-fade-in" />
        <DialogPrimitive.Content className="fixed inset-0 z-50 w-full h-full overflow-hidden bg-black">

          {/* Star field background */}
          <StarFieldBackground />

          {/* Animated smoky background effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/4 rounded-full blur-3xl animate-float-slower" />
            <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-orange-600/3 rounded-full blur-3xl animate-float-slowest" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-300/4 rounded-full blur-3xl animate-float-medium" />
          </div>

          {/* Single-screen layout - no scrolling */}
          <div className="h-full flex flex-col justify-center p-4 sm:p-5 relative z-10 safe-area-pt safe-area-pb">
            {/* Back Button - Top Left Only */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 safe-area-pt text-white/60 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-300 active:scale-95 z-20"
            >
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="w-full max-w-sm mx-auto animate-fade-in">
              <DialogTitle className="sr-only">
                {isLogin ? 'Sign In' : 'Sign Up'} as {role}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {isLogin ? 'Sign in to your account' : 'Create a new account'}
              </DialogDescription>

              {/* Centered Minimal Header */}
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-white">
                  {isForgotPassword ? 'Reset Password' : isLogin ? 'Welcome to Swipess' : 'Create account'}
                </h2>
              </div>

              {/* Main Card - Compact design */}
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-5">
                {!isForgotPassword && !isNativePlatform && (
                  <>
                    {/* Google OAuth Button */}
                    <Button
                      type="button"
                      onClick={(e) => handleOAuthSignIn(e, 'google')}
                      disabled={isLoading}
                      variant="outline"
                      className="w-full h-11 border border-white/10 bg-white/[0.02] font-semibold text-sm text-white hover:bg-white/[0.05] hover:border-white/20 transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <FaGoogle className="w-4 h-4 mr-2 text-white" />
                          Continue with Google
                        </>
                      )}
                    </Button>

                    {/* Compact Divider */}
                    <div className="relative flex items-center my-4">
                      <div className="flex-grow border-t border-white/10"></div>
                      <span className="flex-shrink mx-3 text-white/30 text-xs font-medium">or</span>
                      <div className="flex-grow border-t border-white/10"></div>
                    </div>
                  </>
                )}

                {/* Compact Form */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Name Field (Sign Up Only) */}
                  {!isLogin && !isForgotPassword && (
                    <div className="relative group">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-400 transition-colors" />
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="pl-10 h-11 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/30"
                        placeholder="Full Name"
                      />
                    </div>
                  )}

                  {/* Email Field */}
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-400 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-11 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/30"
                      placeholder="Email"
                    />
                  </div>

                  {/* Password Field */}
                  {!isForgotPassword && (
                    <div>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-orange-400 transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="pl-10 pr-10 h-11 text-sm bg-white/[0.03] border border-white/10 rounded-lg text-white placeholder:text-white/30"
                          placeholder="Password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* Compact Password Strength Indicator (Sign Up Only) */}
                      {!isLogin && password && (
                        <div className="mt-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${passwordStrength.color} rounded-full transition-all duration-300`}
                                style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                              />
                            </div>
                            <span className={`text-[10px] font-medium ${
                              passwordStrength.score <= 1 ? 'text-red-400' :
                              passwordStrength.score === 2 ? 'text-orange-400' :
                              passwordStrength.score === 3 ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compact Terms (Sign Up Only) */}
                  {!isLogin && !isForgotPassword && (
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={agreeToTerms}
                          onChange={(e) => setAgreeToTerms(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-4 h-4 rounded border-2 border-white/30 bg-white/5 peer-checked:bg-orange-500 peer-checked:border-transparent transition-all flex items-center justify-center">
                          {agreeToTerms && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <span className="text-xs text-white/50">
                        I agree to the{' '}
                        <a href="/terms-of-service" target="_blank" className={`${theme.accent} underline`}>Terms</a>
                        {' & '}
                        <a href="/privacy-policy" target="_blank" className={`${theme.accent} underline`}>Privacy</a>
                      </span>
                    </label>
                  )}

                  {/* Remember Me & Forgot Password */}
                  {isLogin && !isForgotPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-4 h-4 rounded border-2 border-white/30 bg-white/5 peer-checked:bg-orange-500 peer-checked:border-transparent transition-all flex items-center justify-center">
                              {rememberMe && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                          </div>
                          <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">Remember me</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsForgotPassword(true)}
                          className={`text-sm ${theme.accent} hover:underline font-medium`}
                        >
                          Forgot password?
                        </button>
                      </div>
                      {showResendConfirmation && (
                        <button
                          type="button"
                          onClick={handleResendConfirmation}
                          disabled={isLoading}
                          className="w-full text-sm text-orange-400 hover:text-orange-300 font-medium text-center py-1"
                        >
                          Resend confirmation email
                        </button>
                      )}
                    </div>
                  )}

                  {/* Compact Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 text-sm font-bold bg-gradient-to-r from-orange-500 via-red-500 to-rose-500 text-white transition-all mt-2 hover:opacity-90"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Please wait...
                      </>
                    ) : (
                      <span className="flex items-center gap-2">
                        {isForgotPassword ? 'Send Reset Link' : isLogin ? 'Sign In' : 'Create Account'}
                      </span>
                    )}
                  </Button>
                </form>

                {/* Compact Toggle */}
                <div className="text-center mt-4">
                  {isForgotPassword ? (
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(false); setEmail(''); }}
                      className="text-xs text-white/50 hover:text-white transition-colors flex items-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Back to Sign In
                    </button>
                  ) : (
                    <p className="text-xs text-white/50">
                      {isLogin ? "Don't have an account? " : "Already have an account? "}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(!isLogin);
                          setEmail('');
                          setPassword('');
                          setName('');
                          setShowPassword(false);
                          setAgreeToTerms(false);
                        }}
                        className={`${theme.accent} hover:underline font-semibold`}
                      >
                        {isLogin ? 'Sign Up' : 'Sign In'}
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>

          {/* Error Details Modal */}
          {showErrorDetails && errorDetails && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className="bg-zinc-900 border border-red-500/20 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl">
                {/* Header */}
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
                  <button
                    onClick={() => setShowErrorDetails(false)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)] space-y-4">
                  {/* Main Error */}
                  <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-red-400 mb-1">Error Message</h4>
                        <p className="text-sm text-white font-mono break-words">{errorDetails.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Error Code */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-white/60 mb-1">Error Code</p>
                      <p className="text-sm text-white font-mono">{errorDetails.code}</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <p className="text-xs text-white/60 mb-1">Action</p>
                      <p className="text-sm text-white">{errorDetails.action} as {errorDetails.role}</p>
                    </div>
                  </div>

                  {/* Full Error Object */}
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-white/80">Technical Details (for support)</h4>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
                          toast({
                            title: "Copied!",
                            description: "Error details copied to clipboard",
                          });
                        }}
                        className="text-xs text-orange-400 hover:text-orange-300 underline flex items-center gap-1"
                      >
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="text-xs text-white/70 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                      {errorDetails.fullError}
                    </pre>
                  </div>

                  {/* Helpful Tips */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Troubleshooting Tips
                    </h4>
                    <ul className="text-xs text-white/80 space-y-1.5 list-disc list-inside">
                      <li>Check your internet connection</li>
                      <li>Ensure your email and password are correct</li>
                      <li>Try refreshing the page and signing up again</li>
                      <li>Check browser console (F12) for additional errors</li>
                      <li>Contact support with the error code above</li>
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 px-6 py-4 flex gap-3">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
                      toast({
                        title: "Copied!",
                        description: "Error details copied to clipboard. Share this with support.",
                      });
                    }}
                    variant="outline"
                    className="flex-1 border-white/10 hover:bg-white/5"
                  >
                    Copy Error
                  </Button>
                  <Button
                    onClick={() => setShowErrorDetails(false)}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
