import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, Zap, Clock, Shield, Check, Crown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPriceUSD } from "@/utils/subscriptionPricing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { STORAGE } from "@/constants/app";

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
};

interface MessageActivationPackagesProps {
  isOpen?: boolean;
  onClose?: () => void;
  showAsPage?: boolean;
  userRole?: 'client' | 'owner' | 'admin';
}

const hardcodedPackagesUI: TokenPackage[] = [
  {
    id: 1,
    name: 'Starter',
    tokens: 3,
    price: 3.99,
    pricePerToken: 3.99 / 3,
    tier: 'starter',
    icon: MessageCircle,
    duration_days: 30,
    package_category: 'client_pay_per_use',
    paypalUrl: 'https://www.paypal.com/ncp/payment/VNM2QVBFG6TA4',
    features: ['3 tokens', '30 days validity'],
    legal_documents: 0,
  },
  {
    id: 2,
    name: 'Standard',
    tokens: 10,
    price: 9.99,
    pricePerToken: 9.99 / 10,
    savings: 'Save 25%',
    tier: 'standard',
    icon: Zap,
    duration_days: 90,
    package_category: 'client_pay_per_use',
    paypalUrl: 'https://www.paypal.com/ncp/payment/VG2C7QMAC8N6A',
    features: ['10 tokens', '90 days validity'],
    legal_documents: 0,
  },
  {
    id: 3,
    name: 'Premium',
    tokens: 15,
    price: 13.99,
    pricePerToken: 13.99 / 15,
    savings: 'Save 30%',
    tier: 'premium',
    icon: Crown,
    duration_days: 180,
    package_category: 'client_pay_per_use',
    paypalUrl: 'https://www.paypal.com/ncp/payment/9NBGA9X3BJ5UA',
    features: ['15 tokens', '180 days validity'],
    legal_documents: 0,
  }
];

export function MessageActivationPackages({
  isOpen = true,
  onClose,
  showAsPage = false,
  userRole
}: MessageActivationPackagesProps) {
  const { toast } = useToast();
  const { user } = useAuth();

  const currentUserRole = 'client'; // Hardcoded since we only support client side tokens now
  const packageCategory = 'client_pay_per_use';
  const packagesUI = hardcodedPackagesUI;

  const handlePurchase = async (pkg: TokenPackage) => {
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      tokens: pkg.tokens,
      price: pkg.price,
      package_category: pkg.package_category,
    }));
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${currentUserRole}/dashboard`);

    if (pkg.paypalUrl) {
      window.open(pkg.paypalUrl, '_blank');
      toast({
        title: "Redirecting to PayPal",
        description: `Processing ${pkg.name} package (${formatPriceUSD(pkg.price)})`,
      });

      if (user?.id) {
        await supabase.from('notifications').insert([{
          user_id: user.id,
          notification_type: 'payment_received',
          title: 'Tokens Selected!',
          message: `You selected the ${pkg.name} package with ${pkg.tokens} tokens (${formatPriceUSD(pkg.price)}). Complete payment to activate!`,
          is_read: false
        }]).then(() => { }, () => { });

        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('Tokens Selected!', {
            body: `${pkg.tokens} tokens (${formatPriceUSD(pkg.price)}) - Complete payment to start messaging`,
            icon: '/favicon.ico',
            tag: `activation-${pkg.id}`,
            badge: '/favicon.ico',
          });
          setTimeout(() => notification.close(), 5000);
        }
      }
    } else {
      toast({
        title: "Payment link unavailable",
        description: "Please contact support to complete this purchase.",
        variant: "destructive",
      });
    }
  };

  const roleLabel = 'Explorer';
  const roleDescription = 'Start conversations with providers about their listings';

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'starter':
        return {
          gradient: 'from-purple-500/20 to-purple-600/10',
          border: 'border-purple-500/30 hover:border-purple-400/50',
          badge: 'bg-purple-500/20 text-purple-300',
          button: 'bg-purple-600 hover:bg-purple-500',
          glow: '',
        };
      case 'standard':
        return {
          gradient: 'from-blue-500/30 to-blue-600/10',
          border: 'border-blue-500/50 hover:border-blue-400 ring-2 ring-blue-500/30',
          badge: 'bg-blue-500/20 text-blue-400',
          button: 'bg-blue-600 hover:bg-blue-500',
          glow: 'shadow-lg shadow-blue-500/20',
        };
      case 'premium':
        return {
          gradient: 'from-[#E4007C]/20 to-[#B0005E]/10',
          border: 'border-[#E4007C]/40 hover:border-[#FF1A8B]/60',
          badge: 'bg-[#E4007C]/20 text-pink-300',
          button: 'bg-gradient-to-r from-[#E4007C] to-[#B0005E] hover:from-[#FF1A8B] hover:to-[#E4007C]',
          glow: 'shadow-lg shadow-[#E4007C]/30',
        };
      default:
        return {
          gradient: 'from-muted/50 to-muted/30',
          border: 'border-border',
          badge: 'bg-muted text-muted-foreground',
          button: '',
          glow: '',
        };
    }
  };

  const content = (
    <div className="space-y-4 p-3 sm:p-4">
      {/* Header - compact */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold text-primary">{roleLabel} Packages</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-foreground">
          Token Packages
        </h2>

        <p className="text-muted-foreground text-xs max-w-md mx-auto">
          {roleDescription}
        </p>

        <div className="flex items-center justify-center gap-1.5 text-xs">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-foreground font-medium">New users get 3 FREE tokens!</span>
        </div>
      </motion.div>

      {/* Packages Grid */}
      {packagesUI.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">No packages available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
          {packagesUI.map((pkg, index) => {
            const Icon = pkg.icon;
            const styles = getTierStyles(pkg.tier);
            const isPopular = pkg.tier === 'standard';

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card
                  className={`relative h-full flex flex-col overflow-hidden bg-gradient-to-br ${styles.gradient} ${styles.border} ${styles.glow} transition-all duration-300`}
                >
                  {isPopular && (
                    <div className="absolute -top-0 left-0 right-0">
                      <div className="bg-primary text-primary-foreground text-[10px] font-bold py-1 text-center">
                        ⭐ BEST VALUE
                      </div>
                    </div>
                  )}

                  {pkg.savings && !isPopular && (
                    <div className="absolute top-2 right-2">
                      <Badge className={`${styles.badge} text-[10px] px-1.5 py-0.5`}>{pkg.savings}</Badge>
                    </div>
                  )}

                  <CardHeader className={`text-center pb-1 ${isPopular ? 'pt-7' : 'pt-4'} px-3`}>
                    <div className={`mx-auto mb-2 p-2.5 rounded-xl ${styles.badge} w-fit`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <h3 className="text-sm font-bold text-foreground">{pkg.name}</h3>

                    <div className="mt-1">
                      <span className="text-2xl font-bold text-foreground">{formatPriceUSD(pkg.price)}</span>
                      <span className="text-muted-foreground text-[10px] ml-1">USD</span>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      {formatPriceUSD(pkg.pricePerToken)} per token
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 pt-2 px-3">
                    {/* Tokens Display */}
                    <div className="text-center py-2 mb-2 rounded-lg bg-background/50 border border-border/50">
                      <div className="text-3xl font-bold text-foreground">{pkg.tokens}</div>
                      <div className="text-[10px] text-muted-foreground font-medium">Tokens</div>
                    </div>

                    {/* Features */}
                    <div className="space-y-1.5">
                      <Feature text={`Start ${pkg.tokens} new conversations`} />
                      <Feature text="Unlimited messages per chat" />
                      <Feature text={`${pkg.duration_days}-day validity`} icon={<Clock className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />} />
                      {pkg.legal_documents > 0 && (
                        <Feature text={`${pkg.legal_documents} legal document${pkg.legal_documents > 1 ? 's' : ''}`} />
                      )}
                      <Feature text="Secure PayPal payment" icon={<Shield className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />} />
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 pb-3 px-3">
                    <Button
                      onClick={() => handlePurchase(pkg)}
                      className={`w-full h-10 font-semibold text-sm ${styles.button} rounded-lg`}
                      size="default"
                    >
                      {/* PayPal branding */}
                      <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797H9.603c-.564 0-1.04.408-1.13.964L7.076 21.337z" />
                      </svg>
                      Pay with PayPal
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Trust Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-border/50"
      >
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span>Instant Activation</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>No Hidden Fees</span>
        </div>
      </motion.div>
    </div>
  );

  if (showAsPage) return content;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-2 sm:inset-x-4 top-[5%] sm:top-[10%] bottom-[5%] sm:bottom-[10%] z-[100] overflow-auto">
        <div className="relative bg-background rounded-2xl border shadow-2xl max-w-4xl mx-auto">
          {onClose && (
            <Button variant="ghost" size="sm" className="absolute right-3 top-3 z-10" onClick={onClose}>
              ✕
            </Button>
          )}
          {content}
        </div>
      </div>
    </div>
  );
}

function Feature({ text, icon }: { text: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 dark:bg-emerald-600/20 flex items-center justify-center">
        {icon || <Check className="w-2.5 h-2.5 text-emerald-500 dark:text-emerald-400" />}
      </div>
      <span className="text-foreground">{text}</span>
    </div>
  );
}
