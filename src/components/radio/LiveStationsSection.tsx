import { Globe, Loader2, Play, Radio as RadioIcon, Volume2 } from 'lucide-react';
import { useRadio } from '@/contexts/RadioContext';
import { useLiveRadioStations } from '@/hooks/useLiveRadioStations';
import { pingStationClick } from '@/utils/radioBrowser';
import { CityLocation } from '@/types/radio';
import { triggerHaptic } from '@/utils/haptics';

interface LiveStationsSectionProps {
  search: string;
  city: CityLocation | 'all' | 'favorites';
  accent?: string;
}

/**
 * Real, live worldwide stations from Radio-Browser, shown beneath the curated
 * local list. Plays straight through the existing radio player.
 */
export function LiveStationsSection({ search, city, accent = '#FF3D00' }: LiveStationsSectionProps) {
  const { play, state } = useRadio();
  const { data: stations = [], isLoading, isError, isFetching } = useLiveRadioStations({ search, city });

  const active = search.trim().length >= 2 || (city !== 'all' && city !== 'favorites');
  if (!active) return null;

  return (
    <section className="mt-7">
      <div className="flex items-center gap-2 mb-3">
        <Globe size={15} style={{ color: accent }} />
        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-white/90">Live worldwide</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/35">via radio-browser</span>
        {isFetching && !isLoading && <Loader2 className="w-3 h-3 animate-spin text-white/40" />}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-white/50 text-xs py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Finding live stations…
        </div>
      )}

      {isError && (
        <p className="text-xs text-white/40 py-4">Couldn&apos;t reach the live directory right now.</p>
      )}

      {!isLoading && !isError && stations.length === 0 && (
        <p className="text-xs text-white/40 py-4">No live stations found here yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {stations.map((s) => {
          const isCurrent = state.currentStation?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => { triggerHaptic('medium'); pingStationClick(s.id); play(s); }}
              className="flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98]"
              style={{
                background: isCurrent ? `${accent}22` : 'rgba(255,255,255,0.04)',
                borderColor: isCurrent ? accent : 'rgba(255,255,255,0.1)',
              }}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/[0.06]">
                {s.albumArt ? (
                  <img
                    src={s.albumArt}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <RadioIcon size={16} className="text-white/40" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-white truncate">{s.name}</p>
                <p className="text-[11px] text-white/50 truncate">
                  {[s.genre, s.description].filter(Boolean).join(' · ') || s.frequency}
                </p>
              </div>
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: accent }}
              >
                {isCurrent && state.isPlaying
                  ? <Volume2 size={14} className="text-white" />
                  : <Play size={14} className="text-white ml-0.5" fill="currentColor" />}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
