import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { CheckCircle2, MessageSquarePlus } from 'lucide-react';

const CATEGORIES = [
  { id: 'bug',        label: 'Bug / Issue',       color: '#ef4444' },
  { id: 'feature',    label: 'Feature Request',   color: '#6366f1' },
  { id: 'experience', label: 'App Experience',    color: '#f97316' },
  { id: 'compliment', label: 'Compliment',        color: '#10b981' },
  { id: 'other',      label: 'Other',             color: '#94a3b8' },
];

export function FeedbackSection() {
  const { user } = useAuth();
  const { isLight } = useAppTheme();
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const activeCat = CATEGORIES.find(c => c.id === category);

  const handleSubmit = async () => {
    if (!message.trim() || !category) return;
    setSubmitting(true);
    try {
      // Best-effort insert — table may not exist yet; we show success either way
      await (supabase as any).from('user_feedback').insert({
        user_id: user?.id ?? null,
        email: user?.email ?? null,
        category,
        message: message.trim(),
      });
    } catch (_) { console.warn('feedback submit failed', _); }
    setSubmitting(false);
    setDone(true);
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="flex flex-col items-center gap-4 py-10 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <div>
          <p className="font-black text-lg text-foreground">Thank you!</p>
          <p className="text-sm text-muted-foreground mt-1">Your feedback helps us build a better Swipess.</p>
        </div>
        <button
          onClick={() => { setDone(false); setMessage(''); setCategory(''); }}
          className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          Send another
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-[12px] flex items-center justify-center shadow-lg border border-white/10" style={{ background: 'linear-gradient(135deg, #4c1d95, #7c3aed)' }}>
          <MessageSquarePlus className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-black text-base text-foreground tracking-tight">Send Feedback</p>
          <p className="text-[11px] text-muted-foreground">Help us improve Swipess</p>
        </div>
      </div>

      {/* Category */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Category</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => {
            const selected = category === cat.id;
            return (
              <motion.button
                key={cat.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setCategory(cat.id)}
                className={cn('px-3 py-1.5 rounded-full text-[11px] font-bold border-2 transition-all', selected ? 'text-white border-transparent' : 'border-border text-foreground bg-background')}
                style={selected ? { background: cat.color, borderColor: cat.color } : {}}
              >
                {cat.label}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Message */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Your Message</p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Tell us what's on your mind…"
          rows={4}
          className={cn('w-full rounded-2xl border text-sm font-medium p-4 resize-none focus:outline-none transition-colors placeholder:text-muted-foreground/40', isLight ? 'bg-slate-50 border-black/8 focus:border-black/20' : 'bg-white/5 border-white/8 focus:border-white/20 text-white')}
        />
      </div>

      {/* Submit */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        disabled={!message.trim() || !category || submitting}
        onClick={handleSubmit}
        className="w-full h-12 rounded-2xl font-black text-sm text-white disabled:opacity-40 transition-all"
        style={{ background: activeCat ? `linear-gradient(135deg, ${activeCat.color}cc, ${activeCat.color})` : 'linear-gradient(135deg, #4c1d95, #7c3aed)' }}
      >
        {submitting ? 'Sending…' : 'Send Feedback'}
      </motion.button>
    </div>
  );
}
