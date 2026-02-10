import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { STORAGE } from '@/constants/app';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionPackagesProps {
  isOpen?: boolean;
  onClose?: () => void;
  reason?: string;
  userRole?: 'client' | 'owner' | 'admin';
  showAsPage?: boolean;
}

type Plan = {
  id: string;
  name: string;
  price: string; // e.g., "$299 MXN"
  benefits: string[];
  paypalUrl: string;
  highlight?: boolean;
};

const ownerPlans: Plan[] = [
  {
    id: 'owner-unlimited',
    name: 'UNLIMITED OWNER',
    price: '$299 MXN',
    benefits: [
      'Unlimited properties',
      '30 messages per month',
      'Top visibility (100%)',
      'Always listed first in search',
      'Full access to tools, filters, and stats',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/P2YZA6FWZAACQ',
    highlight: true,
  },
  {
    id: 'owner-premium-max',
    name: 'PREMIUM MAX OWNER',
    price: '$199 MXN',
    benefits: [
      'Up to 10 properties',
      '20 messages per month',
      'High visibility (80%)',
      'Advanced client filters',
      '“Premium Profile” badge',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/4LG62YGVETM4L',
  },
  {
    id: 'owner-premium-plus-plus',
    name: 'PREMIUM ++ OWNER',
    price: '$149 MXN',
    benefits: [
      'Up to 5 properties',
      '12 messages per month',
      'Medium-high visibility (50%)',
      'Filters to choose ideal clients',
      'Highlighted profile',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/J5NKCX6KQRCYW',
  },
  {
    id: 'owner-premium-plus',
    name: 'PREMIUM + OWNER',
    price: '$99 MXN',
    benefits: [
      'Up to 2 active properties',
      '6 direct messages per month',
      'See who liked you',
      'Unlimited likes',
      'Medium visibility (25%)',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/GSA6TBVY9PFDU',
  },
];

const clientPlans: Plan[] = [
  {
    id: 'client-unlimited',
    name: 'UNLIMITED CLIENT',
    price: '$199 MXN',
    benefits: [
      '30 direct messages per month',
      'Unlimited superlikes',
      'Full visibility (100%)',
      'Priority in search results',
      'Access to all premium features',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/7E6R38L33LYUJ',
    highlight: true,
  },
  {
    id: 'client-premium-plus-plus',
    name: 'PREMIUM ++ CLIENT',
    price: '$149 MXN',
    benefits: [
      '12 direct messages per month',
      'See who visited your profile',
      'Highlighted profile',
      'Medium visibility (50%)',
      'Unlimited superlikes',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/HUESWJ68BRUSY',
  },
  {
    id: 'client-premium',
    name: 'PREMIUM CLIENT',
    price: '$99 MXN',
    benefits: [
      '6 direct messages per month',
      'See who liked you',
      'More visibility (25%)',
      'Access to additional filters',
      'Highlighted profile in regular search',
    ],
    paypalUrl: 'https://www.paypal.com/ncp/payment/QSRXCJYYQ2UGY',
  },
];

// Icons and colors reused
const getPackageIcon = (packageName: string) => {
  if (packageName.includes('UNLIMITED')) return <Zap className="w-5 h-5" />;
  if (packageName.includes('VIP')) return <Crown className="w-5 h-5" />;
  if (packageName.includes('PREMIUM')) return <Star className="w-5 h-5" />;
  return <Check className="w-5 h-5" />;
};

const getPackageColor = (packageName: string) => {
  if (packageName.includes('UNLIMITED')) return 'from-blue-500 to-cyan-500';
  if (packageName.includes('VIP')) return 'from-purple-500 to-pink-500';
  if (packageName.includes('PREMIUM')) return 'from-green-500 to-emerald-500';
  return 'from-gray-500 to-slate-500';
};

export function SubscriptionPackages({ isOpen = true, onClose, reason, userRole = 'client', showAsPage = false }: SubscriptionPackagesProps) {
  const { user } = useAuth();

  if (!showAsPage && !isOpen) return null;

  const plans = userRole === 'owner' ? ownerPlans : clientPlans;

  const handleSubscribe = async (plan: Plan) => {
    // Store selected plan locally (can persist to Supabase upon your approval)
    const selection = { role: userRole, planId: plan.id, name: plan.name, price: plan.price, at: new Date().toISOString() };
    localStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify(selection));

    // Save return path for silent redirect after payment
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);

    // Open PayPal in a new tab
    window.open(plan.paypalUrl, '_blank');

    // Feedback
    toast({
      title: 'Redirecting to PayPal',
      description: `Selected: ${plan.name} (${plan.price})`,
    });

    // Save notification for premium package purchase
    if (user?.id) {
      await supabase.from('notifications').insert([{
        user_id: user.id,
        notification_type: 'payment_received',
        title: 'Premium Package Selected!',
        message: `You selected the ${plan.name} package (${plan.price}). Complete payment to activate your premium benefits!`,
        is_read: false
      }]).then(
        () => { /* Notification saved successfully */ },
        () => { /* Notification save failed - non-critical */ }
      );

      // Show browser notification if permission granted
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Premium Package Selected!', {
          body: `${plan.name} (${plan.price}) - Complete payment to unlock premium features`,
          icon: '/favicon.ico',
          tag: `premium-${plan.id}`,
          badge: '/favicon.ico',
        });
        setTimeout(() => notification.close(), 5000);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 bg-background overflow-hidden">
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-border">
          <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-bold text-center text-foreground font-brand">
            Upgrade to Premium
          </DialogTitle>
          {reason && (
            <p className="text-center text-muted-foreground text-xs sm:text-sm mt-2">
              {reason}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {plans.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg flex flex-col ${pkg.highlight ? 'ring-2 ring-primary shadow-lg' : 'border-border'}`}
              >
                {pkg.highlight && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                )}

                <CardHeader className="pb-3 sm:pb-4 pt-4 sm:pt-5 px-3 sm:px-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${getPackageColor(pkg.name)} text-white shadow-md shrink-0`}>
                      {getPackageIcon(pkg.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-1 truncate">{pkg.name}</CardTitle>
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{pkg.price}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">/month</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0 flex-1 flex flex-col px-3 sm:px-4 pb-4">
                  <div className="space-y-1.5 sm:space-y-2 mb-4 flex-1">
                    {pkg.benefits.map((feature) => (
                      <div key={`benefit-${feature}`} className="flex items-start gap-1.5 sm:gap-2">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-foreground leading-tight">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full bg-gradient-to-r ${getPackageColor(pkg.name)} hover:opacity-90 text-white font-semibold text-xs sm:text-sm py-2 sm:py-2.5`}
                    onClick={() => handleSubscribe(pkg)}
                  >
                    Buy Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8 space-y-1 pb-2 sm:pb-4">
            <p>✓ Cancel anytime · Secure payments powered by PayPal</p>
            <p>Questions? Contact support at <span className="text-primary">support@tinderent.com</span></p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
