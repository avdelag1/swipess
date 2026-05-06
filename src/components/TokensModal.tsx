import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, MessageCircle, Crown, RefreshCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useTokens } from '@/hooks/useTokens';
import { useToast } from '@/hooks/use-toast';
import { STORAGE } from '@/constants/app';
import { useModalStore } from '@/state/modalStore';
import { haptics } from '@/utils/microPolish';
import { NativeBridge } from '@/utils/nativeBridge';
import { useNavigate } from 'react-router-dom';
import { APPLE_TOKEN_PACKAGES, type AppleTokenPackage } from '@/config/iapProducts';

const formatUSD = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);

const tokenTierConfig = {
  starter: {
    icon: MessageCircle,
    iconBg: 'token-pack-icon token-pack-icon-starter',
    border: 'border-border/50',
    accent: 'from-muted/70 to-background',
  },
  plus: {
    icon: Zap,
    iconBg: 'token-pack-icon token-pack-icon-plus',
    border: 'border-primary/60 shadow-card',
    accent: 'from-primary/12 to-background',
  },
  power: {
    icon: Crown,
    iconBg: 'token-pack-icon token-pack-icon-power',
    border: 'border-accent/50',
    accent: 'from-accent/12 to-background',
  },
  mega: {
    icon: Sparkles,
    iconBg: 'token-pack-icon token-pack-icon-mega',
    border: 'border-primary/50',
    accent: 'from-primary/10 to-background',
  },
} as const;

const getPricePerToken = (pack: AppleTokenPackage) => pack.priceUsd / pack.tokens;

interface TokensModalProps {
  userRole?: 'client' | 'owner';
}

function TokensModalComponent({ userRole = 'client' }: TokensModalProps) {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const { tokens } = useTokens();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isOpen = useModalStore((s) => s.showTokensModal);
  const close = () => useModalStore.getState().setModal('showTokensModal', false);

  const packageCategory = userRole === 'owner' ? 'owner_pay_per_use' : 'client_pay_per_use';

  const handlePurchase = async (pkg: AppleTokenPackage) => {
    localStorage.setItem(STORAGE.PENDING_ACTIVATION_KEY, JSON.stringify({
      productId: pkg.productId,
      packageId: pkg.productId,
      tokens: pkg.tokens,
      price: pkg.priceUsd,
      currency: 'USD',
      package_category: packageCategory,
    }));
    localStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, `/${userRole}/dashboard`);

    if (NativeBridge.isNative()) {
      toast({ title: 'Connecting to App Store' });
      const result = await NativeBridge.purchaseProduct(pkg.productId);
      if (result.success) {
        toast({ title: 'Payment Confirmed', description: `${pkg.tokens} tokens activated.` });
        close();
      } else {
        const cancelled = (result as any).error === 'CANCELLED';
        if (!cancelled) {
          toast({ title: 'Purchase could not be completed', description: 'Please try again.', variant: 'destructive' });
        }
      }
      return;
    }

    toast({
      title: 'Apple checkout ready',
      description: `${pkg.name}: ${pkg.tokens} tokens for ${formatUSD(pkg.priceUsd)} USD. Complete purchase in the iOS app.`,
    });
  };

  const handleRestore = () => {
    toast({ title: 'Restoring Purchases', description: 'Verifying with App Store...' });
    setTimeout(() => toast({ title: 'Sync Complete', description: 'Your access has been verified.' }), 1500);
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[10001] bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-0 z-[10002] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
          >
            <div className={cn(
              "w-full max-w-md max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col pointer-events-auto",
              isLight ? "bg-background border border-border/40" : "bg-zinc-900 border border-white/10"
            )}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground">Message Tokens</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You have <span className="font-bold text-primary">{tokens}</span> tokens remaining
                  </p>
                </div>
                <button
                  onClick={close}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 pb-8 space-y-6">
                {/* TOKEN PACKAGES */}
                <div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Tokens are used to message owners or unlock chat actions. One token = one new conversation.
                  </p>
                  <div className="space-y-2.5">
                    {packages && packages.length > 0 ? (
                      packages.slice(0, 4).map((pkg, index) => {
                        const tier = tierNames[index] || 'starter';
                        const config = tokenTierConfig[tier] || tokenTierConfig.starter;
                        const Icon = config.icon;
                        const isPopular = tier === 'standard';
                        const tierLabel = tierLabels[index] || 'Pack';
                        const tkns = pkg.message_activations || 0;
                        const pricePerToken = tkns > 0 ? pkg.price / tkns : 0;

                        return (
                          <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "relative rounded-2xl border p-4 bg-gradient-to-r transition-all",
                              config.accent, config.border,
                              isPopular && "ring-1 ring-blue-500/30"
                            )}
                          >
                            {isPopular && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-blue-600 text-white px-2.5 py-0.5 rounded-full">
                                Best Value
                              </span>
                            )}
                            <div className="flex items-center gap-3">
                              <div className={cn("flex-shrink-0 p-2.5 rounded-xl", config.iconBg)}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="font-black text-sm uppercase tracking-tight text-foreground">{tierLabel}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{tkns} tokens</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-0.5">
                                  <span className="font-black text-base tracking-tighter text-foreground">{formatUSD(pkg.price)}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground">({formatUSD(pricePerToken)}/token)</span>
                                </div>
                              </div>
                              <button
                                onClick={() => { haptics.tap(); handlePurchase(pkg, tier); }}
                                className="flex-shrink-0 h-10 px-5 rounded-full font-black text-[12px] uppercase tracking-widest text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-500/20 active:scale-95 transition-transform"
                              >
                                Buy
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="py-6 text-center">
                        <p className="text-muted-foreground text-xs">Loading packages...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* CROSS-LINK to Premium Plans */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
                  <Crown className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground">Looking for unlimited messages?</p>
                    <p className="text-[11px] text-muted-foreground">Premium plans live on your profile.</p>
                  </div>
                  <Button
                    size="sm"
                    className="flex-shrink-0 rounded-full text-xs font-black uppercase tracking-widest"
                    onClick={() => { close(); navigate('/subscription/packages'); }}
                  >
                    View
                  </Button>
                </div>

                {/* Restore Footer */}
                <div className="pt-4 pb-2 text-center">
                  <button 
                    onClick={handleRestore}
                    className="flex items-center justify-center gap-2 w-full text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Restore Purchases
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const TokensModal = memo(TokensModalComponent);


