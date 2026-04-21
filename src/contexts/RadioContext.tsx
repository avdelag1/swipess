import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RadioStation, CityLocation, RadioPlayerState } from '@/types/radio';
import { getStationsByCity, getStationById, radioStations } from '@/data/radioStations';
import { logger } from '@/utils/prodLogger';

/** Fisher-Yates shuffle — returns a new shuffled array, never starting with excludeId */
function shuffleArray<T extends { id: string }>(arr: T[], excludeId?: string): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Move the excluded station away from position 0 to avoid immediate repeat
  if (excludeId && a.length > 1 && a[0].id === excludeId) {
    const swapIdx = 1 + Math.floor(Math.random() * (a.length - 1));
    [a[0], a[swapIdx]] = [a[swapIdx], a[0]];
  }
  return a;
}

interface RadioContextType {
  state: RadioPlayerState;
  loading: boolean;
  error: string | null;
  play: (station?: RadioStation) => Promise<void>;
  pause: () => void;
  togglePlayPause: () => void;
  togglePower: () => void;
  changeStation: (direction: 'next' | 'prev') => void;
  setCity: (city: CityLocation) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleFavorite: (stationId: string) => void;
  isStationFavorite: (stationId: string) => boolean;
  playPlaylist: (stationIds: string[]) => void;
  playFavorites: () => void;
  setMiniPlayerMode: (mode: 'expanded' | 'minimized' | 'closed') => void;
  getFrequencyData: () => Uint8Array;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<RadioPlayerState>({
    isPlaying: false,
    isPoweredOn: false,
    currentStation: null,
    currentCity: 'tulum',
    volume: 0.7,
    isShuffle: false,
    favorites: [],
    deadStationIds: [], // Fresh start each session — no permanent blacklist
    miniPlayerMode: (localStorage.getItem('NEXUS DISCOVERY_radio_mini_player_mode') as 'expanded' | 'minimized' | 'closed') || 'closed',
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Audio Context for Visualizer
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array>(new Uint8Array(0));

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
      audioRef.current.preload = 'auto';
      audioRef.current.crossOrigin = "anonymous";
    }

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
        errorTimeoutRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Track failed stations to avoid infinite loops and identify dead ones
  const failedStationsRef = useRef<Set<string>>(new Set());
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStationRef = useRef<RadioStation | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentStationRef.current = state.currentStation;
  }, [state.currentStation]);

  // Shuffle queue: pre-shuffled list of ALL stations
  const shuffleQueueRef = useRef<RadioStation[]>([]);
  const shuffleIndexRef = useRef<number>(0);

  // Filter out dead stations from the master list
  const activeStations = useMemo(() => {
    return radioStations.filter(s => !state.deadStationIds.includes(s.id));
  }, [state.deadStationIds]);

  // Refs to hold latest callbacks
  const changeStationRef = useRef<(direction: 'next' | 'prev') => void>(() => {});

  // Set up audio event listeners ONCE
  useEffect(() => {
    if (!audioRef.current) return;

    const handleTrackEnded = () => changeStationRef.current('next');

    // CRITICAL: Re-entrant guard prevents infinite error loops.
    // Setting audio.src = '' fires another 'error' event synchronously,
    // so without this flag the handler recurses until the stack overflows.
    let handlingError = false;
    let errorCount = 0;
    let lastErrorTime = 0;

    const handleAudioError = (_e: Event) => {
      if (handlingError) return;
      handlingError = true;

      const audio = audioRef.current;

      const now = Date.now();
      if (now - lastErrorTime < 3000) {
        errorCount++;
      } else {
        errorCount = 1;
      }
      lastErrorTime = now;

      // ⚡ TURBO BLACKOUT: Bail after 12 consecutive rapid errors (survive localized glitches)
      if (errorCount > 12) {
        setError('Global radio outage — please try again later');
        errorCount = 0;
        if (audio) {
          audio.removeEventListener('error', handleAudioError);
          audio.pause();
          try { audio.src = ''; } catch {/* intentional */ }
          audio.addEventListener('error', handleAudioError);
        }
        handlingError = false;
        setState(prev => ({ ...prev, isPlaying: false }));
        return;
      }

      setError('Station unavailable - skipping...');

      if (audio) {
        audio.removeEventListener('error', handleAudioError);
        audio.pause();
        try { audio.src = ''; } catch {/* intentional */ }
        audio.addEventListener('error', handleAudioError);
      }

      // Add to temporary blacklist only (30s) — no permanent kills
      const currentId = currentStationRef.current?.id;
      if (currentId) {
        failedStationsRef.current.add(currentId);
        setTimeout(() => failedStationsRef.current.delete(currentId), 30000);
      }

      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
        changeStationRef.current('next');
      }, 400); // ⚡ SPEED OF LIGHT: Half the recovery time

      handlingError = false;
    };

    const handleCanPlay = () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      setError(null);
    };

    const handleStalled = () => {
      logger.warn('[RadioPlayer] Stream stalled');
      setError('Buffering...');
    };

    const handlePlaying = () => {
      setError(null);
      errorCount = 0;
    };

    audioRef.current.addEventListener('ended', handleTrackEnded);
    audioRef.current.addEventListener('error', handleAudioError);
    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('stalled', handleStalled);
    audioRef.current.addEventListener('playing', handlePlaying);

    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      audioRef.current?.removeEventListener('ended', handleTrackEnded);
      audioRef.current?.removeEventListener('error', handleAudioError);
      audioRef.current?.removeEventListener('canplay', handleCanPlay);
      audioRef.current?.removeEventListener('stalled', handleStalled);
      audioRef.current?.removeEventListener('playing', handlePlaying);
    };
  }, []);

  // Load user preferences
  useEffect(() => {
    loadUserPreferences();
  }, [user?.id]);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = state.volume;
  }, [state.volume]);

  const loadUserPreferences = async () => {
    const defaultStations = getStationsByCity('tulum');
    const defaultStation = defaultStations.length > 0 ? defaultStations[0] : null;

    if (!user?.id) {
      if (defaultStation) setState(prev => ({ ...prev, currentStation: defaultStation }));
      setLoading(false);
      return;
    }

    setState(prev => ({ ...prev, currentStation: defaultStation || prev.currentStation }));

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.warn('[RadioPlayer] Error loading preferences:', error);
        setLoading(false);
        return;
      }

      if (data) {
        const currentStationId = (data as any).radio_current_station_id;
        let currentStation = currentStationId ? getStationById(currentStationId) : null;
        if (!currentStation) currentStation = defaultStation;

        setState(prev => ({
          ...prev,
          currentStation: currentStation || defaultStation,
          isPoweredOn: (data as any).radio_is_powered_on ?? prev.isPoweredOn
        }));
      }
    } catch (err) {
      logger.info('[RadioPlayer] Error loading preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (updates: Partial<RadioPlayerState>) => {
    if (!user?.id) return;
    try {
      const dbUpdates: any = {};
      if (updates.currentStation !== undefined) dbUpdates.radio_current_station_id = updates.currentStation?.id || null;
      if (updates.isPoweredOn !== undefined) dbUpdates.radio_is_powered_on = updates.isPoweredOn;
      if (updates.volume !== undefined) dbUpdates.radio_volume = updates.volume;
      if (updates.isShuffle !== undefined) dbUpdates.radio_is_shuffle = updates.isShuffle;
      if (updates.favorites !== undefined) dbUpdates.radio_favorites = updates.favorites;
      
      await supabase.from('profiles').update(dbUpdates).eq('user_id', user.id);
    } catch (err) {
      logger.info('[RadioPlayer] Error saving preferences:', err);
    }
  };

  // Recursion depth guard to prevent infinite call stack
  const playDepthRef = useRef(0);

  // Concurrency guard for play attempts
  const isPlayingRef = useRef(false);

  const play = useCallback(async (station?: RadioStation) => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    
    const targetStation = station || state.currentStation;
    if (!targetStation || !audioRef.current) {
      isPlayingRef.current = false;
      return;
    }

    // CRITICAL: Prevent infinite recursion when all stations fail
    if (playDepthRef.current >= 10) {
      playDepthRef.current = 0;
      // Clear failed stations cache so they can be retried
      failedStationsRef.current.clear();
      setError('No stations available right now');
      setState(prev => ({ ...prev, isPlaying: false }));
      isPlayingRef.current = false;
      return;
    }

    if (failedStationsRef.current.has(targetStation.id)) {
      logger.info(`[RadioPlayer] Skipping recently failed station: ${targetStation.id}`);
      // Already in temp blacklist; it auto-clears after 30s
      if (failedStationsRef.current.size > 20) { const first = failedStationsRef.current.values().next().value; if (first) failedStationsRef.current.delete(first); }
      playDepthRef.current++;
      isPlayingRef.current = false;
      changeStationRef.current('next');
      return;
    }

    // Reset depth on successful attempt start
    playDepthRef.current = 0;

    try {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);

      if (audioRef.current.src !== targetStation.streamUrl) {
        audioRef.current.src = targetStation.streamUrl;
        audioRef.current.load();

        setState(prev => ({
          ...prev,
          currentStation: targetStation,
          currentCity: targetStation.city,
          // 🚀 SENTIENT VISIBILITY: Automatically expand when music starts
          miniPlayerMode: prev.miniPlayerMode === 'closed' ? 'closed' : 'expanded'
        }));
        savePreferences({ currentStation: targetStation, currentCity: targetStation.city });
      }

      // 📡 TURBO TIMEOUT: 7s is plenty for modern streams
      loadTimeoutRef.current = setTimeout(() => {
        logger.warn(`[RadioPlayer] Station ${targetStation.id} timeout, skipping`);
        failedStationsRef.current.add(targetStation.id);
        setTimeout(() => failedStationsRef.current.delete(targetStation.id), 20000);
        setError('Station timeout, switching...');
        setTimeout(() => {
          setError(null);
          changeStationRef.current('next');
        }, 300);
      }, 7000);

      try {
        // ⚡ TURBO ENGINE: Immediate AudioContext creation on first play
        if (!audioContextRef.current && audioRef.current) {
          try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
              latencyHint: 'interactive'
            });
            analyzerRef.current = audioContextRef.current.createAnalyser();
            analyzerRef.current.fftSize = 256;
            analyzerRef.current.smoothingTimeConstant = 0.7; // Smoother visualizer, less CPU
            
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            sourceRef.current.connect(analyzerRef.current);
            analyzerRef.current.connect(audioContextRef.current.destination);
            dataArrayRef.current = new Uint8Array(analyzerRef.current.frequencyBinCount);
          } catch (e) {
            logger.error('[RadioTurbo] Context init failed:', e);
          }
        } else if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        await audioRef.current.play();
      } catch (playErr) {
        // CRITICAL FALLBACK: If "anonymous" crossOrigin caused a CORS blockage, 
        // strip it and play normally (visualizer will be flat, but audio works).
        if (audioRef.current && audioRef.current.crossOrigin !== "") {
          logger.warn('[RadioPlayer] CORS play failure — retrying without visualizer support');
          audioRef.current.crossOrigin = "";
          await audioRef.current.play();
        } else {
          throw playErr;
        }
      }

      setState(prev => ({ ...prev, isPlaying: true }));
      setError(null);
      isPlayingRef.current = false;

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      // 🚀 SPEED OF LIGHT: PWA Media Session Marketing Integration
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: targetStation.name,
          artist: "NEXUS DISCOVERY: Find Your Direct Deal",
          album: "Swipe & Save Big",
          artwork: [
            { src: targetStation.albumArt || '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          ]
        });

        navigator.mediaSession.setActionHandler('play', () => { audioRef.current?.play(); setState(prev => ({ ...prev, isPlaying: true })); });
        navigator.mediaSession.setActionHandler('pause', () => { audioRef.current?.pause(); setState(prev => ({ ...prev, isPlaying: false })); });
        navigator.mediaSession.setActionHandler('previoustrack', () => changeStationRef.current('prev'));
        navigator.mediaSession.setActionHandler('nexttrack', () => changeStationRef.current('next'));
      }
    } catch (err) {
      isPlayingRef.current = false;
      logger.error('[RadioPlayer] Playback error:', err);
      failedStationsRef.current.add(targetStation.id);
      setError('Failed to play station, switching...');

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      setTimeout(() => {
        setError(null);
        changeStationRef.current('next');
      }, 500);
    }
  }, [state.currentStation]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) pause();
    else {
      if (!state.isPoweredOn) {
        setState(prev => ({ ...prev, isPoweredOn: true }));
        savePreferences({ isPoweredOn: true });
      }
      play();
    }
  }, [state.isPlaying, state.isPoweredOn, play, pause]);

  const togglePower = useCallback(() => {
    const newPower = !state.isPoweredOn;
    setState(prev => ({
      ...prev,
      isPoweredOn: newPower,
      isPlaying: newPower ? prev.isPlaying : false,
      miniPlayerMode: newPower ? prev.miniPlayerMode : 'closed'
    }));

    if (!newPower && audioRef.current) audioRef.current.pause();
    savePreferences({ isPoweredOn: newPower });
  }, [state.isPoweredOn]);

  const changeStation = useCallback((direction: 'next' | 'prev') => {
    if (state.isShuffle) {
      let nextIndex: number;
      if (direction === 'next') {
        nextIndex = shuffleIndexRef.current + 1;
        if (nextIndex >= shuffleQueueRef.current.length) {
          const lastId = shuffleQueueRef.current[shuffleQueueRef.current.length - 1]?.id;
          shuffleQueueRef.current = shuffleArray(radioStations, lastId);
          nextIndex = 0;
        }
      } else {
        nextIndex = Math.max(0, shuffleIndexRef.current - 1);
      }
      shuffleIndexRef.current = nextIndex;
      const station = shuffleQueueRef.current[nextIndex];
      if (station) play(station);
      return;
    }

    const city = state.currentCity;
    const stations = activeStations.filter(s => s.city === city);
    if (stations.length === 0) return;

    const currentIndex = state.currentStation ? stations.findIndex(s => s.id === state.currentStation?.id) : -1;
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % stations.length
      : (currentIndex - 1 + stations.length) % stations.length;

    play(stations[nextIndex]);
  }, [state.currentStation, state.currentCity, state.isShuffle, activeStations, play]);

  // markStationAsDead removed — no permanent blacklisting, only temp 30s blacklist

  changeStationRef.current = changeStation;

  const setCity = useCallback((city: CityLocation) => {
    if (city === state.currentCity) return;
    const stations = getStationsByCity(city);
    setState(prev => ({ ...prev, currentCity: city }));
    savePreferences({ currentCity: city });
    if (stations.length > 0) play(stations[0]);
  }, [state.currentCity, play]);

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    // 🚀 SPEED OF LIGHT: Apply local state IMMEDIATELY for zero lag
    setState(prev => ({ ...prev, volume: clamped }));
    
    // Debounce DB sync to prevent network congestion during slider dragging
    if (volSyncTimeoutRef.current) clearTimeout(volSyncTimeoutRef.current);
    volSyncTimeoutRef.current = setTimeout(() => {
      savePreferences({ volume: clamped });
    }, 1000);
  }, []);

  const volSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleShuffle = useCallback(() => {
    const newShuffle = !state.isShuffle;
    if (newShuffle) {
      const currentId = state.currentStation?.id;
      shuffleQueueRef.current = shuffleArray(activeStations, currentId);
      shuffleIndexRef.current = 0;
    } else {
      shuffleQueueRef.current = [];
      shuffleIndexRef.current = 0;
    }
    setState(prev => ({ ...prev, isShuffle: newShuffle }));
    savePreferences({ isShuffle: newShuffle });
  }, [state.isShuffle, state.currentStation]);

  

  const toggleFavorite = useCallback((stationId: string) => {
    setState(prev => {
      const isFavorite = prev.favorites.includes(stationId);
      const newFavorites = isFavorite
        ? prev.favorites.filter(id => id !== stationId)
        : [...prev.favorites, stationId];
      savePreferences({ favorites: newFavorites });
      return { ...prev, favorites: newFavorites };
    });
  }, []);

  const playPlaylist = useCallback((stationIds: string[]) => {
    if (stationIds.length === 0) return;
    const firstStation = getStationById(stationIds[0]);
    if (firstStation) play(firstStation);
  }, [play]);

  const playFavorites = useCallback(() => playPlaylist(state.favorites), [state.favorites, playPlaylist]);

  const setMiniPlayerMode = useCallback((mode: 'expanded' | 'minimized' | 'closed') => {
    setState(prev => ({ ...prev, miniPlayerMode: mode }));
    localStorage.setItem('NEXUS DISCOVERY_radio_mini_player_mode', mode);
  }, []);

  const isStationFavorite = useCallback((stationId: string) => state.favorites.includes(stationId), [state.favorites]);

  const getFrequencyData = useCallback((): Uint8Array => {
    if (analyzerRef.current && dataArrayRef.current) {
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current as any);
      return dataArrayRef.current;
    }
    return new Uint8Array(0);
  }, []);

  const value = useMemo(() => ({
    state,
    loading,
    error,
    play,
    pause,
    togglePlayPause,
    togglePower,
    changeStation,
    setCity,
    setVolume,
    toggleShuffle,
    toggleFavorite,
    isStationFavorite,
    playPlaylist,
    playFavorites,
    setMiniPlayerMode,
    getFrequencyData,
  }), [state, loading, error, play, pause, togglePlayPause, togglePower, changeStation, setCity, setVolume, toggleShuffle, toggleFavorite, isStationFavorite, playPlaylist, playFavorites, setMiniPlayerMode, getFrequencyData]);

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}

