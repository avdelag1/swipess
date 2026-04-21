import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, Zap, Clock, Shield, Check, Crown, Star, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPriceMXN } from "@/utils/subscriptionPricing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { STORAGE } from "@/constants/app";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { NativeBridge } from "@/utils/nativeBridge";

type TokenPackage = {
  id: number;
  appleProductId?: string;
  name: string;
  tokens: number;
  price: number;
  pricePerToken: number;
  savings?: string;
  tier: 'starter' | 'standard' | 'premium';
  icon: typeof MessageCircle;
  duration_days: number;
  package_category: string;
  paypalUrl: string;
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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
        .order('message_activations', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const convertPackages = (dbPackages: any[] | undefined): TokenPackage[] => {
    if (!dbPackages || dbPackages.length === 0) return [];

    return dbPackages.map((pkg, index) => {
      const tokens = pkg.message_activations || pkg.tokens || 0;
      const pricePerToken = tokens > 0 ? pkg.price / tokens : 0;

      const _tierMap: ('starter' | 'standard' | 'premium')[] = ['starter', 'standard', 'premium'];
      let tier: 'starter' | 'standard' | 'premium' = 'starter';

      const dbTier = pkg.tier?.toLowerCase();
      if (dbTier === 'premium' || tokens >= 15) tier = 'premium';
      else if (dbTier === 'standard' || tokens >= 10) tier = 'standard';
      else tier = 'starter';

      let savings: string | undefined;
      if (index > 0 && dbPackages[0]) {
        const firstTokens = dbPackages[0].message_activations || dbPackages[0].tokens || 1;
        const firstPricePerToken = dbPackages[0].price / firstTokens;
        const savingsPercent = Math.round(((firstPricePerToken - pricePerToken) / firstPricePerToken) * 100);
        if (savingsPercent > 0) savings = `Save ${savingsPercent}%`;
      }

      let features: string[] = [];
      try {
        features = Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || '[]');
      } catch {
        features = [`${tokens} tokens`, `${pkg.duration_days || 30} days validity`];
      }

      const iconMap = { starter: MessageCircle, standard: Zap, premium: Crown };

      return {
        id: pkg.id,
        appleProductId: `nexus.tokens.${tokens}`,
        name: pkg.name || (tier.charAt(0).toUpperCase() + tier.slice(1)),
        tokens,
        price: pkg.price,
        pricePerToken,
        savings,
        tier,
        icon: iconMap[tier],
        duration_days: pkg.duration_days || 30,
        package_category: pkg.package_category,
        paypalUrl: pkg.paypal_link || '',
        features,
        legal_documents: pkg.legal_documents_included || 0,
      };
    }).sort((a, b) => a.tokens - b.tokens);
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    sessionStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.tokens,
      price: pkg.price,
      package_category: pkg.package_category,
    }));
    sessionStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${currentUserRole}/dashboard`);

    if (NativeBridge.isIOS()) {
      toast({ title: "In-App Purchase", description: "Connecting to App Store..." });
      const result = await NativeBridge.purchaseProduct(pkg.appleProductId || '');
      if (result.success) {
        toast({ title: "Success", description: "Tokens activated!" });
        onClose?.();
      } else {
        toast({ title: "Purchase Cancelled", description: "Transaction failed or was cancelled.", variant: "destructive" });
      }
      return;
    }

    if (pkg.paypalUrl) {
      window.open(pkg.paypalUrl, '_blank');
      toast({
        title: "Redirecting to Payment",
        description: `Processing ${pkg.name} package (${formatPriceMXN(pkg.price)})`,
      });

      if (user?.id) {
        await supabase.from('notifications').insert([{
          user_id: user.id,
          notification_type: 'payment',
          title: 'Tokens Selected!',
          message: `You selected the ${pkg.name} package with ${pkg.tokens} tokens (${formatPriceMXN(pkg.price)}). Complete payment to activate!`,
          is_read: false
        }]).then(() => { }, () => { });
      }
    } else {
      toast({
        title: "Payment link unavailable",
        description: "Please contact support to complete this purchase.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = () => {
    toast({ title: "Restoring Purchases", description: "Checking your Apple ID for recent token activations..." });
    setTimeout(() => toast({ title: "Done", description: "All active tokens have been restored." }), 1500);
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
          gradient: 'from-slate-500/5 to-transparent',
          border: isDark ? 'border-white/10' : 'border-gray-200',
          badge: isDark ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 text-slate-700',
          button: isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-900 hover:bg-black text-white',
          glow: '',
          cardClass: 'ram-card',
        };
      case 'standard':
        return {
          gradient: 'from-blue-600/5 to-transparent',
          border: 'border-blue-500',
          badge: isDark ? 'bg-blue-500/30 text-blue-200' : 'bg-blue-50 text-blue-700 font-black',
          button: 'bg-blue-600 hover:bg-blue-500 text-white shadow-ram-button',
          glow: 'active', // triggers .ram-card.active styles
          cardClass: 'ram-card',
        };
      case 'premium':
        return {
          gradient: 'from-amber-500/10 to-transparent',
          border: isDark ? 'border-amber-500/50' : 'border-amber-200',
          badge: isDark ? 'bg-amber-500/20 text-amber-200' : 'bg-amber-50 text-amber-700',
          button: isDark ? 'premium-btn-wow' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg',
          glow: '',
          cardClass: 'ram-card',
        };
      default:
        return {
          gradient: 'from-muted/50 to-muted/30',
          border: 'border-border',
          badge: 'bg-muted text-muted-foreground',
          button: '',
          glow: '',
          cardClass: '',
        };
    }
  };

  const content = (
    <div className={cn("space-y-6 p-4 sm:p-8 rounded-2xl overflow-hidden relative", isDark ? "bg-[#050505]" : "bg-white shadow-xl border border-gray-100")}>
      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 relative z-10"
      >
        <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md", isDark ? "bg-white/5 border-white/10 shadow-xl" : "bg-gray-50 border-gray-200 shadow-sm")}>
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className={cn("text-xs font-bold tracking-wider uppercase", isDark ? "text-white/90" : "text-gray-900")}>{roleLabel} Privilege</span>
        </div>

        <h2 className={cn("text-3xl sm:text-4xl font-black tracking-tighter", isDark ? "text-white" : "text-gray-900")}>
          Elevate Your <span className="luxury-text-gradient">Experience</span>
        </h2>

        <p className={cn("text-sm max-w-lg mx-auto font-medium", isDark ? "text-white/60" : "text-gray-600")}>
          {roleDescription}. Choose the package that suits your goals.
        </p>

        <div className="flex items-center justify-center gap-2">
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-amber-500/50" />
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>New Member Bonus: 3 Tokens Included</span>
          </div>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-amber-500/50" />
        </div>
      </motion.div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("h-[450px] rounded-3xl animate-pulse border", isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200")} />
          ))}
        </div>
      ) : packagesUI.length === 0 ? (
        <div className={cn("text-center py-16 rounded-3xl border", isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
          <p className={cn("text-lg font-medium", isDark ? "text-white/40" : "text-gray-500")}>No premium packages available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
          {packagesUI.map((pkg, index) => {
            const Icon = pkg.icon;
            const styles = getTierStyles(pkg.tier);
            const isPremium = pkg.tier === 'premium';
            const isStandard = pkg.tier === 'standard';

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.15,
                  type: 'spring',
                  stiffness: 100,
                  damping: 20
                }}
                className="h-full"
              >
                <Card
                  className={cn("relative h-full flex flex-col transition-all duration-500 group", styles.cardClass, styles.glow)}
                >
                  {isPremium && <div className="premium-shine-overlay" />}

                  {isStandard && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                      <Badge className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white/10 uppercase tracking-tighter">
                        Most Popular Choice
                      </Badge>
                    </div>
                  )}

                  {pkg.savings && isPremium && (
                    <div className="absolute top-6 right-6 z-20">
                      <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md">
                        {pkg.savings} Best Value
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={`text-center space-y-4 pb-2 px-8 ${isStandard ? 'pt-10' : 'pt-8'}`}>
                    <div className={`mx-auto p-4 rounded-3xl ${styles.badge} w-fit shadow-inner ${isPremium ? 'premium-crown-pulse' : ''}`}>
                      <Icon className={`w-8 h-8 ${isPremium ? 'text-amber-400' : ''}`} />
                    </div>

                    <div className="space-y-1">
                      <h3 className={cn("text-xl font-black tracking-tighter uppercase", isPremium ? 'luxury-text-gradient' : isDark ? 'text-white' : 'text-gray-900')}>
                        {pkg.name}
                      </h3>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className={cn("text-4xl font-black italic tracking-tighter", isDark ? "text-white" : "text-gray-900")}>
                          {formatPriceMXN(pkg.price)}
                        </span>
                        <span className={cn("text-xs font-bold", isDark ? "text-white/40" : "text-gray-500")}>MXN</span>
                      </div>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-white/40" : "text-gray-500")}>
                        {formatPriceMXN(pkg.pricePerToken)} per connection
                      </p>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 px-8 py-6 space-y-6">
                    {/* Tokens Display */}
                    <div className={cn("text-center py-6 rounded-3xl border shadow-inner transition-transform duration-500 group-hover:scale-[1.03]", isDark ? "bg-black/40 border-white/5" : "bg-gray-50 border-gray-100")}>
                      <div className={cn("text-5xl font-black tracking-tighter mb-1", isDark ? "text-white" : "text-gray-900")}>{pkg.tokens}</div>
                      <div className={cn("text-xs font-black uppercase tracking-[0.2em]", isDark ? "text-white/30" : "text-gray-400")}>Activations</div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                      {pkg.features.map((feature, i) => (
                        <Feature key={i} text={feature} isPremium={isPremium} />
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="pb-8 px-8">
                    <Button
                      onClick={() => handlePurchase(pkg)}
                      className={`w-full h-14 rounded-2xl text-base font-black uppercase tracking-tighter transition-all duration-300 ${styles.button}`}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z" />
                      </svg>
                      Secure Purchase
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Trust Badges & Restore */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className={cn("flex flex-col items-center gap-6 pt-8 relative z-10 border-t", isDark ? "border-white/5" : "border-gray-200")}
      >
        <button 
          onClick={handleRestore}
          className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5" />
          Restore Previous Activations
        </button>

        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4 text-rose-500" />
            </div>
            <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-white/50" : "text-gray-500")}>Bank-Level Security</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-white/50" : "text-gray-500")}>Instant Activation</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-white/50" : "text-gray-500")}>Elite Support 24/7</span>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (showAsPage) return <div className={cn("min-h-screen", isDark ? "bg-black" : "bg-gray-50")}>{content}</div>;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn("absolute inset-0 backdrop-blur-xl", isDark ? "bg-black/90" : "bg-white/95")}
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative z-[110] w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className={cn("relative rounded-[2rem] border overflow-hidden", isDark ? "bg-[#050505] border-white/10 shadow-[0_0_100px_rgba(0,0,0,1)]" : "bg-white border-gray-200 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]")}>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className={cn("absolute right-4 top-4 z-[120] rounded-full border transition-all hover:rotate-90", isDark ? "bg-white/5 hover:bg-white/10 text-white border-white/10" : "bg-gray-100 hover:bg-gray-200 text-gray-900 border-gray-200")}
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          {content}
        </div>
      </motion.div>
    </div>
  );
}

function Feature({ text, isPremium }: { text: string; isPremium?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-3 text-xs group">
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${isPremium
        ? 'bg-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
        : 'bg-rose-500/10'
        }`}>
        <Check className={`w-3 h-3 ${isPremium ? 'text-amber-500' : 'text-rose-500'}`} />
      </div>
      <span className={cn("font-bold transition-colors", isDark ? "text-white/70 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900")}>{text}</span>
    </div>
  );
}


