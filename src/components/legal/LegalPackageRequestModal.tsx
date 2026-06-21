import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Scale as ScaleIcon, Send, X, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import {
  LegalPackage, categoryMeta, formatPrice, formatDuration,
} from '@/data/legalPackages';
import {
  submitLegalPackageRequest, fetchProfilePrefill, LegalRequestPayload,
} from '@/hooks/useLegalPackages';

interface LegalPackageRequestModalProps {
  open: boolean;
  pkg: LegalPackage | null;
  onClose: () => void;
}

const CONTACT_OPTIONS = [
  { id: 'phone', label: 'Phone Call' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
];

export function LegalPackageRequestModal({ open, pkg, onClose }: LegalPackageRequestModalProps) {
  const { user } = useAuth();
  const { isLight } = useAppTheme();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [loading, setLoading] = useState(false);
  const [requestType, setRequestType] = useState<'request' | 'custom_quote'>('request');
  const [situation, setSituation] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredContact, setPreferredContact] = useState('phone');

  const meta = pkg ? categoryMeta(pkg.category) : null;

  // Reset + prefill whenever a new package opens.
  useEffect(() => {
    if (open && pkg) {
      setStep('form');
      setRequestType('request');
      setSituation('');
      setPreferredContact('phone');
      if (user?.id) {
        fetchProfilePrefill(user.id, user.email).then((p) => {
          setFullName(p.fullName);
          setEmail(p.email);
          setPhone(p.phone);
        });
      }
    }
  }, [open, pkg, user?.id, user?.email]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!pkg || !meta) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    if (!situation.trim()) return;
    setLoading(true);
    triggerHaptic('medium');

    const payload: LegalRequestPayload = {
      packageId: pkg.id,
      packageName: pkg.name,
      packageCategory: pkg.category,
      quotedPrice: requestType === 'custom_quote' ? null : pkg.price,
      situation: situation.trim(),
      fullName,
      email,
      phone,
      preferredContact,
      requestType,
    };

    const res = await submitLegalPackageRequest(user.id, payload);
    setLoading(false);

    if (res.ok) {
      triggerHaptic('success');
      setStep('success');
    } else {
      triggerHaptic('error');
      // Keep the form so the user can retry.
      toast.error('Could not send your request', {
        description: res.error || 'Please check your connection and try again.',
      });
    }
  };

  const node = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto border shadow-2xl rounded-t-[2rem] sm:rounded-[2rem]',
              isLight ? 'bg-white border-black/5' : 'bg-card border-white/10',
            )}
          >
            {/* Header */}
            <div className={cn('p-6 border-b flex items-start justify-between gap-4 sticky top-0 z-10 backdrop-blur-xl',
              isLight ? 'border-black/5 bg-white/90' : 'border-white/5 bg-card/90')}>
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg', meta.accentBg)}>
                  <ScaleIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className={cn('text-lg font-black tracking-tight truncate', isLight ? 'text-black' : 'text-white')}>{pkg.name}</h3>
                  <p className={cn('text-[10px] font-bold uppercase tracking-[0.2em]', meta.accent)}>{meta.label}</p>
                </div>
              </div>
              <button onClick={onClose} className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                isLight ? 'hover:bg-black/5' : 'hover:bg-white/5')}>
                <X className="w-5 h-5 opacity-60" />
              </button>
            </div>

            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Package summary */}
                <div className={cn('rounded-2xl p-5 border space-y-4', isLight ? 'bg-black/[0.02] border-black/5' : 'bg-white/[0.03] border-white/5')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className={cn('text-3xl font-black tracking-tighter', isLight ? 'text-black' : 'text-white')}>{formatPrice(pkg.price)}</span>
                      <span className={cn('text-[11px] font-bold uppercase tracking-widest opacity-40', isLight ? 'text-black' : 'text-white')}>from</span>
                    </div>
                    <Badge variant="outline" className={cn('flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest', meta.ring, meta.accent)}>
                      <Clock className="w-3 h-3" /> {formatDuration(pkg.duration_days)}
                    </Badge>
                  </div>
                  {pkg.description && (
                    <p className={cn('text-sm leading-relaxed opacity-60', isLight ? 'text-black' : 'text-white')}>{pkg.description}</p>
                  )}
                  <div className="space-y-2 pt-1">
                    {pkg.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className={cn('w-4 h-4 shrink-0 mt-0.5', meta.accent)} />
                        <span className={cn('text-[13px] font-medium opacity-70', isLight ? 'text-black' : 'text-white')}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Request type toggle */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setRequestType('request'); }}
                    className={cn('p-4 rounded-2xl border text-left transition-all',
                      requestType === 'request'
                        ? cn(meta.accentBg, 'text-white border-transparent shadow-lg')
                        : isLight ? 'bg-white border-black/10 text-black/70' : 'bg-white/5 border-white/10 text-white/70')}
                  >
                    <Send className="w-4 h-4 mb-2" />
                    <p className="text-[11px] font-black uppercase tracking-wider">Request Package</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Book this exact package</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { triggerHaptic('light'); setRequestType('custom_quote'); }}
                    className={cn('p-4 rounded-2xl border text-left transition-all',
                      requestType === 'custom_quote'
                        ? cn(meta.accentBg, 'text-white border-transparent shadow-lg')
                        : isLight ? 'bg-white border-black/10 text-black/70' : 'bg-white/5 border-white/10 text-white/70')}
                  >
                    <Sparkles className="w-4 h-4 mb-2" />
                    <p className="text-[11px] font-black uppercase tracking-wider">Custom Quote</p>
                    <p className="text-[10px] opacity-70 mt-0.5">Tailor it to my case</p>
                  </button>
                </div>

                {/* Situation */}
                <div className="space-y-2">
                  <label className={cn('text-[10px] font-black uppercase tracking-[0.2em] ml-1', isLight ? 'text-black/50' : 'text-white/50')}>
                    Describe your situation
                  </label>
                  <Textarea
                    required
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Tell the lawyer what you need — e.g. 'I'm selling my condo in Aldea Zama and the buyer is foreign…'"
                    className={cn('min-h-[110px] rounded-2xl resize-none p-4 text-sm',
                      isLight ? 'bg-white border-black/10' : 'bg-white/5 border-white/10')}
                  />
                </div>

                {/* Contact details */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={cn('text-[10px] font-black uppercase tracking-[0.2em] ml-1', isLight ? 'text-black/50' : 'text-white/50')}>Name</label>
                    <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name"
                      className={cn('h-11 rounded-xl text-sm', isLight ? 'bg-white border-black/10' : 'bg-white/5 border-white/10')} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={cn('text-[10px] font-black uppercase tracking-[0.2em] ml-1', isLight ? 'text-black/50' : 'text-white/50')}>Phone</label>
                    <Input required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+52 984 …"
                      className={cn('h-11 rounded-xl text-sm', isLight ? 'bg-white border-black/10' : 'bg-white/5 border-white/10')} />
                  </div>
                </div>

                {/* Preferred contact */}
                <div className="space-y-2">
                  <label className={cn('text-[10px] font-black uppercase tracking-[0.2em] ml-1', isLight ? 'text-black/50' : 'text-white/50')}>Preferred contact</label>
                  <div className="flex flex-wrap gap-2">
                    {CONTACT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { triggerHaptic('light'); setPreferredContact(opt.id); }}
                        className={cn('px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border',
                          preferredContact === opt.id
                            ? cn(meta.accentBg, 'text-white border-transparent')
                            : isLight ? 'bg-white border-black/10 text-black/60' : 'bg-white/5 border-white/10 text-white/60')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !situation.trim() || !phone.trim()}
                  className={cn('w-full h-14 rounded-2xl text-white font-black uppercase tracking-[0.15em] text-xs shadow-xl active:scale-[0.98] transition-all', meta.accentBg)}
                >
                  {loading ? 'Sending…' : requestType === 'custom_quote' ? 'Request Custom Quote' : 'Send Request to Lawyer'}
                  {!loading && <Send className="w-4 h-4 ml-2" />}
                </Button>

                <p className={cn('text-[10px] text-center leading-relaxed opacity-40', isLight ? 'text-black' : 'text-white')}>
                  Your request goes to our legal team. A lawyer reviews it and contacts you to confirm details, pricing and next steps. No payment is taken now.
                </p>
              </form>
            ) : (
              <div className="p-10 flex flex-col items-center text-center space-y-6">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                  className={cn('w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-2xl', meta.accentBg)}
                >
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </motion.div>
                <div className="space-y-2">
                  <h4 className={cn('text-2xl font-black tracking-tight', isLight ? 'text-black' : 'text-white')}>Request Sent</h4>
                  <p className={cn('text-sm leading-relaxed max-w-[300px] mx-auto opacity-60', isLight ? 'text-black' : 'text-white')}>
                    Our legal team has received your request for <strong>{pkg.name}</strong>. A lawyer will contact you
                    {phone ? <> at <strong>{phone}</strong></> : ''} to discuss your situation and confirm everything.
                  </p>
                </div>
                <Button onClick={onClose} className={cn('w-full h-12 rounded-2xl text-white font-black uppercase tracking-widest text-[11px]', meta.accentBg)}>
                  Done
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(node, document.body);
}
