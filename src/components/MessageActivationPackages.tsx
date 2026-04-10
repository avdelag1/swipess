import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, Zap, Clock, Shield, Check, Crown, Star, X, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPriceMXN } from "@/utils/subscriptionPricing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { STORAGE } from "@/constants/app";
import { useTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";
import { useAppNavigate } from "@/hooks/useAppNavigate";

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
  paypalUrl: string;
  features: string[];
  legal_documents: number;
  bestValue?: boolean;
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
  const { navigate } = useAppNavigate();

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

    const sorted = dbPackages.map((pkg, index) => {
      const tokens = pkg.message_activations || pkg.tokens || 0;
      const pricePerToken = tokens > 0 ? pkg.price / tokens : 0;

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
        bestValue: false,
      };
    }).sort((a, b) => a.tokens - b.tokens);

    // Mark the one with the lowest pricePerToken as best value
    if (sorted.length > 1) {
      let bestIdx = 0;
      sorted.forEach((p, i) => {
        if (p.pricePerToken < sorted[bestIdx].pricePerToken) bestIdx = i;
      });
      sorted[bestIdx].bestValue = true;
    }

    return sorted;
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    sessionStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.tokens,
      price: pkg.price,
      package_category: pkg.package_category,
    }));
    sessionStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${currentUserRole}/dashboard`);

    if (pkg.paypalUrl) {
      window.open(pkg.paypalUrl, '_blank');
      toast({
        title: "Redirecting to PayPal",
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

  const packagesUI = convertPackages(packages);
  const roleLabel = currentUserRole === 'owner' ? 'Owner' : 'Client';

  // ─── COMPACT POPOVER VIEW (used in TopBar) ────────────────────────────────
  if (!showAsPage) {
    if (!isOpen) return null;

    return (
      <div className={cn("p-4 space-y-3 min-w-[300px]", isDark ? "text-white" : "text-gray-900")}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className={cn("text-base font-bold", isDark ? "text-white" : "text-gray-900")}>Token Packages</h3>
            <p className={cn("text-xs mt-0.5", isDark ? "text-white/50" : "text-gray-500")}>
              Start conversations with {currentUserRole === 'owner' ? 'Clients' : 'Owners'}
            </p>
          </div>
          <Badge variant="outline" className={cn(
            "text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5",
            isDark ? "border-white/20 text-white/60" : "border-gray-300 text-gray-500"
          )}>
            {roleLabel}
          </Badge>
        </div>

        {/* Package rows */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn("h-16 rounded-2xl animate-pulse", isDark ? "bg-white/5" : "bg-gray-100")} />
            ))}
          </div>
        ) : packagesUI.length === 0 ? (
          <div className={cn("text-center py-6 rounded-2xl", isDark ? "bg-white/5" : "bg-gray-50")}>
            <p className={cn("text-sm", isDark ? "text-white/40" : "text-gray-400")}>No packages available</p>
          </div>
        ) : (
          <div className="space-y-2">
            {packagesUI.map((pkg, index) => {
              const Icon = pkg.icon;
              const isStarter = pkg.tier === 'starter';
              const isStandard = pkg.tier === 'standard';
              const isPremium = pkg.tier === 'premium';

              // Tier-specific accent colors
              const accentColor = isPremium
                ? { bg: isDark ? 'bg-purple-500/15' : 'bg-purple-50', icon: 'text-purple-400', border: isDark ? 'border-purple-500/30' : 'border-purple-200', ring: isDark ? 'ring-purple-500/20' : 'ring-purple-100' }
                : isStandard
                  ? { bg: isDark ? 'bg-blue-500/15' : 'bg-blue-50', icon: 'text-blue-400', border: isDark ? 'border-blue-500/30' : 'border-blue-200', ring: isDark ? 'ring-blue-500/20' : 'ring-blue-100' }
                  : { bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50', icon: 'text-rose-400', border: isDark ? 'border-white/10' : 'border-gray-200', ring: '' };

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.07 }}
                >
                  <div className={cn(
                    "relative flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200",
                    "hover:scale-[1.02] active:scale-[0.98]",
                    accentColor.border,
                    pkg.bestValue ? `ring-1 ${accentColor.ring}` : '',
                    isDark ? "bg-white/[0.03]" : "bg-white"
                  )}>
                    {/* Best value badge */}
                    {pkg.bestValue && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-lg border-0">
                          Best Value
                        </Badge>
                      </div>
                    )}

                    {/* Icon */}
                    <div className={cn("flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", accentColor.bg)}>
                      <Icon className={cn("w-5 h-5", accentColor.icon)} strokeWidth={1.8} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-sm font-bold", isDark ? "text-white" : "text-gray-900")}>{pkg.name}</span>
                        <span className={cn("text-xs", isDark ? "text-white/40" : "text-gray-400")}>{pkg.tokens} tokens</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className={cn("text-lg font-black tracking-tight", isDark ? "text-white" : "text-gray-900")}>
                          ${pkg.price}
                        </span>
                        <span className={cn("text-[10px]", isDark ? "text-white/35" : "text-gray-400")}>
                          (${pkg.pricePerToken.toFixed(1)}/ea)
                        </span>
                      </div>
                    </div>

                    {/* Buy button */}
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(pkg)}
                      className={cn(
                        "flex-shrink-0 h-9 px-3 rounded-xl font-bold text-xs gap-1.5 transition-all",
                        isPremium
                          ? "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-lg shadow-purple-500/25"
                          : isStandard
                            ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25"
                            : isDark
                              ? "bg-white/10 hover:bg-white/15 text-white"
                              : "bg-gray-900 hover:bg-gray-800 text-white"
                      )}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Buy
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* View all link */}
        <button
          onClick={() => {
            onClose?.();
            navigate('/subscription/packages');
          }}
          className={cn(
            "w-full text-center text-xs font-medium py-2 rounded-xl transition-colors",
            isDark
              ? "text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
              : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          )}
        >
          View all packages & details
        </button>
      </div>
    );
  }

  // ─── FULL PAGE VIEW (used in /subscription/packages route) ─────────────────
  const roleDescription = currentUserRole === 'owner'
    ? 'Connect with potential explorers interested in your listings'
    : 'Start conversations with providers about their listings';

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'starter':
        return {
          badge: isDark ? 'bg-slate-500/20 text-slate-300' : 'bg-slate-100 text-slate-700',
          button: isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-800 hover:bg-slate-700 text-white',
          glow: '',
          cardClass: isDark ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-white border-slate-200',
        };
      case 'standard':
        return {
          badge: isDark ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30' : 'bg-blue-50 text-blue-700 border border-blue-200',
          button: isDark ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md',
          glow: isDark ? 'shadow-lg shadow-blue-500/10' : 'shadow-xl shadow-blue-500/5',
          cardClass: isDark ? 'bg-blue-950/20 backdrop-blur-lg' : 'bg-white border-blue-100',
        };
      case 'premium':
        return {
          badge: isDark ? 'bg-amber-500/20 text-amber-200 border border-amber-400/30' : 'bg-amber-50 text-amber-700 border border-amber-200',
          button: isDark ? 'premium-btn-wow' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg',
          glow: isDark ? 'shadow-[0_0_30px_rgba(245,158,11,0.15)]' : 'shadow-xl shadow-amber-500/10',
          cardClass: isDark ? 'premium-card-lux' : 'bg-white border-amber-100',
        };
      default:
        return { badge: '', button: '', glow: '', cardClass: '' };
    }
  };

  return (
    <div className={cn("min-h-screen", isDark ? "bg-black" : "bg-gray-50")}>
      <div className={cn("space-y-6 p-4 sm:p-8 rounded-2xl overflow-hidden relative", isDark ? "bg-[#050505]" : "bg-white shadow-xl border border-gray-100")}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3 relative z-10">
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={cn("h-[450px] rounded-3xl animate-pulse border", isDark ? "bg-white/5 border-white/10" : "bg-gray-100 border-gray-200")} />
            ))}
          </div>
        ) : packagesUI.length === 0 ? (
          <div className={cn("text-center py-16 rounded-3xl border", isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200")}>
            <p className={cn("text-lg font-medium", isDark ? "text-white/40" : "text-gray-500")}>No packages available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative z-10">
            {packagesUI.map((pkg, index) => {
              const Icon = pkg.icon;
              const styles = getTierStyles(pkg.tier);
              const isPremium = pkg.tier === 'premium';
              const isStandard = pkg.tier === 'standard';

              return (
                <motion.div key={pkg.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.15, type: 'spring', stiffness: 100, damping: 20 }} className="h-full">
                  <Card className={cn("relative h-full flex flex-col border rounded-[2.5rem] transition-all duration-500 group hover:shadow-2xl overflow-hidden", styles.cardClass, styles.glow)}>
                    {isPremium && <div className="premium-shine-overlay" />}
                    {isStandard && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                        <Badge className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white/10 uppercase tracking-tighter">Most Popular</Badge>
                      </div>
                    )}
                    <div className={`text-center space-y-4 pb-2 px-8 ${isStandard ? 'pt-10' : 'pt-8'}`}>
                      <div className={`mx-auto p-4 rounded-3xl ${styles.badge} w-fit shadow-inner`}>
                        <Icon className={`w-8 h-8 ${isPremium ? 'text-amber-400' : ''}`} />
                      </div>
                      <div className="space-y-1">
                        <h3 className={cn("text-xl font-black tracking-tighter uppercase", isPremium ? 'luxury-text-gradient' : isDark ? 'text-white' : 'text-gray-900')}>{pkg.name}</h3>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className={cn("text-4xl font-black italic tracking-tighter", isDark ? "text-white" : "text-gray-900")}>{formatPriceMXN(pkg.price)}</span>
                          <span className={cn("text-xs font-bold", isDark ? "text-white/40" : "text-gray-500")}>MXN</span>
                        </div>
                        <p className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-white/40" : "text-gray-500")}>{formatPriceMXN(pkg.pricePerToken)} per connection</p>
                      </div>
                    </div>
                    <div className="flex-1 px-8 py-6 space-y-6">
                      <div className={cn("text-center py-6 rounded-3xl border shadow-inner", isDark ? "bg-black/40 border-white/5" : "bg-gray-50 border-gray-100")}>
                        <div className={cn("text-5xl font-black tracking-tighter mb-1", isDark ? "text-white" : "text-gray-900")}>{pkg.tokens}</div>
                        <div className={cn("text-xs font-black uppercase tracking-[0.2em]", isDark ? "text-white/30" : "text-gray-400")}>Activations</div>
                      </div>
                      <div className="space-y-3">
                        {pkg.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-3 text-xs group">
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isPremium ? 'bg-amber-500/20' : 'bg-rose-500/10'}`}>
                              <Check className={`w-3 h-3 ${isPremium ? 'text-amber-500' : 'text-rose-500'}`} />
                            </div>
                            <span className={cn("font-bold", isDark ? "text-white/70" : "text-gray-600")}>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pb-8 px-8">
                      <Button onClick={() => handlePurchase(pkg)} className={`w-full h-14 rounded-2xl text-base font-black uppercase tracking-tighter transition-all duration-300 ${styles.button}`}>
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z" />
                        </svg>
                        Secure Purchase
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className={cn("flex flex-wrap items-center justify-center gap-8 pt-8 relative z-10 border-t", isDark ? "border-white/5" : "border-gray-200")}>
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20"><Shield className="w-4 h-4 text-rose-500" /></div>
            <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-white/50" : "text-gray-500")}>Bank-Level Security</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20"><Clock className="w-4 h-4 text-blue-500" /></div>
            <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-white/50" : "text-gray-500")}>Instant Activation</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><Zap className="w-4 h-4 text-amber-500" /></div>
            <span className={cn("text-xs font-bold uppercase tracking-widest", isDark ? "text-white/50" : "text-gray-500")}>Elite Support 24/7</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
