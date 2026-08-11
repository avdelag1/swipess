import { memo, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Crown, MessageCircle, RefreshCcw, Sparkles, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTokens } from '@/hooks/useTokens';
import { useModalStore } from '@/state/modalStore';
import { haptics } from '@/utils/microPolish';
import { PaymentOrchestrator } from '@/lib/iap/PaymentOrchestrator';
import { useNavigate } from 'react-router-dom';
import { APPLE_TOKEN_PACKAGES, type AppleTokenPackage } from '@/config/iapProducts';
import { appToast } from '@/utils/appNotification';
import { PREMIUM_FOR_EVERYONE } from '@/utils/messagingEntitlements';
import { createPortal } from 'react-dom';
import useAppTheme from '@/hooks/useAppTheme';

const formatUSD = (price: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price);

const getPricePerToken = (pack: AppleTokenPackage) => pack.priceUsd / pack.tokens;

const TIER_META = {
  starter: { icon: MessageCircle, wash: 'from-sky-500/20 to-transparent', ink: 'text-sky-600 dark:text-sky-300' },
  plus: { icon: Zap, wash: 'from-violet-500/20 to-transparent', ink: 'text-violet-600 dark:text-violet-300' },
  power: { icon: Crown, wash: 'from-amber-500/25 to-transparent', ink: 'text-amber-600 dark:text-amber-300' },
  mega: { icon: Sparkles, wash: 'from-rose-500/20 to-transparent', ink: 'text-rose-600 dark:text-rose-300' },
} as const;

interface TokensModalProps {
  userRole?: 'client' | 'owner';
}

function TokensModalComponent({ userRole = 'client' }: TokensModalProps) {
  const { tokens } = useTokens();
  const navigate = useNavigate();
  const { isLight } = useAppTheme();

  const isOpen = useModalStore((s) => s.showTokensModal);
  const close = () => useModalStore.getState().setModal('showTokensModal', false);
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
      },
    });
  };

  const handleRestore = async () => {
    await PaymentOrchestrator.restore();
  };

  const panelStyle: CSSProperties = isLight
    ? {
        background: '#ffffff',
        border: '2.5px solid #141414',
        boxShadow: '1.5px 1.5px 0 #141414, 0 24px 60px rgba(20,20,20,0.16)',
      }
    : {
        background: '#121218',
        border: '2.5px solid rgba(255,255,255,0.92)',
        boxShadow: '1.5px 1.5px 0 rgba(255,255,255,0.35), 0 24px 60px rgba(0,0,0,0.55)',
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
            className="fixed inset-0 z-[10001] modal-scrim"
            style={{
              background: isLight ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            }}
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
            <div
              data-swipess-dialog
              className={cn(
                'neo-naive w-full max-w-md h-full sm:max-h-[80vh] overflow-hidden flex flex-col pointer-events-auto',
                !isLight && 'neo-naive--dark',
              )}
              style={{
                ...panelStyle,
                borderRadius: '1.55rem 1.75rem 1.45rem 1.7rem / 1.65rem 1.4rem 1.75rem 1.5rem',
              }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0 border-b"
                style={{ borderColor: isLight ? 'rgba(20,20,20,0.12)' : 'rgba(255,255,255,0.12)' }}
              >
                <div>
                  <h2 className={cn('text-lg font-black tracking-tight', isLight ? 'text-black' : 'text-white')}>
                    {PREMIUM_FOR_EVERYONE ? 'Premium Messaging' : 'Message Tokens'}
                  </h2>
                  <p className={cn('text-xs mt-0.5', isLight ? 'text-black/55' : 'text-white/60')}>
                    {PREMIUM_FOR_EVERYONE ? (
                      <span className="font-bold text-primary">Premium · Unlimited messaging</span>
                    ) : (
                      <>You have <span className="font-bold text-primary">{tokens}</span> tokens remaining</>
                    )}
                  </p>
                </div>
                <button
                  onClick={close}
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center transition-colors border-2',
                    isLight
                      ? 'border-[#141414] bg-white text-black hover:bg-black/5'
                      : 'border-white/90 bg-[#121218] text-white hover:bg-white/10',
                  )}
                  style={{ boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.35)' }}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" strokeWidth={2.25} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-y-contain px-5 pb-16 space-y-6 pt-4">
                {PREMIUM_FOR_EVERYONE && (
                  <div
                    className={cn(
                      'relative overflow-hidden p-4 flex items-center gap-3 neo-naive-card',
                      isLight ? 'bg-white' : 'bg-[#16161e]',
                    )}
                    data-neo-naive-card
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border-2',
                        isLight ? 'border-[#141414] bg-orange-50 text-orange-600' : 'border-white/80 bg-orange-500/15 text-orange-300',
                      )}
                      style={{ boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.3)' }}
                    >
                      <Crown className="w-6 h-6" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">Premium unlocked</p>
                      <h3 className={cn('text-lg font-black tracking-tight leading-tight', isLight ? 'text-black' : 'text-white')}>
                        Unlimited Messages
                      </h3>
                      <p className={cn('text-[10px] leading-snug mt-0.5', isLight ? 'text-black/50' : 'text-white/55')}>
                        Free for everyone right now — message anyone, no tokens needed.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <p className={cn('text-xs mb-4', isLight ? 'text-black/55' : 'text-white/60')}>
                    {PREMIUM_FOR_EVERYONE
                      ? 'Messaging is free for everyone right now — no tokens needed. You can still grab a pack to support Swipess or stock up for later.'
                      : 'Tokens are used to message owners or unlock chat actions. One token = one new conversation.'}
                  </p>
                  <div className="space-y-2.5">
                    {APPLE_TOKEN_PACKAGES.map((pkg) => {
                      const meta = TIER_META[pkg.id] || TIER_META.starter;
                      const Icon = meta.icon;
                      const isPopular = pkg.badge === 'Popular' || pkg.badge === 'Best Value';
                      const pricePerToken = getPricePerToken(pkg);

                      return (
                        <motion.div
                          key={pkg.productId}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                          data-neo-naive-card
                          className={cn(
                            'relative p-4 flex items-center gap-4 overflow-visible neo-naive-card bg-gradient-to-br',
                            meta.wash,
                            isPopular && 'ring-2 ring-primary/40',
                          )}
                        >
                          {pkg.badge && (
                            <span
                              className={cn(
                                'absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.15em] border-2',
                                isLight
                                  ? 'bg-primary text-white border-[#141414]'
                                  : 'bg-primary text-white border-white/90',
                              )}
                              style={{ boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.35)' }}
                            >
                              {pkg.badge}
                            </span>
                          )}
                          <div
                            className={cn(
                              'flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border-2',
                              isLight ? 'border-[#141414] bg-white' : 'border-white/85 bg-[#1a1a22]',
                              meta.ink,
                            )}
                            style={{ boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.3)' }}
                          >
                            <Icon className="w-6 h-6" strokeWidth={2.25} aria-hidden />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
                              <span className={cn('font-black text-sm uppercase tracking-widest', isLight ? 'text-black' : 'text-white')}>
                                {pkg.name}
                              </span>
                              <span
                                className={cn(
                                  'text-[9px] font-black uppercase px-2 py-0.5 rounded-md tracking-wider border',
                                  isLight ? 'text-primary bg-primary/10 border-primary/25' : 'text-primary bg-primary/15 border-primary/30',
                                )}
                              >
                                {pkg.tokens} tokens
                              </span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-1 flex-wrap">
                              <span className={cn('font-black text-2xl tracking-tighter', isLight ? 'text-black' : 'text-white')}>
                                {formatUSD(pkg.priceUsd)}
                              </span>
                              <span className={cn('text-[10px] font-black uppercase tracking-widest', isLight ? 'text-black/45' : 'text-white/55')}>
                                USD
                              </span>
                              <span className={cn('text-[10px] font-bold ml-1', isLight ? 'text-black/45' : 'text-white/55')}>
                                {formatUSD(pricePerToken)} / tk
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              haptics.tap();
                              handlePurchase(pkg);
                            }}
                            disabled={purchasingId === pkg.productId}
                            aria-label={`Get offer: ${pkg.tokens} tokens for ${formatUSD(pkg.priceUsd)} USD`}
                            className={cn(
                              'flex-shrink-0 h-11 px-5 rounded-full font-black text-[11px] uppercase tracking-[0.15em] transition-all whitespace-nowrap border-2',
                              purchasingId === pkg.productId && 'opacity-60 cursor-not-allowed',
                              !purchasingId && 'active:scale-95 touch-manipulation',
                              isPopular
                                ? isLight
                                  ? 'bg-primary text-white border-[#141414]'
                                  : 'bg-primary text-white border-white/90'
                                : isLight
                                  ? 'bg-white text-black border-[#141414] hover:bg-black/5'
                                  : 'bg-[#1a1a22] text-white border-white/85 hover:bg-white/10',
                            )}
                            style={{
                              boxShadow: isLight ? '1.25px 1.25px 0 #141414' : '1.25px 1.25px 0 rgba(255,255,255,0.35)',
                            }}
                          >
                            {purchasingId === pkg.productId ? 'Processing...' : 'Select'}
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div
                  data-neo-naive-card
                  className="p-4 flex items-center gap-3 neo-naive-card"
                >
                  <Crown className={cn('w-6 h-6 flex-shrink-0', isLight ? 'text-primary' : 'text-primary')} strokeWidth={2.25} />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-black', isLight ? 'text-black' : 'text-white')}>Explore Premium plans</p>
                    <p className={cn('text-[11px]', isLight ? 'text-black/50' : 'text-white/55')}>See all Swipess premium options.</p>
                  </div>
                  <button
                    type="button"
                    className={cn(
                      'flex-shrink-0 h-10 px-4 rounded-full font-black text-xs uppercase tracking-wider border-2',
                      isLight ? 'bg-primary text-white border-[#141414]' : 'bg-primary text-white border-white/90',
                    )}
                    style={{ boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.35)' }}
                    onClick={() => {
                      haptics.tap();
                      close();
                      navigate('/subscription/packages');
                    }}
                    aria-label="Go to premium plans"
                  >
                    Go!
                  </button>
                </div>

                <div className="pt-2 pb-2 text-center">
                  <button
                    onClick={handleRestore}
                    className={cn(
                      'flex items-center justify-center gap-2 w-full text-[11px] font-black uppercase tracking-[0.2em] transition-colors',
                      isLight ? 'text-black/40 hover:text-black' : 'text-white/45 hover:text-white',
                    )}
                  >
                    <RefreshCcw className="w-4 h-4" strokeWidth={2.25} />
                    Restore Purchases
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export const TokensModal = memo(TokensModalComponent);
