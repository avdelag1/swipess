import React, { useState } from 'react';
import { AlertCircle, Sparkles, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { triggerHaptic } from '@/utils/haptics';

export const PromoCodeSection = () => {
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsApplying(true);

    try {
      const { data, error } = await supabase.rpc('rpc_redeem_promo_code' as any, {
        p_code: code.trim().toUpperCase()
      });

      if (error) throw error;

      // Handle the RPC response
      const result = data as unknown as { success: boolean, message: string }[];
      const response = result?.[0];

      if (response?.success) {
        triggerHaptic('success');
        toast.success(t('promo.success', 'Code Redeemed!'), {
          description: response.message,
          icon: <Sparkles className="w-4 h-4 text-[#EB4898]" />
        });
        setCode('');
      } else {
        triggerHaptic('warning');
        toast.error(t('promo.error', 'Redemption Failed'), {
          description: response?.message || t('promo.invalid', 'Invalid promo code.'),
        });
      }
    } catch (err: any) {
      triggerHaptic('error');
      toast.error(t('promo.error', 'Redemption Failed'), {
        description: err.message || t('promo.networkError', 'Something went wrong. Please try again.'),
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={cn(
        "relative overflow-hidden rounded-[2.5rem] p-8 shadow-2xl",
        isLight ? "bg-white border border-black/5" : "bg-card/40 border border-white/5 backdrop-blur-xl"
      )}>
        {/* Background Decorative Gradient */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-gradient-to-br from-[#EB4898]/20 to-purple-500/20 blur-3xl rounded-full opacity-50 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-[#EB4898] to-purple-600 flex items-center justify-center shadow-lg shadow-[#EB4898]/30 mb-2">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          
          <div>
            <h3 className={cn("text-2xl font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>
              {t('promo.title', 'Redeem Code')}
            </h3>
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-70 mt-1">
              {t('promo.subtitle', 'Unlock Tokens & Premium Packages')}
            </p>
          </div>

          <form onSubmit={handleApplyCode} className="w-full max-w-sm mt-6 space-y-4">
            <div className="relative">
              <Input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t('promo.placeholder', 'ENTER CODE (e.g. VIP2026)')}
                className={cn(
                  "h-14 px-6 text-center text-lg font-black tracking-[0.2em] uppercase rounded-2xl transition-all",
                  isLight 
                    ? "bg-black/5 border-transparent text-black placeholder:text-black/30 focus-visible:ring-[#EB4898]/50 focus-visible:bg-white" 
                    : "bg-black/50 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-[#EB4898]/50"
                )}
                disabled={isApplying}
              />
            </div>
            
            <Button
              type="submit"
              disabled={!code.trim() || isApplying}
              className={cn(
                "w-full h-14 rounded-2xl text-[13px] font-black uppercase italic tracking-widest transition-all",
                code.trim() && !isApplying
                  ? "bg-gradient-to-r from-[#EB4898] to-purple-600 text-white hover:scale-[1.02] shadow-lg shadow-[#EB4898]/25"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isApplying ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{t('promo.verifying', 'VERIFYING...')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>{t('promo.apply', 'APPLY CODE')}</span>
                </div>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 mt-6 px-4 py-3 rounded-xl bg-[#EB4898]/5 border border-[#EB4898]/10 text-left w-full max-w-sm">
            <AlertCircle className="w-5 h-5 text-[#EB4898] shrink-0" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#EB4898]/80 leading-relaxed">
              {t('promo.info', 'Codes can grant you free tokens or premium access. Ensure you type it exactly as received.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
