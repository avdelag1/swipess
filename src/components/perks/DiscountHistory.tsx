import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, Zap, Calendar } from 'lucide-react';

interface DiscountHistoryProps {
  redemptions: any[];
}

export function DiscountHistory({ redemptions }: DiscountHistoryProps) {
  const totalSaved = useMemo(() =>
    redemptions.reduce((sum, r) => sum + (Number(r.amount_saved) || 0), 0),
    [redemptions]
  );

  const exportCSV = useCallback(() => {
    const header = 'Date,Business,Discount %,Amount Saved,Note\n';
    const rows = redemptions.map(r => {
      const date = new Date(r.redeemed_at).toLocaleDateString();
      const biz = (r.business_partners as any)?.name || 'Unknown';
      return `${date},"${biz}",${r.discount_percent},${r.amount_saved || 0},"${r.business_note || ''}"`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-perks-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [redemptions]);

  return (
    <div className="mt-2">
      {/* Summary */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Discount History</h3>
          <p className="text-[10px] text-muted-foreground">{redemptions.length} redemptions · ${totalSaved.toFixed(0)} saved</p>
        </div>
        {redemptions.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted/60 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <Download size={12} /> Export
          </button>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-0.5">
        {redemptions.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap size={16} className="text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{(r.business_partners as any)?.name || 'Partner'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <Calendar size={9} /> {new Date(r.redeemed_at).toLocaleDateString()}
                </span>
                <span className="text-[10px] font-bold text-emerald-500">{r.discount_percent}% off</span>
              </div>
              {r.business_note && (
                <p className="text-[10px] text-muted-foreground/80 mt-1 italic">"{r.business_note}"</p>
              )}
            </div>
            <div className="text-right shrink-0">
              {r.amount_saved ? (
                <p className="text-sm font-bold text-emerald-500">${Number(r.amount_saved).toFixed(0)}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground">—</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {redemptions.length === 0 && (
        <div className="text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
            <Zap size={24} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">No discounts yet</p>
          <p className="text-xs text-muted-foreground mt-1">Show your QR code at a partner business to get started</p>
        </div>
      )}
    </div>
  );
}


