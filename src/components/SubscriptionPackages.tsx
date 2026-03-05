import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, Crown, Zap, Star, Bot } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
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
  price: number;
  period: string;
  subtitle: string;
  benefits: string[];
  paypalUrl: string;
  highlight?: boolean;
};

// Shared benefits for all membership plans
const membershipBenefits = [
  'Communicate with listings and members',
  'Post properties for rent or sale',
  'Post services (chef, driver, cleaning, maintenance, babysitting, etc.)',
  'Post motorcycles or bicycles for rent or sale',
  'Save favorite listings',
  'Discover opportunities in Tulum',
];

const premiumPlans: Plan[] = [
  {
    id: 'yearly',
    name: 'Yearly Membership',
    price: 299,
    period: 'year',
    subtitle: 'Best for residents, investors, and property owners wanting year-round access.',
    benefits: membershipBenefits,
    paypalUrl: '#yearly', // Placeholder — replace with live PayPal link
    highlight: true,
  },
  {
    id: 'six-month',
    name: 'Six-Month Membership',
    price: 119,
    period: '6 months',
    subtitle: 'Ideal for digital nomads, seasonal visitors, and freelancers.',
    benefits: membershipBenefits,
    paypalUrl: '#six-month', // Placeholder — replace with live PayPal link
  },
  {
    id: 'monthly',
    name: 'Month-to-Month',
    price: 39,
    period: 'month',
    subtitle: 'Perfect for travelers and short-term visitors exploring Tulum.',
    benefits: membershipBenefits,
    paypalUrl: '#monthly', // Placeholder — replace with live PayPal link
  },
];

const getPackageIcon = (planId: string) => {
  if (planId === 'yearly') return <Zap className="w-5 h-5" />;
  if (planId === 'six-month') return <Crown className="w-5 h-5" />;
  return <Star className="w-5 h-5" />;
};

const getPackageColor = (planId: string) => {
  if (planId === 'yearly') return 'from-blue-500 to-cyan-500';
  if (planId === 'six-month') return 'from-pink-500 to-rose-500';
  return 'from-orange-500 to-amber-500';
};

export function SubscriptionPackages({ isOpen = true, onClose, reason, userRole = 'client', showAsPage = false }: SubscriptionPackagesProps) {
  const { user } = useAuth();

  // Premium packages are client-only — don't render for owners
  if (userRole === 'owner') return null;
  if (!showAsPage && !isOpen) return null;

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.paypalUrl || plan.paypalUrl.startsWith('#')) {
      toast({ title: 'Coming soon', description: 'This membership plan will be available shortly.', variant: 'destructive' });
      return;
    }

    const selection = { role: 'client', planId: plan.id, name: plan.name, price: `$${plan.price} USD`, at: new Date().toISOString() };
    localStorage.setItem(STORAGE.SELECTED_PLAN_KEY, JSON.stringify(selection));
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, '/client/dashboard');

    window.open(plan.paypalUrl, '_blank');

    toast({
      title: 'Redirecting to PayPal',
      description: `Selected: ${plan.name} ($${plan.price} USD/${plan.period})`,
    });

    if (user?.id) {
      await supabase.from('notifications').insert([{
        user_id: user.id,
        notification_type: 'payment_received',
        title: 'Premium Membership Selected!',
        message: `You selected the ${plan.name} ($${plan.price} USD/${plan.period}). Complete payment to activate your membership!`,
        is_read: false
      }]).then(
        () => { /* Notification saved successfully */ },
        () => { /* Notification save failed - non-critical */ }
      );

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Premium Membership Selected!', {
          body: `${plan.name} ($${plan.price} USD/${plan.period}) - Complete payment to unlock full access`,
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
            Choose Your Membership
          </DialogTitle>
          {reason && (
            <p className="text-center text-muted-foreground text-xs sm:text-sm mt-2">
              {reason}
            </p>
          )}
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {premiumPlans.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative overflow-hidden transition-all hover:shadow-lg flex flex-col ${pkg.highlight ? 'ring-2 ring-primary shadow-lg' : 'border-border'}`}
              >
                {pkg.highlight && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold rounded-bl-lg">
                    BEST VALUE
                  </div>
                )}

                <CardHeader className="pb-3 sm:pb-4 pt-4 sm:pt-5 px-3 sm:px-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${getPackageColor(pkg.id)} text-white shadow-md shrink-0`}>
                      {getPackageIcon(pkg.id)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm sm:text-base lg:text-lg font-bold text-foreground mb-1">{pkg.name}</CardTitle>
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">${pkg.price}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground">USD / {pkg.period}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{pkg.subtitle}</p>
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
                    {/* AI assistant benefit */}
                    <div className="flex items-start gap-1.5 sm:gap-2 pt-0.5">
                      <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-foreground leading-tight">
                        AI assistant for listings, descriptions, and discovering Tulum
                      </span>
                    </div>
                  </div>

                  <Button
                    className={`w-full bg-gradient-to-r ${getPackageColor(pkg.id)} hover:opacity-90 text-white font-semibold text-xs sm:text-sm py-2 sm:py-2.5`}
                    onClick={() => handleSubscribe(pkg)}
                  >
                    {pkg.highlight ? 'Subscribe Now' : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center text-xs sm:text-sm text-muted-foreground mt-6 sm:mt-8 space-y-1 pb-2 sm:pb-4">
            <p>Cancel anytime. Secure payments powered by PayPal.</p>
            <p>Questions? Contact support at <span className="text-primary">support@swipess.com</span></p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
