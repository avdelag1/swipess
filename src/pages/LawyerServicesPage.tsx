import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowLeft, Briefcase, Building2, Check, ChevronRight, Clock, FileLock2,
  FileText, Gavel, HeartCrack, Home, Landmark, type LucideIcon, Scale,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { haptics } from '@/utils/microPolish';
import { AtmosphericLayer } from '@/components/AtmosphericLayer';
import { useLegalPackages } from '@/hooks/useLegalPackages';
import {
  CATEGORY_ORDER, categoryMeta, CONTRACT_TYPES, formatDuration,
  formatPrice, LegalPackage,
} from '@/data/legalPackages';
import { LegalPackageRequestModal } from '@/components/legal/LegalPackageRequestModal';

const ICONS: Record<string, LucideIcon> = {
  Building2, Home, Gavel, HeartCrack, FileLock2, Briefcase, Scale, Landmark,
};

function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Scale;
  return <Icon className={className} />;
}

export default function LawyerServicesPage() {
  const navigate = useNavigate();
  const { isLight } = useAppTheme();
  const { data: packages = [], isLoading } = useLegalPackages();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedPackage, setSelectedPackage] = useState<LegalPackage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Categories that actually have packages, in canonical order.
  const categories = useMemo(() => {
    const present = new Set(packages.map((p) => p.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [packages]);

  const visiblePackages = useMemo(() => {
    const list = activeCategory === 'all' ? packages : packages.filter((p) => p.category === activeCategory);
    return [...list].sort((a, b) => a.price - b.price);
  }, [packages, activeCategory]);

  const openRequest = (pkg: LegalPackage) => {
    haptics.tap();
    setSelectedPackage(pkg);
    setModalOpen(true);
  };

  const requestContractDraft = (contractId: string) => {
    const ct = CONTRACT_TYPES.find((c) => c.id === contractId);
    if (!ct) return;
    // Reuse the request modal with a synthetic package describing the contract.
    openRequest({
      id: `contract-${ct.id}`,
      name: `Contract: ${ct.title}`,
      category: ct.category,
      description: ct.description,
      price: 0,
      duration_days: null,
      features: [`${ct.fields} fields prepared by a lawyer`, 'Reviewed and ready to sign', 'Delivered digitally'],
    });
  };

  return (
    <div className="w-full bg-background relative min-h-screen">
      <Helmet>
        <title>Legal Services | Swipess</title>
        <meta name="description" content="Browse legal service packages and request a lawyer — property sales, rentals, evictions, divorce, business and more." />
      </Helmet>

      <AtmosphericLayer variant="indigo" opacity={0.18} />

      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 pt-6 pb-56 relative z-10">

        <button
          onClick={() => navigate(-1)}
          className={cn(
            'flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.4em] italic mb-8 transition-all hover:translate-x-[-4px] hover:opacity-70',
            isLight ? 'text-black' : 'text-white',
          )}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Hero */}
        <div className="space-y-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[10px] font-black uppercase tracking-widest px-4 py-2">
              Legal Services
            </Badge>
          </div>
          <h1 className={cn('text-4xl sm:text-6xl font-black uppercase italic tracking-tighter leading-[0.9]', isLight ? 'text-black' : 'text-white')}>
            Pick a Package.<br />We Handle the Law.
          </h1>
          <p className={cn('text-base font-bold opacity-60 italic max-w-2xl leading-relaxed', isLight ? 'text-black' : 'text-white')}>
            Choose the legal service you need and request it in one tap. A lawyer reviews your case, confirms the details and pricing, and takes it from there.
          </p>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => { haptics.tap(); setActiveCategory('all'); }}
            className={cn('px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border',
              activeCategory === 'all'
                ? (isLight ? 'bg-white !text-slate-900 border-black/20 shadow-md' : 'bg-white/10 !text-white border-white/20 shadow-md')
                : (isLight ? 'bg-white/40 !text-slate-900 border-black/5 hover:border-black/20' : 'bg-white/5 !text-white border-white/10 hover:border-white/20')
            )}
          >
            All Services
          </button>
          {categories.map((cat) => {
            const meta = categoryMeta(cat);
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { haptics.tap(); setActiveCategory(cat); }}
                className={cn('flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border',
                  active
                    ? (isLight ? 'bg-white !text-slate-900 border-black/20 shadow-md' : 'bg-white/10 !text-white border-white/20 shadow-md')
                    : (isLight ? 'bg-white/40 !text-slate-900 border-black/5 hover:border-black/20' : 'bg-white/5 !text-white border-white/10 hover:border-white/20')
                )}
              >
                <CategoryIcon name={meta.icon} className="w-3.5 h-3.5" />
                {meta.label}
              </button>
            );
          })}
        </div>

        {/* Packages grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={cn('h-64 rounded-[2rem] animate-pulse', isLight ? 'bg-black/5' : 'bg-white/5')} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visiblePackages.map((pkg, i) => {
              const meta = categoryMeta(pkg.category);
              return (
                <motion.button
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => openRequest(pkg)}
                  className={cn(
                    'group text-left p-6 rounded-[2rem] border transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl active:scale-[0.98] flex flex-col',
                    isLight ? 'bg-white border-black/5 shadow-sm hover:border-black/10' : 'bg-white/[0.04] border-white/5 hover:border-white/10',
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 border',
                      isLight ? 'bg-white border-black/10 !text-slate-900' : 'bg-white/10 border-white/10 !text-white'
                    )}>
                      <CategoryIcon name={meta.icon} className="w-6 h-6" />
                    </div>
                    <Badge variant="outline" className={cn('flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest', isLight ? 'border-black/10 text-black/60' : 'border-white/10 text-white/60')}>
                      <Clock className="w-3 h-3" /> {formatDuration(pkg.duration_days)}
                    </Badge>
                  </div>

                  <h3 className={cn('text-lg font-black uppercase italic tracking-tight leading-tight', isLight ? 'text-black' : 'text-white')}>{pkg.name}</h3>
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest mt-1 opacity-50', isLight ? 'text-black' : 'text-white')}>{meta.label}</p>

                  {pkg.description && (
                    <p className={cn('text-[13px] leading-relaxed opacity-60 mt-3', isLight ? 'text-black' : 'text-white')}>{pkg.description}</p>
                  )}

                  <div className={cn('mt-4 pt-4 border-t space-y-2 flex-1', isLight ? 'border-black/5' : 'border-white/5')}>
                    {pkg.features.slice(0, 3).map((f, j) => (
                      <div key={j} className="flex items-start gap-2">
                        <Check className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', isLight ? 'text-black/40' : 'text-white/40')} />
                        <span className={cn('text-[11px] font-medium opacity-70', isLight ? 'text-black' : 'text-white')}>{f}</span>
                      </div>
                    ))}
                    {pkg.features.length > 3 && (
                      <span className={cn('text-[10px] font-black uppercase tracking-widest opacity-40 pl-5', isLight ? 'text-black' : 'text-white')}>
                        +{pkg.features.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className={cn('mt-5 pt-4 border-t flex flex-col gap-3', isLight ? 'border-black/5' : 'border-white/5')}>
                    <div>
                      <span className={cn('text-[9px] font-black uppercase tracking-widest opacity-50 block', isLight ? 'text-black' : 'text-white')}>From</span>
                      <span className={cn('text-2xl font-black tracking-tighter', isLight ? 'text-black' : 'text-white')}>{formatPrice(pkg.price)}</span>
                    </div>
                    <div className={cn('flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm transition-transform group-hover:scale-105 w-full justify-center border', 
                      isLight ? 'bg-white text-black border-black/10' : 'bg-white/10 text-white border-white/10'
                    )}>
                      Request <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Contract types */}
        <div className="mt-16 space-y-6">
          <div className="flex items-center gap-4">
            <FileText className={cn('w-5 h-5', isLight ? 'text-black/40' : 'text-white/40')} />
            <h2 className={cn('text-sm font-black uppercase tracking-[0.3em] italic', isLight ? 'text-black/50' : 'text-white/50')}>Contracts We Prepare</h2>
            <div className={cn('h-px flex-1', isLight ? 'bg-black/10' : 'bg-white/10')} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CONTRACT_TYPES.map((ct) => {
              const meta = categoryMeta(ct.category);
              return (
                <div
                  key={ct.id}
                  className={cn('p-5 rounded-2xl border flex flex-col gap-3', isLight ? 'bg-white border-black/5' : 'bg-white/[0.03] border-white/5')}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md', meta.accentBg)}>
                      <CategoryIcon name={meta.icon} className="w-5 h-5" />
                    </div>
                    <h3 className={cn('text-sm font-black uppercase italic tracking-tight leading-tight', isLight ? 'text-black' : 'text-white')}>{ct.title}</h3>
                  </div>
                  <p className={cn('text-[12px] leading-relaxed opacity-50 flex-1', isLight ? 'text-black' : 'text-white')}>{ct.description}</p>
                  <button
                    onClick={() => requestContractDraft(ct.id)}
                    className={cn('flex items-center justify-between text-[10px] font-black uppercase tracking-widest pt-2 border-t transition-opacity hover:opacity-100 opacity-70',
                      isLight ? 'border-black/5 text-black' : 'border-white/5 text-white')}
                  >
                    Request draft <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal documents + disclaimer */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <button
            onClick={() => { haptics.tap(); navigate('/legal'); }}
            className={cn('p-6 rounded-2xl border flex items-center gap-4 transition-all hover:translate-y-[-2px] active:scale-95 text-left',
              isLight ? 'bg-white border-black/5 shadow-sm' : 'bg-white/[0.04] border-white/5')}
          >
            <div className="w-11 h-11 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-md shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className={cn('text-sm font-black uppercase italic tracking-tight', isLight ? 'text-black' : 'text-white')}>Terms, Privacy & Policies</h4>
              <p className={cn('text-[11px] font-bold opacity-40', isLight ? 'text-black' : 'text-white')}>Read the legal documents</p>
            </div>
            <ChevronRight className="w-4 h-4 opacity-30 ml-auto shrink-0" />
          </button>

          <div className={cn('lg:col-span-2 p-6 rounded-2xl border', isLight ? 'bg-black/[0.02] border-black/5' : 'bg-white/[0.02] border-white/5')}>
            <p className={cn('text-[11px] font-bold leading-relaxed opacity-40', isLight ? 'text-black' : 'text-white')}>
              Requesting a package sends your details to our legal team — it is not a payment. A lawyer will review your case, confirm scope and pricing (packages can be tailored to your situation), and arrange next steps with you directly. Prices shown are starting points in USD.
            </p>
          </div>
        </div>
      </div>

      <LegalPackageRequestModal
        open={modalOpen}
        pkg={selectedPackage}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
