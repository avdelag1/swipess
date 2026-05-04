import { useState, useMemo } from 'react';
import useAppTheme from '@/hooks/useAppTheme';
import { motion } from 'framer-motion';
import { Search, QrCode, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = ['All', 'Cafe', 'Restaurant', 'Gym', 'Services', 'Retail', 'Other'];

interface BusinessListProps {
  partners: any[];
  onShowQR: () => void;
}

export function BusinessList({ partners, onShowQR }: BusinessListProps) {
  const { isLight } = useAppTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    return partners.filter(p => {
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'All' || p.category?.toLowerCase() === category.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [partners, search, category]);

  return (
    <div className="mt-2">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search partners..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={cn(
            "w-full pl-8 pr-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/30",
            isLight ? "bg-black/[0.03] border-black/[0.05] text-black placeholder:text-black/30" : "bg-muted/50 border border-border/50 text-foreground placeholder:text-muted-foreground"
          )}
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all',
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : isLight ? 'bg-black/[0.05] text-black/60' : 'bg-muted/60 text-muted-foreground'
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Partners list */}
      <div className="mt-3 space-y-2">
        {filtered.map(partner => (
          <motion.div
            key={partner.id}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all shadow-sm",
              isLight ? "bg-white border-black/[0.05]" : "bg-card border-border/40"
            )}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {partner.logo_url ? (
                <img src={partner.logo_url} alt={partner.name} className="w-full h-full object-cover rounded-xl" />
              ) : (
                <Store size={18} className="text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold truncate", isLight ? "text-black" : "text-foreground")}>{partner.name}</p>
              <p className={cn("text-[10px] capitalize", isLight ? "text-black/40" : "text-muted-foreground")}>{partner.category}</p>
              {partner.custom_discount_text && (
                <p className="text-[10px] text-emerald-500 font-medium mt-0.5">{partner.custom_discount_text}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                {partner.discount_percent}% OFF
              </span>
              <button
                onClick={onShowQR}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold"
              >
                <QrCode size={10} /> Show QR
              </button>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Store size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">No partners found</p>
          </div>
        )}
      </div>
    </div>
  );
}


