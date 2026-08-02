import { memo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, MessageCircle, RefreshCcw, Sparkles, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { useTokens } from '@/hooks/useTokens';
import { useModalStore } from '@/state/modalStore';
import { haptics } from '@/utils/microPolish';
// NativeBridge removed
import { PaymentOrchestrator } from '@/lib/iap/PaymentOrchestrator';
import { useNavigate } from 'react-router-dom';
import { APPLE_TOKEN_PACKAGES, type AppleTokenPackage } from '@/config/iapProducts';
import { appToast } from '@/utils/appNotification';
import { PREMIUM_FOR_EVERYONE } from '@/utils/messagingEntitlements';
import { createPortal } from 'react-dom';

const formatUSD = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);

const tokenTierConfig = {
  starter: {
    icon: MessageCircle,
    iconBg: 'bg-indigo-500/10 text-indigo-500 rounded-xl p-2 shadow-inner',
    border: 'border-indigo-500/20 shadow-lg shadow-indigo-500/5',
    accent: 'bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent backdrop-blur-md',
  },
  plus: {
    icon: Zap,
    iconBg: 'bg-purple-500/10 text-purple-500 rounded-xl p-2 shadow-inner',
    border: 'border-purple-500/30 shadow-xl shadow-purple-500/10',
    accent: 'bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent backdrop-blur-md',
  },
  power: {
    icon: Crown,
    iconBg: 'bg-amber-500/10 text-amber-500 rounded-xl p-2 shadow-inner',
    border: 'border-amber-500/40 shadow-2xl shadow-amber-500/15',
    accent: 'bg-gradient-to-br from-amber-500/20 via-amber-500/5 to-transparent backdrop-blur-md',
  },
  mega: {
    icon: Sparkles,
    iconBg: 'bg-rose-500/10 text-rose-500 rounded-xl p-2 shadow-inner',
    border: 'border-rose-500/50 shadow-2xl shadow-rose-500/20',
    accent: 'bg-gradient-to-br from-rose-500/25 via-rose-500/10 to-transparent backdrop-blur-md',
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
  const navigate = useNavigate();

  const isOpen = useModalStore((s) => s.showTokensModal);
  const close = () => useModalStore.getState().setModal('showTokensModal', false);

  // Track WHICH product is being purchased, not a global boolean — a single
  // shared flag made all four "Get Offer" buttons flip to "Processing..." at
  // once, looking like every button got clicked.
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (pkg: AppleTokenPackage) => {
    if (purchasingId) return;
    setPurchasingId(pkg.productId);

    await PaymentOrchestrator.purchase({
      appleProductId: pkg.productId,
      paypalUrl: pkg.paypalUrl,
      returnPath: `/${userRole}/dashboard`,
      onSuccess: () => {
        appToast.success('Tokens Purchased', `${pkg.tokens} tokens activated via App Store.`);
        setPurchasingId(null);
        close();
      },
      onError: (err) => {
        setPurchasingId(null);
        if (err !== 'CANCELLED') {
          appToast.error('Purchase Failed', err);
        }
      }
    });
  };

  const handleRestore = async () => {
    await PaymentOrchestrator.restore();
  };


  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={close}
            className="fixed inset-0 z-[10001] bg-black/70"
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 z-[10002] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
            style={{
              top: 'calc(var(--top-bar-height, 72px) + var(--safe-top, 0px) + 8px)',
              bottom: 'calc(var(--bottom-nav-height, 72px) + var(--safe-bottom, 0px) + 8px)',
            }}
          >
            <div className={cn(
              "w-full max-w-md h-full sm:max-h-[80vh] rounded-3xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl",
              isLight ? "bg-background border border-border" : "bg-zinc-950 border border-white/10"
            )}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-foreground">
                    {PREMIUM_FOR_EVERYONE ? 'Premium Messaging' : 'Message Tokens'}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {PREMIUM_FOR_EVERYONE ? (
                      <span className="font-bold text-primary">Premium · Unlimited messaging</span>
                    ) : (
                      <>You have <span className="font-bold text-primary">{tokens}</span> tokens remaining</>
                    )}
                  </p>
                </div>
                <button
                  onClick={close}
                  className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 pb-16 space-y-6">
                {PREMIUM_FOR_EVERYONE && (
                  <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center flex-shrink-0">
                      <Crown className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">Premium unlocked</p>
                      <h3 className="text-lg font-black tracking-tight text-foreground leading-tight">Unlimited Messages</h3>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">Free for everyone right now — message anyone, no tokens needed.</p>
                    </div>
                  </div>
                )}
                <>
                {/* TOKEN PACKAGES */}
                <div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {PREMIUM_FOR_EVERYONE
                      ? 'Messaging is free for everyone right now — no tokens needed. You can still grab a pack to support Swipess or stock up for later.'
                      : 'Tokens are used to message owners or unlock chat actions. One token = one new conversation.'}
                  </p>
                  <div className="space-y-2.5">
                    {APPLE_TOKEN_PACKAGES.map((pkg) => {
                        const config = tokenTierConfig[pkg.id] || tokenTierConfig.starter;
                        const Icon = config.icon;
                        const isPopular = pkg.badge === 'Popular' || pkg.badge === 'Best Value';
                        const pricePerToken = getPricePerToken(pkg);

                        return (
                          <motion.div
                            key={pkg.productId}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                            className={cn(
                              // overflow-visible so the "Popular" / "Best Value" badge sitting
                              // at -top-3 isn't clipped in half by the rounded card edge.
                              "relative rounded-[20px] border p-4 transition-all overflow-visible",
                              config.accent, config.border,
                              isPopular && "ring-2 ring-primary/40 scale-[1.02]"
                            )}
                          >
                            {pkg.badge && (
                              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 text-[10px] font-black bg-primary text-primary-foreground px-3 py-1 rounded-full shadow-lg border border-primary-foreground/10 uppercase tracking-widest leading-none whitespace-nowrap">
                                {pkg.badge}
                              </span>
                            )}
                            <div className="flex items-center gap-3">
                              <div className={cn("flex-shrink-0 flex items-center justify-center", config.iconBg)}>
                                <Icon className="w-5 h-5" aria-hidden="true" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="font-black text-sm uppercase tracking-tight text-foreground">{pkg.name}</span>
                                  <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded-md">{pkg.tokens} tokens</span>
                                </div>
                                <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                                  <span className="font-black text-lg tracking-tighter text-foreground">{formatUSD(pkg.priceUsd)}</span>
                                  <span className="text-[10px] font-black text-muted-foreground">USD</span>
                                  <span className="text-[10px] font-bold text-muted-foreground ml-1">{formatUSD(pricePerToken)} / token</span>
                                </div>
                                <p className="text-[11px] font-medium text-muted-foreground mt-1 leading-snug">{pkg.description}</p>
                              </div>
                              <button
                                onClick={(e) => { e.preventDefault(); haptics.tap(); handlePurchase(pkg); }}
                                disabled={purchasingId === pkg.productId}
                                aria-label={`Get offer: ${pkg.tokens} tokens for ${formatUSD(pkg.priceUsd)} USD`}
                                className={cn(
                                  "flex-shrink-0 h-11 px-5 rounded-full font-black text-sm transition-all whitespace-nowrap flex items-center justify-center gap-1.5",
                                  purchasingId === pkg.productId
                                    ? "opacity-60 cursor-not-allowed"
                                    : "active:scale-95 touch-manipulation hover:shadow-lg",
                                  "bg-primary text-primary-foreground shadow-lg"
                                )}
                              >
                                {purchasingId === pkg.productId ? 'Processing...' : (
                                  <span className="text-[11px] uppercase tracking-widest">Get Offer</span>
                                )}
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
                    <p className="text-sm font-black text-foreground">Explore Premium plans</p>
                    <p className="text-[11px] text-muted-foreground">See all Swipess premium options.</p>
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
                </>

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
    </AnimatePresence>,
    document.body
  );
}

export const TokensModal = memo(TokensModalComponent);


