import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useRadio } from '@/contexts/RadioContext';
import { getStationById, getStationsByCity } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { StationDrawer } from '@/components/radio/retro/StationDrawer';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { ArrowLeft, Heart, SkipBack, SkipForward, Play, Pause, Volume2, ListMusic, Star, Shuffle } from 'lucide-react';

export default function DJTurntableRadio() {
  const navigate = useNavigate();
  const {
    state, play, togglePlayPause, togglePower, changeStation,
    setCity, setVolume, toggleFavorite, isStationFavorite, shuffleAndPlay
  } = useRadio();
  const { isDark } = useAppTheme();

  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'all' | 'favorites'>('all');

  const hasInitRef = useRef(false);
  useEffect(() => {
    if (hasInitRef.current) return;
    hasInitRef.current = true;
    if (!state.isPoweredOn) { togglePower(); triggerHaptic('medium'); }
    if (!state.isPlaying) play();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      switch (e.code) {
        case 'Space': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowRight': changeStation('next'); break;
        case 'ArrowLeft': changeStation('prev'); break;
        case 'ArrowUp': setVolume(Math.min(1, state.volume + 0.05)); break;
        case 'ArrowDown': setVolume(Math.max(0, state.volume - 0.05)); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [state.volume, togglePlayPause, changeStation, setVolume]);

  const cityStations = useMemo(() => getStationsByCity(state.currentCity), [state.currentCity]);

  const handleCitySelect = useCallback((city: CityLocation) => {
    setCity(city);
    triggerHaptic('light');
  }, [setCity]);

  const handleStationSelect = useCallback((stationId: string) => {
    const station = getStationById(stationId);
    if (station) play(station);
    triggerHaptic('medium');
    setShowDrawer(false);
  }, [play]);

  const bg = isDark ? '#080808' : '#f5f5f5';
  const glowColor = isDark ? 'rgba(255,60,0,0.12)' : 'rgba(255,60,0,0.07)';
  const textPrimary = isDark ? '#ffffff' : '#000000';
  const textMuted = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const btnBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const btnBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  const isFav = isStationFavorite(state.currentStation?.id || '');

  return (
    <div
      className="relative w-full h-full flex flex-col overflow-hidden"
      style={{ background: bg }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 40%, ${glowColor}, transparent 70%)`,
        }}
      />

      {/* Top bar */}
      <div
        className="relative z-10 w-full flex items-center justify-between px-5"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingBottom: 12 }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: textPrimary }}
        >
          <ArrowLeft size={18} />
        </button>

        <button
          onClick={() => { triggerHaptic('medium'); navigate('/radio/directory'); }}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-90 transition-transform"
          style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: textPrimary }}
        >
          <ListMusic size={18} />
        </button>
      </div>

      {/* Center — station info */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">

        {/* Live badge */}
        <div className="flex items-center gap-2 mb-10">
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: '#FF3B30',
              boxShadow: state.isPlaying ? '0 0 8px #FF3B30' : 'none',
              animation: state.isPlaying ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.35em]"
            style={{ color: textMuted }}
          >
            {state.currentCity || 'Miami'}
          </span>
        </div>

        {/* Frequency */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStation?.id || 'default'}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.25, 0, 0, 1] }}
            className="flex flex-col items-center"
          >
            <span
              className="font-black italic leading-none select-none"
              style={{
                fontSize: 'clamp(5rem, 22vw, 7rem)',
                color: textPrimary,
                letterSpacing: '-0.04em',
                textShadow: isDark ? '0 0 60px rgba(255,255,255,0.08)' : 'none',
              }}
            >
              {state.currentStation?.frequency || '94.2'}
            </span>

            <span
              className="text-[10px] font-bold uppercase tracking-[0.5em] mt-2"
              style={{ color: '#FF3B30', opacity: 0.8 }}
            >
              FM Stereo
            </span>

            <span
              className="text-sm font-bold uppercase tracking-[0.18em] mt-5 text-center"
              style={{ color: textPrimary, opacity: 0.75 }}
            >
              {state.currentStation?.name || 'Discovery Radio'}
            </span>
          </motion.div>
        </AnimatePresence>

        {/* Waveform bars — only when playing */}
        <div className="flex items-end gap-[3px] mt-10 h-6">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full"
              style={{ background: '#FF3B30', opacity: state.isPlaying ? 0.7 : 0.15 }}
              animate={state.isPlaying ? {
                height: ['6px', `${8 + Math.random() * 16}px`, '6px'],
              } : { height: '4px' }}
              transition={{
                duration: 0.5 + Math.random() * 0.5,
                repeat: Infinity,
                repeatType: 'mirror',
                delay: i * 0.06,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom — controls + volume */}
      <div
        className="relative z-10 flex flex-col items-center gap-8 px-8"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)' }}
      >
        {/* Controls row */}
        <div className="flex items-center gap-6">
          {/* Heart */}
          <button
            onClick={() => { if (state.currentStation) { toggleFavorite(state.currentStation.id); triggerHaptic('success'); } }}
            className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: btnBg, border: `1px solid ${btnBorder}` }}
          >
            <Heart
              size={18}
              style={{ color: isFav ? '#FF3B30' : textMuted }}
              fill={isFav ? '#FF3B30' : 'none'}
            />
          </button>

          {/* Skip back */}
          <button
            onClick={() => { changeStation('prev'); triggerHaptic('medium'); }}
            className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: textPrimary }}
          >
            <SkipBack size={22} fill="currentColor" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={() => { togglePlayPause(); triggerHaptic('heavy'); }}
            className="w-20 h-20 rounded-full flex items-center justify-center active:scale-90 transition-transform shadow-xl"
            style={{ background: textPrimary }}
          >
            {state.isPlaying
              ? <Pause size={28} style={{ color: bg }} fill={bg} />
              : <Play size={28} style={{ color: bg, marginLeft: 3 }} fill={bg} />
            }
          </button>

          {/* Skip forward */}
          <button
            onClick={() => { changeStation('next'); triggerHaptic('medium'); }}
            className="w-14 h-14 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: textPrimary }}
          >
            <SkipForward size={22} fill="currentColor" />
          </button>

          <button
            onClick={() => { triggerHaptic('medium'); shuffleAndPlay(cityStations); }}
            className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ 
              background: state.isShuffle ? 'rgba(255,61,0,0.2)' : btnBg, 
              border: `1px solid ${state.isShuffle ? 'rgba(255,61,0,0.4)' : btnBorder}`, 
              color: state.isShuffle ? '#FF3B30' : textPrimary 
            }}
            title="Shuffle City Stations"
          >
            <Shuffle size={18} className={state.isShuffle ? "animate-spin-slow" : ""} />
          </button>

          {/* Favorites */}
          <button
            onClick={() => { setDrawerMode('favorites'); setShowDrawer(true); triggerHaptic('medium'); }}
            className="w-12 h-12 rounded-full flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: textPrimary }}
          >
            <Star size={18} fill="currentColor" />
          </button>
        </div>

        {/* Volume */}
        <div className="w-full flex items-center gap-3">
          <Volume2 size={14} style={{ color: textMuted, flexShrink: 0 }} />
          <div className="relative flex-1 h-8 flex items-center">
            <div
              className="absolute w-full h-[3px] rounded-full"
              style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${state.volume * 100}%`,
                  background: textPrimary,
                  opacity: 0.6,
                }}
              />
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVolume(val);
                if (Math.floor(val * 20) !== Math.floor(state.volume * 20)) triggerHaptic('light');
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              aria-label="Volume"
            />
            <div
              className="absolute w-4 h-4 rounded-full pointer-events-none shadow-md"
              style={{ left: `calc(${state.volume * 100}% - 8px)`, background: textPrimary }}
            />
          </div>
          <span
            className="text-[10px] font-bold tabular-nums w-8 text-right"
            style={{ color: textMuted }}
          >
            {Math.round(state.volume * 100)}
          </span>
        </div>
      </div>

      <StationDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        isFavoritesView={drawerMode === 'favorites'}
        currentCity={state.currentCity}
        currentStation={state.currentStation}
        isPlaying={state.isPlaying}
        favorites={state.favorites}
        onCitySelect={handleCitySelect}
        onStationSelect={handleStationSelect}
        onToggleFavorite={toggleFavorite}
        onShuffle={shuffleAndPlay}
      />
    </div>
  );
}
