import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRadio } from '@/contexts/RadioContext';
import { getStationsByCity, cityThemes } from '@/data/radioStations';
import { CityLocation } from '@/types/radio';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Heart, Shuffle, ListMusic } from 'lucide-react';

export default function RadioPlayer() {
  const { state, error, togglePlayPause, changeStation, setCity, toggleFavorite, play, setVolume, toggleShuffle, playFavorites, setSkin } = useRadio();
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const cityStations = getStationsByCity(state.currentCity);
  const currentStationIndex = cityStations.findIndex(s => s.id === state.currentStation?.id);
  const allCities = Object.keys(cityThemes) as CityLocation[];

  // Station dial value (0 to stations.length - 1)
  const [dialValue, setDialValue] = useState(currentStationIndex);

  useEffect(() => {
    setDialValue(currentStationIndex);
  }, [currentStationIndex]);

  // Handle dial - snaps to nearest station
  const handleDialChange = useCallback((value: number) => {
    const station = cityStations[value];
    if (station && station.id !== state.currentStation?.id) {
      play(station);
    }
  }, [cityStations, play, state.currentStation?.id]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowRight': changeStation('next'); break;
        case 'ArrowLeft': changeStation('prev'); break;
        case 'ArrowUp': e.preventDefault(); setVolume(Math.min(1, state.volume + 0.1)); break;
        case 'ArrowDown': e.preventDefault(); setVolume(Math.max(0, state.volume - 0.1)); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, changeStation, setVolume, state.volume]);

  // No loading spinner - UI renders immediately
  // Error is shown inline if stream fails

  return (
    <div className="fixed inset-0 text-white flex flex-col overflow-hidden" style={{ background: cityThemes[state.currentCity].gradient }}>
      {/* Background Overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] -z-10" />

      {/* Header - UI chrome */}
      <div className="flex items-center justify-between px-4 pt-12 pb-2">
        <button onClick={() => window.history.back()} className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/10 transition-transform active:scale-95">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase">Swipess Radio</span>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`w-1.5 h-1.5 rounded-full ${state.isPlaying ? 'bg-[#E4007C] animate-pulse shadow-[0_0_8px_#E4007C]' : 'bg-white/20'}`} />
            <span className="text-[11px] font-medium tracking-wide">
              {state.isPlaying ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
        </div>
        <div className="w-10 h-10 flex items-center justify-center" />
      </div>

      {/* Center - Vinyl & Controls */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">

        {/* Quick Controls - Shuffle, Playlist, Favorites, Settings, Mic */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <button
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition-all active:scale-90 ${state.isShuffle ? 'bg-white/30 shadow-lg' : 'bg-white/5 border border-white/10'}`}
          >
            <Shuffle className={`w-5 h-5 ${state.isShuffle ? 'text-white' : 'text-white/40'}`} />
          </button>

          <button
            onClick={() => setShowPlaylist(true)}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90"
          >
            <ListMusic className="w-5 h-5 text-white/40" />
          </button>

          <button
            onClick={() => state.currentStation && toggleFavorite(state.currentStation.id)}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90"
          >
            <Heart className={`w-5 h-5 ${state.currentStation && state.favorites.includes(state.currentStation.id) ? 'text-[#E4007C]' : 'text-white/40'}`}
              fill={state.currentStation && state.favorites.includes(state.currentStation.id) ? "currentColor" : "none"} />
          </button>

          {/* Skin Selector */}
          <button
            onClick={() => {
              const skins: Array<'modern' | 'vinyl' | 'retro'> = ['modern', 'vinyl', 'retro'];
              const currentIndex = skins.indexOf(state.skin as any);
              const nextSkin = skins[(currentIndex + 1) % skins.length];
              setSkin(nextSkin);
            }}
            className="p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90"
            title={`Skin: ${state.skin}`}
          >
            <div className="w-5 h-5 relative flex items-center justify-center">
              {state.skin === 'vinyl' && <div className="w-4 h-4 rounded-full border-2 border-white/60" />}
              {state.skin === 'retro' && <div className="w-4 h-3 border-2 border-white/60 rounded-sm" />}
              {state.skin === 'modern' && <div className="w-3.5 h-3.5 rounded-sm border-2 border-white/60" />}
            </div>
          </button>
        </div>

        {/* Vinyl Record - Skin varies */}
        <div className="relative group">
          {/* Buffering/Loading Indicator */}
          <AnimatePresence>
            {(error?.includes('Buffering') || error?.includes('timeout')) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute -inset-8 z-20 flex items-center justify-center pointer-events-none"
              >
                <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-[#E4007C] animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className={`relative mb-10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] ${state.skin === 'vinyl' ? 'w-56 h-56 rounded-full' :
              state.skin === 'retro' ? 'w-60 h-40 rounded-xl' :
                'w-52 h-52 rounded-[2.5rem]'
              }`}
            style={{
              background: state.skin === 'vinyl'
                ? 'radial-gradient(circle at center, #333 0%, #111 40%, #222 50%, #111 70%, #000 100%)'
                : state.skin === 'retro'
                  ? 'linear-gradient(135deg, #A0522D 0%, #6B4423 50%, #8B4513 100%)'
                  : `linear-gradient(135deg, ${cityThemes[state.currentCity].primaryColor} 0%, #1a1a1a 100%)`,
              border: state.skin === 'retro' ? '8px solid #DEB887' : '1px solid rgba(255,255,255,0.15)',
            }}
            animate={{
              rotate: state.isPlaying ? 360 : 0,
              scale: state.isPlaying ? [1, 1.03, 1] : 1
            }}
            transition={{
              rotate: { duration: state.isPlaying ? (state.skin === 'retro' ? 10 : 5) : 0, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {state.skin === 'vinyl' && (
              <>
                {/* Vinyl grooves */}
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border border-white/5"
                    style={{ margin: `${(i + 1) * 6}px` }}
                  />
                ))}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-20" />
              </>
            )}

            {state.skin === 'retro' && (
              <>
                {/* Cassette details */}
                <div className="absolute inset-x-8 top-6 bottom-6 bg-black/90 rounded flex items-center justify-center gap-10 border border-white/10 shadow-inner">
                  <div className="w-12 h-12 rounded-full border-4 border-dashed border-white/10 animate-spin-slow" />
                  <div className="w-12 h-12 rounded-full border-4 border-dashed border-white/10 animate-spin-slow" />
                </div>
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-2 bg-white/10 rounded-full shadow-inner" />
              </>
            )}

            {state.skin === 'modern' && (
              <>
                <div className="absolute inset-6 rounded-[2rem] border border-white/5" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/60 rounded-[2.5rem]" />
              </>
            )}

            {/* Center label - Station info */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white flex flex-col items-center justify-center shadow-2xl ${state.skin === 'vinyl' ? 'w-20 h-20' :
              state.skin === 'retro' ? 'w-16 h-16' :
                'w-20 h-20'
              }`}>
              <span className="text-base font-black text-black leading-none mb-0.5">{state.currentStation?.frequency || '--.-'}</span>
              <span className="text-[8px] text-black/50 font-bold uppercase tracking-widest">{state.currentStation?.genre || '---'}</span>
            </div>

            {/* Center hole */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`rounded-full bg-black shadow-lg ${state.skin === 'retro' ? 'w-4 h-4' : 'w-2.5 h-2.5'}`} />
            </div>
          </motion.div>
        </div>

        {/* Station Info */}
        <div className="text-center mb-8">
          <motion.h1
            key={state.currentStation?.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-black text-white mb-2 tracking-tight"
          >
            {state.currentStation?.name || 'Select Station'}
          </motion.h1>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setShowCitySelector(true)}
              className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 active:scale-95 transition-all"
            >
              <span className="text-[11px] font-bold tracking-widest text-white/80 uppercase">
                {cityThemes[state.currentCity].name}
              </span>
            </button>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-[11px] font-bold text-white/40 tracking-widest uppercase">
              {state.currentStation?.genre || 'MUSIC'}
            </span>
          </div>
        </div>

        {/* Status/Error Messages */}
        <div className="h-6 flex items-center justify-center mb-4">
          <AnimatePresence mode="wait">
            {error ? (
              <motion.span
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-xs font-medium text-[#E4007C] tracking-wide"
              >
                {error}
              </motion.span>
            ) : state.isPlaying ? (
              <motion.div
                key="playing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-baseline gap-1"
              >
                <div className="flex gap-[2px]">
                  {[1, 2, 3, 4].map(i => (
                    <motion.div
                      key={i}
                      className="w-0.5 h-2 bg-[#E4007C]"
                      animate={{ height: [4, 10, 4] }}
                      transition={{ duration: 0.5, delay: i * 0.1, repeat: Infinity }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase ml-1">Streaming Live</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Station Dial */}
        <div className="w-full max-w-xs mb-10 px-4">
          <input
            type="range"
            min="0"
            max={cityStations.length - 1}
            value={dialValue}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setDialValue(val);
              handleDialChange(val);
            }}
            className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer radio-slider radio-dial mb-3"
            style={{
              background: `linear-gradient(to right, #E4007C ${(dialValue / (cityStations.length - 1)) * 100}%, rgba(255,255,255,0.05) ${(dialValue / (cityStations.length - 1)) * 100}%)`
            }}
          />
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter truncate max-w-[80px]">{cityStations[0]?.name}</span>
            <div className="bg-white/10 px-2 py-0.5 rounded text-[8px] font-bold text-white/40">DIAL</div>
            <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter truncate max-w-[80px]">{cityStations[cityStations.length - 1]?.name}</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls - Area */}
      <div className="px-8 pb-14 bg-gradient-to-t from-black/40 to-transparent">
        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-8 mb-10">
          <button onClick={() => changeStation('prev')} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90 active:bg-white/10">
            <SkipBack className="w-6 h-6" />
          </button>

          <motion.button
            onClick={togglePlayPause}
            className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {state.isPlaying ? <Pause className="w-10 h-10" fill="currentColor" /> : <Play className="w-10 h-10 ml-1.5" fill="currentColor" />}
          </motion.button>

          <button onClick={() => changeStation('next')} className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90 active:bg-white/10">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-4 max-w-sm mx-auto">
          <button onClick={() => setVolume(state.volume > 0 ? 0 : 0.7)}>
            {state.volume === 0 ? <VolumeX className="w-4 h-4 text-white/40" /> : <Volume2 className="w-4 h-4 text-white/60" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={state.volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer radio-slider"
            style={{
              background: `linear-gradient(to right, #fff ${state.volume * 100}%, rgba(255,255,255,0.05) ${state.volume * 100}%)`
            }}
          />
          <span className="text-[10px] font-bold text-white/30 w-6">{Math.round(state.volume * 100)}</span>
        </div>
      </div>

      {/* City Selector Modal */}
      <AnimatePresence>
        {showCitySelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-4 inset-y-16 bg-black/95 z-50 flex flex-col rounded-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <span className="font-semibold">Select City</span>
              <button onClick={() => setShowCitySelector(false)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {allCities.map((city) => (
                <button
                  key={city}
                  onClick={() => { setCity(city); setShowCitySelector(false); }}
                  className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all active:scale-95 ${state.currentCity === city ? 'bg-white/20 border border-white/20 shadow-lg' : 'bg-white/5 border border-white/5'}`}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-inner"
                    style={{ background: cityThemes[city].gradient }}
                  >
                    <span>{cityThemes[city].name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm tracking-wide uppercase">{cityThemes[city].name}</p>
                    <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase">{getStationsByCity(city).length} Channels</p>
                  </div>
                  {state.currentCity === city && (
                    <div className="w-2 h-2 rounded-full bg-[#E4007C] shadow-[0_0_8px_#E4007C]" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Playlist Modal */}
      <AnimatePresence>
        {showPlaylist && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 inset-y-16 bg-black/95 backdrop-blur-xl z-50 flex flex-col rounded-[2rem] border border-white/10 shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <span className="font-black text-sm tracking-[0.2em] uppercase">Playlist</span>
              <button onClick={() => setShowPlaylist(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90">
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
              {/* Play Favorites */}
              {state.favorites.length > 0 && (
                <button
                  onClick={() => { playFavorites(); setShowPlaylist(false); }}
                  className="w-full p-4 rounded-2xl bg-white/10 border border-white/20 flex items-center gap-4 mb-4 transition-all active:scale-95 shadow-lg"
                >
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <Heart className="w-6 h-6 text-[#E4007C]" fill="currentColor" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-black text-sm tracking-wide uppercase">Favorites</p>
                    <p className="text-white/40 text-[10px] font-bold tracking-widest uppercase">{state.favorites.length} Saved Stations</p>
                  </div>
                </button>
              )}

              {/* Current City Stations */}
              <div className="px-2 pb-2">
                <span className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase">{cityThemes[state.currentCity].name} Stations</span>
              </div>
              {cityStations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => { play(station); setShowPlaylist(false); }}
                  className={`w-full p-3.5 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] ${state.currentStation?.id === station.id ? 'bg-white/20 border border-white/20' : 'bg-white/5 border border-white/5'}`}
                >
                  <div className="w-11 h-11 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white font-bold text-[10px] tracking-tighter">
                    {station.frequency}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="font-bold text-sm truncate uppercase tracking-tight">{station.name}</p>
                    <p className="text-white/40 text-[10px] font-medium tracking-widest uppercase truncate">{station.genre}</p>
                  </div>
                  {state.favorites.includes(station.id) && (
                    <Heart className="w-4 h-4 text-[#E4007C] drop-shadow-[0_0_5px_rgba(228,0,124,0.5)]" fill="currentColor" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
