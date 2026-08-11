import { memo } from 'react';
import { motion } from 'framer-motion';
import { Film, Megaphone, Sparkles, Upload, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';

/**
 * Full-screen end-of-feed card — onboarding for event promoters.
 * Mentions commercial video (up to 1 min) and routes to /client/advertise.
 */
export const PromoteCTACard = memo(({ onPromote }: { onPromote: () => void }) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const features = [
    {
      icon: Film,
      title: 'Video commercials',
      desc: 'Upload clips up to 1 minute — same reel-style feed users swipe',
    },
    {
      icon: Upload,
      title: 'Photos & covers',
      desc: 'Crop, quality, and poster frames so your event looks sharp',
    },
    {
      icon: Zap,
      title: 'Direct WhatsApp leads',
      desc: 'Seekers tap your card and message you instantly',
    },
  ];

  return (
    <div
      className={cn(
        'relative w-full h-full flex flex-col justify-end overflow-hidden',
        isLight ? 'bg-[#f6f4f1]' : 'bg-[#070708]',
      )}
    >
      {/* Full-bleed atmosphere — not a flat panel */}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? 'radial-gradient(ellipse 90% 70% at 20% 10%, rgba(249,115,22,0.22), transparent 55%), radial-gradient(ellipse 80% 60% at 90% 80%, rgba(14,165,233,0.14), transparent 50%), linear-gradient(165deg, #faf8f5 0%, #eee8e0 100%)'
            : 'radial-gradient(ellipse 90% 70% at 15% 5%, rgba(255,77,0,0.35), transparent 55%), radial-gradient(ellipse 70% 50% at 95% 90%, rgba(14,165,233,0.18), transparent 45%), linear-gradient(165deg, #0c0c0e 0%, #050506 100%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div
        className="relative z-10 px-6 pb-10 flex flex-col gap-6"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 40px)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-black/35 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">
              Swipess Events
            </span>
          </div>

          <h2
            className={cn(
              'text-[2.6rem] sm:text-5xl font-black leading-[0.92] tracking-tighter italic uppercase',
              isLight ? 'text-[#121212]' : 'text-white',
            )}
          >
            Put your night
            <br />
            <span className="bg-gradient-to-r from-[#FF4D00] to-[#38bdf8] bg-clip-text text-transparent not-italic">
              on the feed
            </span>
          </h2>

          <p
            className={cn(
              'text-[15px] font-medium leading-snug max-w-[20rem]',
              isLight ? 'text-black/55' : 'text-white/60',
            )}
          >
            Promote parties, dinners, and brands with photo + video commercials — reviewed in under 24h.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="space-y-2.5"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className={cn(
                'flex items-start gap-3 rounded-2xl px-3.5 py-3 border',
                isLight
                  ? 'bg-white/70 border-black/8'
                  : 'bg-white/[0.06] border-white/10',
              )}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-orange-500/25 to-sky-500/20 border border-white/10">
                <f.icon className="w-4.5 h-4.5 text-orange-400" />
              </div>
              <div className="min-w-0 pt-0.5">
                <div className={cn('text-sm font-black tracking-tight', isLight ? 'text-black' : 'text-white')}>
                  {f.title}
                </div>
                <div className={cn('text-xs leading-snug mt-0.5', isLight ? 'text-black/50' : 'text-white/50')}>
                  {f.desc}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: 0.14 }}
          className="space-y-3"
        >
          <button
            type="button"
            onClick={() => {
              triggerHaptic('medium');
              onPromote();
            }}
            className="w-full py-4.5 rounded-[1.75rem] font-black text-white flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#FF4D00] to-[#ea580c] shadow-[0_14px_40px_rgba(255,77,0,0.35)] active:scale-[0.98] transition-transform"
            data-testid="btn-promote-event"
          >
            <Megaphone className="w-5 h-5" />
            Request promotion
          </button>
          <p className={cn('text-center text-[11px] font-bold', isLight ? 'text-black/35' : 'text-white/35')}>
            Free to apply · From $4.99/week after approval · Video up to 1 min
          </p>
        </motion.div>
      </div>
    </div>
  );
});
