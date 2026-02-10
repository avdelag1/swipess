import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Sparkles, Zap, Clock, Shield, Check, Crown, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatPriceMXN } from "@/utils/subscriptionPricing";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { STORAGE } from "@/constants/app";

type MessagePackage = {
  id: number;
  name: string;
  activations: number;
  price: number;
  pricePerActivation: number;
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

  // Fetch user's role from profile if not provided
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

  // Convert database packages to UI format
  const convertPackages = (dbPackages: any[] | undefined): MessagePackage[] => {
    if (!dbPackages || dbPackages.length === 0) return [];

    return dbPackages.map((pkg, index) => {
      const pricePerActivation = pkg.message_activations > 0
        ? pkg.price / pkg.message_activations
        : 0;

      // Determine tier based on position
      const tierMap: ('starter' | 'standard' | 'premium')[] = ['starter', 'standard', 'premium'];
      const tier = tierMap[index] || 'starter';

      // Calculate savings vs first package
      let savings: string | undefined;
      if (index > 0 && dbPackages[0]) {
        const firstPricePerActivation = dbPackages[0].price / dbPackages[0].message_activations;
        const savingsPercent = Math.round(((firstPricePerActivation - pricePerActivation) / firstPricePerActivation) * 100);
        if (savingsPercent > 0) {
          savings = `Save ${savingsPercent}%`;
        }
      }

      // Parse features from database or use defaults
      let features: string[] = [];
      try {
        features = Array.isArray(pkg.features) ? pkg.features : JSON.parse(pkg.features || '[]');
      } catch {
        features = [
          `${pkg.message_activations} message activations`,
          `${pkg.duration_days || 30} days validity`,
          'Unlimited messages per conversation',
        ];
      }

      const iconMap = {
        starter: MessageCircle,
        standard: Zap,
        premium: Crown,
      };

      return {
        id: pkg.id,
        name: tier.charAt(0).toUpperCase() + tier.slice(1),
        activations: pkg.message_activations,
        price: pkg.price,
        pricePerActivation,
        savings,
        tier,
        icon: iconMap[tier],
        duration_days: pkg.duration_days || 30,
        package_category: pkg.package_category,
        paypalUrl: pkg.paypal_link || '',
        features,
        legal_documents: pkg.legal_documents_included || 0,
      };
    });
  };

  const handlePurchase = async (pkg: MessagePackage) => {
    // Store selection for post-payment processing
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      packageId: pkg.id,
      activations: pkg.activations,
      price: pkg.price,
      package_category: pkg.package_category,
    }));

    // Save return path for silent redirect after payment
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${currentUserRole}/dashboard`);

    if (pkg.paypalUrl) {
      window.open(pkg.paypalUrl, '_blank');
      toast({
        title: "Redirecting to PayPal",
        description: `Processing ${pkg.name} package (${formatPriceMXN(pkg.price)})`,
      });

      // Save notification for message activation purchase
      if (user?.id) {
        await supabase.from('notifications').insert([{
          user_id: user.id,
          notification_type: 'payment_received',
          title: 'Message Activations Selected!',
          message: `You selected the ${pkg.name} package with ${pkg.activations} message activations (${formatPriceMXN(pkg.price)}). Complete payment to activate!`,
          is_read: false
        }]).then(
          () => { /* Notification saved successfully */ },
          () => { /* Notification save failed - non-critical */ }
        );

        // Show browser notification if permission granted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification('Message Activations Selected!', {
            body: `${pkg.activations} activations (${formatPriceMXN(pkg.price)}) - Complete payment to start messaging`,
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

  const packagesUI = convertPackages(packages);
  
  const roleLabel = currentUserRole === 'owner' ? 'Provider' : 'Explorer';
  const roleDescription = currentUserRole === 'owner'
    ? 'Connect with potential explorers interested in your listings'
    : 'Start conversations with providers about their listings';

  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'starter':
        return {
          gradient: 'from-slate-500/20 to-slate-600/10',
          border: 'border-slate-500/30 hover:border-slate-400/50',
          badge: 'bg-slate-500/20 text-slate-300',
          button: 'bg-slate-600 hover:bg-slate-500',
          glow: '',
        };
      case 'standard':
        return {
          gradient: 'from-primary/30 to-primary/10',
          border: 'border-primary/50 hover:border-primary ring-2 ring-primary/30',
          badge: 'bg-primary/20 text-primary',
          button: 'bg-primary hover:bg-primary/90',
          glow: 'shadow-lg shadow-primary/20',
        };
      case 'premium':
        return {
          gradient: 'from-amber-500/20 to-orange-500/10',
          border: 'border-amber-500/40 hover:border-amber-400/60',
          badge: 'bg-amber-500/20 text-amber-400',
          button: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400',
          glow: 'shadow-lg shadow-amber-500/20',
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
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
          <MessageCircle className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold text-primary">{roleLabel} Packages</span>
        </div>
        
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
          Message Activation Packages
        </h2>
        
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          {roleDescription}. Choose the package that fits your needs.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-foreground font-medium">New users get 3 FREE activations!</span>
        </div>
      </motion.div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 rounded-2xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : packagesUI.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No packages available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {packagesUI.map((pkg, index) => {
            const Icon = pkg.icon;
            const styles = getTierStyles(pkg.tier);
            const isPopular = pkg.tier === 'standard';
            
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative h-full flex flex-col overflow-hidden bg-gradient-to-br ${styles.gradient} ${styles.border} ${styles.glow} transition-all duration-300`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute -top-0 left-0 right-0">
                      <div className="bg-primary text-primary-foreground text-xs font-bold py-1.5 text-center">
                        ⭐ BEST VALUE
                      </div>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {pkg.savings && !isPopular && (
                    <div className="absolute top-3 right-3">
                      <Badge className={styles.badge}>{pkg.savings}</Badge>
                    </div>
                  )}
                  
                  <CardHeader className={`text-center pb-2 ${isPopular ? 'pt-10' : 'pt-6'}`}>
                    <div className={`mx-auto mb-3 p-4 rounded-2xl ${styles.badge} w-fit`}>
                      <Icon className="w-8 h-8" />
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground">{pkg.name}</h3>
                    
                    <div className="mt-2">
                      <span className="text-4xl font-bold text-foreground">{formatPriceMXN(pkg.price)}</span>
                      <span className="text-muted-foreground text-sm ml-1">MXN</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatPriceMXN(pkg.pricePerActivation)} per activation
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 pt-4">
                    {/* Activations Display */}
                    <div className="text-center py-4 mb-4 rounded-xl bg-background/50 border border-border/50">
                      <div className="text-5xl font-bold text-foreground">{pkg.activations}</div>
                      <div className="text-sm text-muted-foreground font-medium mt-1">
                        Message Activations
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-foreground">Start {pkg.activations} new conversations</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-foreground">Unlimited messages per chat</span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-foreground">{pkg.duration_days}-day validity</span>
                      </div>

                      {pkg.legal_documents > 0 && (
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Check className="w-3 h-3 text-green-500" />
                          </div>
                          <span className="text-foreground">{pkg.legal_documents} legal document{pkg.legal_documents > 1 ? 's' : ''} included</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                          <Shield className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-foreground">Secure PayPal payment</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-4 pb-6">
                    <Button 
                      onClick={() => handlePurchase(pkg)}
                      className={`w-full h-12 font-semibold text-base ${styles.button}`}
                      size="lg"
                    >
                      {isPopular ? '🔥 Get Best Value' : 'Buy Now'}
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
        transition={{ delay: 0.4 }}
        className="flex flex-wrap items-center justify-center gap-6 pt-6 border-t border-border/50"
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

  if (showAsPage) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm">
      <div className="fixed inset-x-2 sm:inset-x-4 top-[5%] sm:top-[10%] bottom-[5%] sm:bottom-[10%] z-[100] overflow-auto">
        <div className="relative bg-background rounded-2xl border shadow-2xl max-w-5xl mx-auto">
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 z-10"
              onClick={onClose}
            >
              ✕
            </Button>
          )}
          {content}
        </div>
      </div>
    </div>
  );
}