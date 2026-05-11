import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, MessageCircle, Crown, RefreshCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useTokens } from '@/hooks/useTokens';
import { useToast } from '@/hooks/use-toast';
import { STORAGE } from '@/constants/app';
import { useModalStore } from '@/state/modalStore';
import { haptics } from '@/utils/microPolish';
import { NativeBridge } from '@/utils/nativeBridge';
import { useNavigate } from 'react-router-dom';
import { APPLE_TOKEN_PACKAGES, type AppleTokenPackage, getSafePaymentUrl } from '@/config/iapProducts';

const formatMXN = (price: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
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

const getPricePerToken = (pack: AppleTokenPackage) => pack.priceMxn / pack.tokens;

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
      price: pkg.priceMxn,
      currency: 'MXN',
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

    const safePaypalUrl = getSafePaymentUrl(pkg.paypalUrl);
    if (!safePaypalUrl) {
      toast({ title: 'Payment link unavailable', description: 'Please use the App Store to purchase.', variant: 'destructive' });
      return;
    }

    toast({ title: 'Redirecting to PayPal', description: `${pkg.name}: ${pkg.tokens} tokens for ${formatMXN(pkg.priceMxn)} MXN.` });
    window.open(safePaypalUrl, '_blank', 'noopener,noreferrer');
    close();
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
            className="fixed inset-x-0 z-[10002] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
            style={{
              top: 'calc(var(--top-bar-height, 56px) + var(--safe-top, 0px) + 8px)',
              bottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px) + 8px)',
            }}
          >
            <div className={cn(
              "w-full max-w-md h-full sm:max-h-[80vh] rounded-3xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl",
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
                    {APPLE_TOKEN_PACKAGES.map((pkg, index) => {
                        const config = tokenTierConfig[pkg.id] || tokenTierConfig.starter;
                        const Icon = config.icon;
                        const isPopular = pkg.badge === 'Popular' || pkg.badge === 'Best Value';
                        const pricePerToken = getPricePerToken(pkg);

                        return (
                          <motion.div
                            key={pkg.productId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "relative rounded-2xl border p-4 bg-gradient-to-r transition-all shadow-card",
                              config.accent, config.border,
                              isPopular && "ring-1 ring-primary/30"
                            )}
                          >
                            {pkg.badge && (
                              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full">
                                {pkg.badge}
                              </span>
                            )}
                            <div className="flex items-center gap-3">
                              <div className={cn("flex-shrink-0", config.iconBg)}>
                                <Icon className="w-5 h-5" aria-hidden="true" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="font-black text-sm uppercase tracking-tight text-foreground">{pkg.name}</span>
                                  <span className="text-[10px] font-black text-primary uppercase">{pkg.tokens} tokens</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-0.5 flex-wrap">
                                  <span className="font-black text-base tracking-tighter text-foreground">{formatMXN(pkg.priceMxn)}</span>
                                  <span className="text-[10px] font-black text-muted-foreground">MXN</span>
                                  <span className="text-[10px] font-bold text-muted-foreground">{formatMXN(pricePerToken)} / token</span>
                                </div>
                                <p className="text-[11px] font-medium text-muted-foreground mt-1">{pkg.description}</p>
                              </div>
                              <button
                                onClick={() => { haptics.tap(); handlePurchase(pkg); }}
                                aria-label={`Get offer: ${pkg.tokens} tokens for ${formatMXN(pkg.priceMxn)} MXN`}
                                className="flex-shrink-0 h-11 px-5 rounded-full font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform whitespace-nowrap"
                                style={{
                                  backgroundColor: '#000000',
                                  color: '#FFFFFF',
                                  boxShadow: '0 12px 28px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
                                }}
                              >
                                {NativeBridge.isIOS() ? 'Buy ·  Pay' : 'Get Offer'}
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>
                </div>

                {/* CROSS-LINK to Premium Plans */}
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex items-center gap-3">
                  <Crown className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-foreground">Looking for unlimited messages?</p>
                    <p className="text-[11px] text-muted-foreground">Premium plans live on your profile.</p>
                  </div>
                  <button
                    type="button"
                    className="swipess-offer-pill flex-shrink-0"
                    onClick={() => { haptics.tap(); close(); navigate('/subscription/packages'); }}
                    aria-label="Go to premium plans"
                  >
                    Go!
                  </button>
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


