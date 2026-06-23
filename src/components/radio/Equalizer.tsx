import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { EQ_BANDS, EQ_PRESETS, useRadio } from '@/contexts/RadioContext';
import { triggerHaptic } from '@/utils/haptics';

interface EqualizerProps {
  open: boolean;
  onClose: () => void;
  accent?: string;
}

/**
 * 5-band graphic equalizer sheet. Drives the live Web Audio filter chain in
 * RadioContext — presets for one-tap tuning, plus per-band fine control.
 */
export function Equalizer({ open, onClose, accent = '#FF3D00' }: EqualizerProps) {
  const { eqGains, eqPreset, setEqBand, applyEqPreset } = useRadio();
  const presets = Object.keys(EQ_PRESETS);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={onClose}
            className="fixed inset-0 z-[10001] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-[28px] border-t border-white/10 bg-[#0c0c10]/70 backdrop-blur-3xl px-5 pt-5"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)' }}
          >
            {/* Custom slider thumb styles for WebKit */}
            <style>{`
              .eq-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: ${accent};
                cursor: pointer;
                box-shadow: 0 0 10px ${accent}40;
                margin-top: -6px; /* align center with track */
              }
              .eq-slider::-webkit-slider-runnable-track {
                width: 100%;
                height: 4px;
                cursor: pointer;
                background: rgba(255,255,255,0.1);
                border-radius: 2px;
              }
            `}</style>
            
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} style={{ color: accent }} />
                <h3 className="text-white font-black uppercase tracking-[0.18em] text-sm">Equalizer</h3>
              </div>
              <button
                onClick={onClose}
                aria-label="Close equalizer"
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:scale-90 transition-transform hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-6">
              {presets.map((p) => {
                const active = eqPreset === p;
                return (
                  <button
                    key={p}
                    onClick={() => { triggerHaptic('light'); applyEqPreset(p); }}
                    className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border transition-all active:scale-95"
                    style={active
                      ? { background: accent, borderColor: accent, color: '#fff', boxShadow: `0 0 12px ${accent}40` }
                      : { background: 'transparent', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                  >
                    {p}
                  </button>
                );
              })}
              {eqPreset === 'Custom' && (
                <span
                  className="px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                  style={{ background: accent, borderColor: accent, color: '#fff', boxShadow: `0 0 12px ${accent}40` }}
                >
                  Custom
                </span>
              )}
            </div>

            {/* Bands */}
            <div className="flex items-stretch justify-between gap-2 h-48 mt-8">
              {EQ_BANDS.map((band, i) => {
                const gain = eqGains[i] ?? 0;
                return (
                  <div key={band.freq} className="flex-1 flex flex-col items-center gap-3 h-full">
                    <span
                      className="text-[10px] font-black tabular-nums"
                      style={{ color: gain === 0 ? 'rgba(255,255,255,0.4)' : accent }}
                    >
                      {gain > 0 ? '+' : ''}{gain}
                    </span>
                    <input
                      type="range"
                      min={-12}
                      max={12}
                      step={1}
                      value={gain}
                      onChange={(e) => setEqBand(i, Number(e.target.value))}
                      aria-label={`${band.label} hertz band`}
                      className="eq-slider flex-1 cursor-pointer"
                      style={{ 
                        writingMode: 'vertical-lr', 
                        direction: 'rtl', 
                        width: 20, 
                        WebkitAppearance: 'none',
                        background: 'transparent'
                      }}
                    />
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{band.label}</span>
                  </div>
                );
              })}
            </div>

            <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              Tune the live stream · saved automatically
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
