// @ts-nocheck
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, Zap, Clock, Shield, Check, Crown, Star, FileText, X, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPriceMXN } from "@/utils/subscriptionPricing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { STORAGE } from "@/constants/app";
import { useState } from "react";

type TokenPackage = {
  id: number;
  name: string;
  tokens: number;
  price: number;
  pricePerToken: number;
  savings?: string;
  tier: 'starter' | 'standard' | 'premium';
  icon: typeof MessageCircle;
  duration_days: number;
  package_category: string;
  features: string[];
  legal_documents: number;
};

interface MessageActivationPackagesProps {
  isOpen?: boolean;
  onClose?: () => void;
  showAsPage?: boolean;
  userRole?: 'client' | 'owner' | 'admin';
}

export function MessageActivationPackages({ 
  isOpen = true, 
  onClose,
  showAsPage = false,
  userRole
}: MessageActivationPackagesProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [purchasedPackage, setPurchasedPackage] = useState<TokenPackage | null>(null);

  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !userRole,
  });

  const currentUserRole = userRole || userProfile?.role || 'client';
  const packageCategory = currentUserRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';
  
  const { data: packages, isLoading } = useQuery({
    queryKey: ['activation-packages', packageCategory],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_packages')
        .select('*')
        .eq('package_category', packageCategory)
        .eq('is_active', true)
        .order('price', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const convertPackages = (dbPackages: any[] | undefined): TokenPackage[] => {
    if (!dbPackages || dbPackages.length === 0) return [];

    return dbPackages.map((pkg, index) => {
      const tokenCount = pkg.message_activations || 0;
      const pricePerToken = tokenCount > 0 ? pkg.price / tokenCount : 0;

      const tierMap: ('starter' | 'standard' | 'premium')[] = ['starter', 'standard', 'premium'];
      const tier = tierMap[index] || 'starter';

      let savings: string | undefined;
      if (index > 0 && dbPackages[0]) {
        const firstTokens = dbPackages[0].message_activations || 1;
        const firstPricePerToken = dbPackages[0].price / firstTokens;
        const savingsPercent = Math.round(((firstPricePerToken - pricePerToken) / firstPricePerToken) * 100);
        if (savingsPercent > 0) savings = `Save ${savingsPercent}%`;
      }

      let features: string[] = [];
      try {
        features = Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || '[]');
      } catch {
        features = [];
      }

      if (features.length === 0) {
        features = [
          `${tokenCount} message tokens`,
          `${pkg.duration_days || 365}-day validity`,
          'Unlimited messages per chat',
        ];
        if (pkg.legal_documents_included > 0) {
          features.push(`${pkg.legal_documents_included} legal doc${pkg.legal_documents_included > 1 ? 's' : ''} included`);
        }
        if (tier === 'premium') features.push('Priority support');
      }

      const iconMap = { starter: MessageCircle, standard: Zap, premium: Crown };

      return {
        id: pkg.id,
        name: pkg.name,
        tokens: tokenCount,
        price: pkg.price,
        pricePerToken,
        savings,
        tier,
        icon: iconMap[tier],
        duration_days: pkg.duration_days || 365,
        package_category: pkg.package_category,
        features,
        legal_documents: pkg.legal_documents_included || 0,
      };
    });
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.tokens,
      price: pkg.price,
      package_category: pkg.package_category,
    }));
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${currentUserRole}/dashboard`);

    // Show success state
    setPurchasedPackage(pkg);

    // Save notification
    if (user?.id) {
      await supabase.from('notifications').insert([{
        user_id: user.id,
        notification_type: 'payment_received',
        title: '🎉 Tokens Selected!',
        message: `You selected the ${pkg.name} package with ${pkg.tokens} message tokens (${formatPriceMXN(pkg.price)}). Complete payment to activate!`,
        is_read: false
      }]);
    }

    toast({
      title: "🎉 Package Selected!",
      description: `${pkg.name} — ${pkg.tokens} tokens for ${formatPriceMXN(pkg.price)}. Complete PayPal payment to activate.`,
    });

    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('Tokens Selected!', {
        body: `${pkg.tokens} tokens (${formatPriceMXN(pkg.price)}) - Complete payment to start messaging`,
        icon: '/favicon.ico',
        tag: `activation-${pkg.id}`,
      });
      setTimeout(() => notification.close(), 5000);
    }
  };

  const packagesUI = convertPackages(packages);
  const roleLabel = currentUserRole === 'owner' ? 'Provider' : 'Explorer';
  const roleDescription = currentUserRole === 'owner'
    ? 'Connect with potential explorers interested in your listings'
    : 'Start conversations with providers about their listings';

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'starter':
        return {
          gradient: 'from-slate-800/60 to-slate-900/40',
          border: 'border-white/10 hover:border-white/20',
          badge: 'bg-slate-500/20 text-slate-300',
          button: 'bg-white/10 hover:bg-white/20 text-white border border-white/20',
          glow: '',
          tokenBg: 'bg-slate-800/50 border-slate-700/50',
          iconGlow: '',
        };
      case 'standard':
        return {
          gradient: 'from-primary/20 to-primary/5',
          border: 'border-primary/40 hover:border-primary/60 ring-1 ring-primary/20',
          badge: 'bg-primary/20 text-primary',
          button: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30',
          glow: 'shadow-xl shadow-primary/15',
          tokenBg: 'bg-primary/10 border-primary/30',
          iconGlow: 'drop-shadow-[0_0_12px_hsl(var(--primary)/0.5)]',
        };
      case 'premium':
        return {
          gradient: 'from-amber-500/15 to-orange-600/10',
          border: 'border-amber-500/30 hover:border-amber-400/50',
          badge: 'bg-amber-500/20 text-amber-400',
          button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30',
          glow: 'shadow-xl shadow-amber-500/10',
          tokenBg: 'bg-amber-500/10 border-amber-500/30',
          iconGlow: 'drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]',
        };
      default:
        return {
          gradient: 'from-muted/50 to-muted/30',
          border: 'border-border',
          badge: 'bg-muted text-muted-foreground',
          button: '',
          glow: '',
          tokenBg: 'bg-muted/30 border-border',
          iconGlow: '',
        };
    }
  };

  // Success state after purchase selection
  if (purchasedPackage) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative bg-gradient-to-br from-[#111] to-[#0A0A0A] rounded-3xl border border-white/10 p-8 max-w-md w-full text-center space-y-6 shadow-2xl"
        >
          {onClose && (
            <Button variant="ghost" size="icon" className="absolute right-3 top-3 text-white/50 hover:text-white" onClick={() => { setPurchasedPackage(null); onClose(); }}>
              <X className="w-5 h-5" />
            </Button>
          )}

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 400 }}
            className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-2xl shadow-primary/30"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Package Selected!</h2>
            <p className="text-white/60 text-sm">Complete payment to activate your tokens</p>
          </div>

          <div className="py-6 px-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-6xl font-bold text-white mb-2">{purchasedPackage.tokens}</div>
            <div className="text-sm text-white/60 font-medium">Message Tokens</div>
            <div className="mt-3 text-lg font-semibold text-primary">{formatPriceMXN(purchasedPackage.price)} MXN</div>
          </div>

          <div className="space-y-2 text-left">
            {purchasedPackage.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-white/80">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={() => {
                // PayPal integration placeholder
                toast({ title: "PayPal", description: "PayPal payment integration coming soon!" });
              }}
              className="w-full h-14 bg-[#0070BA] hover:bg-[#005A94] text-white font-bold text-base rounded-xl shadow-lg shadow-[#0070BA]/30"
              size="lg"
            >
              <span className="mr-2">Pay with</span>
              <span className="font-black tracking-tight">PayPal</span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => setPurchasedPackage(null)}
              className="w-full text-white/50 hover:text-white/80"
            >
              Choose another package
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const content = (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm"
        >
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-primary tracking-wide">{roleLabel} Tokens</span>
        </motion.div>
        
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
          Message Token Packages
        </h2>

        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          {roleDescription}. Each token unlocks a new conversation with unlimited messages.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-foreground/90 font-medium">New users get 3 FREE tokens!</span>
        </div>
      </motion.div>

      {/* Packages */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[420px] rounded-3xl bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : packagesUI.length === 0 ? (
        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No packages available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
          {packagesUI.map((pkg, index) => {
            const Icon = pkg.icon;
            const styles = getTierStyles(pkg.tier);
            const isPopular = pkg.tier === 'standard';
            
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12, type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="relative"
              >
                {/* Popular indicator */}
                {isPopular && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-3 left-1/2 -translate-x-1/2 z-10"
                  >
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-bold shadow-lg shadow-primary/30 border-0">
                      ⭐ BEST VALUE
                    </Badge>
                  </motion.div>
                )}

                <Card 
                  className={`relative h-full flex flex-col overflow-hidden rounded-3xl bg-gradient-to-br ${styles.gradient} ${styles.border} ${styles.glow} transition-all duration-300`}
                >
                  {/* Savings */}
                  {pkg.savings && !isPopular && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className={`${styles.badge} text-xs font-bold`}>{pkg.savings}</Badge>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center pb-2 ${isPopular ? 'pt-8' : 'pt-6'}`}>
                    <motion.div 
                      className={`mx-auto mb-4 p-4 rounded-2xl ${styles.badge} w-fit ${styles.iconGlow}`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 400 }}
                    >
                      <Icon className="w-8 h-8" />
                    </motion.div>
                    
                    <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                    
                    <div className="mt-3 space-y-1">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black text-foreground tracking-tight">{formatPriceMXN(pkg.price)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatPriceMXN(pkg.pricePerToken)} per token
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pt-3 pb-2">
                    {/* Token count hero */}
                    <div className={`text-center py-5 mb-5 rounded-2xl border ${styles.tokenBg}`}>
                      <motion.div 
                        className="text-5xl font-black text-foreground"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + index * 0.1, type: 'spring' }}
                      >
                        {pkg.tokens}
                      </motion.div>
                      <div className="text-sm text-muted-foreground font-semibold mt-1 tracking-wide uppercase">
                        Tokens
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5">
                      {pkg.features.map((feature, i) => (
                        <div key={i} className="flex items-center gap-2.5 text-sm">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-400" />
                          </div>
                          <span className="text-foreground/80">{feature}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Shield className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-foreground/80">Secure PayPal payment</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 pb-6 px-5">
                    <Button
                      onClick={() => handlePurchase(pkg)}
                      className={`w-full h-13 font-bold text-base rounded-xl transition-all duration-200 ${styles.button}`}
                      size="lg"
                    >
                      {isPopular ? 'Get Best Value' : 'Buy Now'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Trust footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap items-center justify-center gap-8 pt-6 border-t border-border/30"
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Shield className="w-4 h-4 text-green-500" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-primary" />
          <span>Instant Activation</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>No Hidden Fees</span>
        </div>
      </motion.div>
    </div>
  );

  if (showAsPage) return content;
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed inset-x-2 sm:inset-x-4 top-[3%] sm:top-[5%] bottom-[3%] sm:bottom-[5%] z-[100] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative bg-background rounded-3xl border border-white/10 shadow-2xl max-w-5xl mx-auto">
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 z-10 text-muted-foreground hover:text-foreground rounded-full"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
            {content}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
