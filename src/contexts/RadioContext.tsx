import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RadioStation, CityLocation, RadioPlayerState } from '@/types/radio';
import { getStationsByCity, getStationById, radioStations } from '@/data/radioStations';
import { logger } from '@/utils/prodLogger';
import { appToast } from '@/utils/appNotification';

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

/**
 * Reorder a shuffled queue so recently-played stations are pushed to the back.
 * Guarantees no station from `recent` appears in the first N slots (where
 * N = min(recent.length, queue.length-1)). Prevents 2-3 quick repeats.
 */
function avoidRecent<T extends { id: string }>(queue: T[], recent: string[]): T[] {
  if (queue.length <= 1 || recent.length === 0) return queue;
  const recentSet = new Set(recent);
  const fresh: T[] = [];
  const stale: T[] = [];
  for (const item of queue) {
    if (recentSet.has(item.id)) stale.push(item);
    else fresh.push(item);
  }
  return [...fresh, ...stale];
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
  toggleShuffle: (stations?: RadioStation[]) => void;
  shuffleAndPlay: (stations?: RadioStation[]) => void;
  toggleFavorite: (stationId: string) => void;
  isStationFavorite: (stationId: string) => boolean;
  playPlaylist: (stationIds: string[]) => void;
  playFavorites: () => void;
  setMiniPlayerMode: (mode: 'expanded' | 'minimized' | 'closed') => void;
  getFrequencyData: () => Uint8Array;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

const fallbackRadioState: RadioPlayerState = {
  isPlaying: false,
  isPoweredOn: false,
  currentStation: null,
  currentCity: 'tulum',
  volume: 0.7,
  isShuffle: false,
  favorites: [],
  deadStationIds: [],
  miniPlayerMode: 'closed',
};

const fallbackRadioContext: RadioContextType = {
  state: fallbackRadioState,
  loading: false,
  error: null,
  play: async () => {},
  pause: () => {},
  togglePlayPause: () => {},
  togglePower: () => {},
  changeStation: () => {},
  setCity: () => {},
  setVolume: () => {},
  toggleShuffle: () => {},
  shuffleAndPlay: () => {},
  toggleFavorite: () => {},
  isStationFavorite: () => false,
  playPlaylist: () => {},
  playFavorites: () => {},
  setMiniPlayerMode: () => {},
  getFrequencyData: () => new Uint8Array(0),
};

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
    miniPlayerMode: (localStorage.getItem('Swipess_radio_mini_player_mode') as 'expanded' | 'minimized' | 'closed') || 'closed',
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
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
        watchdogIntervalRef.current = null;
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

  // Reconnect supervisor: silently retry the same station on transient drops
  // before falling through to the existing skip-to-next path.
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const RECONNECT_BACKOFF_MS = [1000, 2000, 4000];
  const MAX_RECONNECT_ATTEMPTS = 3;

  // Heartbeat watchdog: detects frozen currentTime / suspended AudioContext
  const watchdogIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastCurrentTimeRef = useRef(0);
  const lastCurrentTimeSampleRef = useRef(0);

  // Reset the rapid-error counter after sustained healthy playback (60s).
  const healthyPlaybackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Setter exposed by the audio listener effect so other refs can clear the count.
  const resetErrorCountRef = useRef<() => void>(() => {});

  // Stable refs so the once-only audio listener effect always sees the latest
  // values without re-attaching listeners on every state change.
  const isPlayingFlagRef = useRef(false);
  const tryReconnectRef = useRef<() => boolean>(() => false);

  // Keep ref in sync with state
  useEffect(() => {
    currentStationRef.current = state.currentStation;
  }, [state.currentStation]);

  // Shuffle queue: pre-shuffled list of ALL stations
  const shuffleQueueRef = useRef<RadioStation[]>([]);
  const shuffleIndexRef = useRef<number>(0);
  // Track the last N played station ids so shuffle never repeats within window
  const recentPlayedRef = useRef<string[]>([]);
  const RECENT_WINDOW = 8;
  const pushRecent = (id: string) => {
    const arr = recentPlayedRef.current.filter(x => x !== id);
    arr.push(id);
    while (arr.length > RECENT_WINDOW) arr.shift();
    recentPlayedRef.current = arr;
  };

  // Filter out dead stations from the master list
  const activeStations = useMemo(() => {
    return radioStations.filter(s => !state.deadStationIds.includes(s.id));
  }, [state.deadStationIds]);

  // Refs to hold latest callbacks
  const changeStationRef = useRef<(direction: 'next' | 'prev') => void>(() => {});

  // Attempt silent reconnect of the SAME station. Returns true if a retry was
  // scheduled; false if we exhausted the budget and the caller should fall
  // through to skip-to-next. Uses the audio element directly to bypass the
  // play() user-intent guard — internal recovery never needs a fresh gesture.
  const tryReconnectSameStation = useCallback((): boolean => {
    const station = currentStationRef.current;
    if (!station) return false;
    if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
      reconnectAttemptsRef.current = 0;
      return false;
    }
    const delay = RECONNECT_BACKOFF_MS[reconnectAttemptsRef.current] ?? 4000;
    reconnectAttemptsRef.current += 1;
    setError(`Reconnecting (${reconnectAttemptsRef.current}/${MAX_RECONNECT_ATTEMPTS})...`);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        // Force a fresh src load — same URL, but reset internal buffer state.
        audio.src = station.streamUrl;
        audio.load();
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {/* ignore */});
        }
        audio.play().then(() => {
          setError(null);
          setState(prev => ({ ...prev, isPlaying: true }));
        }).catch(() => {
          // Let the error handler escalate (next reconnect attempt or skip).
        });
      } catch {/* ignore */}
    }, delay);
    return true;
  }, []);

  // Keep refs in sync so the once-only listener effect can read latest values.
  useEffect(() => { isPlayingFlagRef.current = state.isPlaying; }, [state.isPlaying]);
  useEffect(() => { tryReconnectRef.current = tryReconnectSameStation; }, [tryReconnectSameStation]);

  // Set up audio event listeners ONCE
  useEffect(() => {
    if (!audioRef.current) return;

    // CRITICAL: Re-entrant guard prevents infinite error loops.
    // Setting audio.src = '' fires another 'error' event synchronously,
    // so without this flag the handler recurses until the stack overflows.
    let handlingError = false;
    let errorCount = 0;
    let lastErrorTime = 0;
    let lastToastTime = 0;

    resetErrorCountRef.current = () => { errorCount = 0; };

    const handleTrackEnded = () => {
      // Live streams should never "end" — treat as a network blip and try to
      // silently reconnect the same station before skipping.
      if (isPlayingFlagRef.current && tryReconnectRef.current()) return;
      changeStationRef.current('next');
    };

    const handleAudioError = (_e: Event) => {
      if (handlingError) return;
      handlingError = true;

      const audio = audioRef.current;

      // Before counting this as a hard error, give the same station a few
      // silent reconnect attempts. This handles transient network drops
      // without the user ever noticing.
      if (isPlayingFlagRef.current && tryReconnectRef.current()) {
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
          loadTimeoutRef.current = null;
        }
        if (audio) {
          try { audio.pause(); } catch {/* intentional */}
        }
        isPlayingRef.current = false;
        handlingError = false;
        return;
      }

      const now = Date.now();
      if (now - lastErrorTime < 3000) {
        errorCount++;
      } else {
        errorCount = 1;
      }
      lastErrorTime = now;

      // Bail after 5 consecutive rapid errors and STOP (don't auto-skip again).
      // Silently set inline error — the mini player already shows the state.
      // No toast spam.
      if (errorCount > 5) {
        setError('No stations reachable right now');
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

      // Per-station failure toasts are intentionally silent — the inline
      // error state already conveys "skipping" without spamming the UI.
      // We only toast when we truly give up (handled above).
      void lastToastTime;
      setError('Station unavailable - skipping...');

      // Clear any pending load timeout & release the play lock so the next
      // station attempt isn't blocked by a stuck isPlayingRef.
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      isPlayingRef.current = false;

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
        // Also update state so UI can show offline indicator
        setState(prev => ({
          ...prev,
          deadStationIds: [...prev.deadStationIds, currentId]
        }));

        setTimeout(() => {
          failedStationsRef.current.delete(currentId);
          setState(prev => ({
            ...prev,
            deadStationIds: prev.deadStationIds.filter(id => id !== currentId)
          }));
        }, 30000);
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
      // Treat extended stalls the same as transient drops — try silent
      // reconnect rather than just showing "Buffering..." indefinitely.
      if (isPlayingFlagRef.current && tryReconnectRef.current()) return;
      setError('Buffering...');
    };

    const handleWaiting = () => {
      // 'waiting' fires when playback halts because the next frame isn't
      // available. On live streams this is the most reliable "connection
      // dropped" signal — give the supervisor a chance to recover quietly.
      if (isPlayingFlagRef.current && tryReconnectRef.current()) return;
    };

    const handlePlaying = () => {
      setError(null);
      errorCount = 0;
      reconnectAttemptsRef.current = 0;
      // After 60s of healthy playback, also reset the rapid-error counter
      // (it normally only resets on a fresh 'playing' event, which never
      // fires for an already-playing live stream).
      if (healthyPlaybackTimeoutRef.current) clearTimeout(healthyPlaybackTimeoutRef.current);
      healthyPlaybackTimeoutRef.current = setTimeout(() => {
        errorCount = 0;
      }, 60000);
    };

    audioRef.current.addEventListener('ended', handleTrackEnded);
    audioRef.current.addEventListener('error', handleAudioError);
    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('stalled', handleStalled);
    audioRef.current.addEventListener('waiting', handleWaiting);
    audioRef.current.addEventListener('playing', handlePlaying);

    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (healthyPlaybackTimeoutRef.current) clearTimeout(healthyPlaybackTimeoutRef.current);
      audioRef.current?.removeEventListener('ended', handleTrackEnded);
      audioRef.current?.removeEventListener('error', handleAudioError);
      audioRef.current?.removeEventListener('canplay', handleCanPlay);
      audioRef.current?.removeEventListener('stalled', handleStalled);
      audioRef.current?.removeEventListener('waiting', handleWaiting);
      audioRef.current?.removeEventListener('playing', handlePlaying);
    };
  }, []);

  // Heartbeat watchdog + foreground resume: while isPlaying, ensure currentTime
  // is still advancing and AudioContext isn't suspended. If either freezes,
  // kick the reconnect supervisor.
  useEffect(() => {
    if (!state.isPlaying) {
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
        watchdogIntervalRef.current = null;
      }
      return;
    }

    lastCurrentTimeRef.current = audioRef.current?.currentTime ?? 0;
    lastCurrentTimeSampleRef.current = Date.now();

    watchdogIntervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio) return;

      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {/* ignore */});
      }

      const now = audio.currentTime;
      const elapsed = Date.now() - lastCurrentTimeSampleRef.current;
      // If currentTime hasn't advanced in 30s and we believe we're playing,
      // the stream is frozen — silently reconnect.
      if (now === lastCurrentTimeRef.current && elapsed > 30000 && !audio.paused) {
        logger.warn('[RadioPlayer] Watchdog: currentTime frozen, reconnecting');
        if (!tryReconnectSameStation()) {
          changeStationRef.current('next');
        }
        lastCurrentTimeSampleRef.current = Date.now();
        return;
      }
      if (now !== lastCurrentTimeRef.current) {
        lastCurrentTimeRef.current = now;
        lastCurrentTimeSampleRef.current = Date.now();
      }
    }, 30000);

    return () => {
      if (watchdogIntervalRef.current) {
        clearInterval(watchdogIntervalRef.current);
        watchdogIntervalRef.current = null;
      }
    };
  }, [state.isPlaying, tryReconnectSameStation]);

  // When the tab returns to foreground, resume audio + AudioContext if we
  // believe playback is in progress but the element is paused.
  useEffect(() => {
    const handleResume = () => {
      if (!state.isPlaying) return;
      const audio = audioRef.current;
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {/* ignore */});
      }
      if (audio && audio.paused && audio.src) {
        userInitiatedRef.current = true;
        audio.play().catch(() => {
          // If resume fails, hand off to reconnect supervisor.
          if (!tryReconnectSameStation()) changeStationRef.current('next');
        });
      }
    };
    const onVis = () => { if (document.visibilityState === 'visible') handleResume(); };
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [state.isPlaying, tryReconnectSameStation]);

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

  // CRITICAL: hard guard against auto-play.
  // The radio must ONLY start when the user explicitly taps the Play button
  // on the mini player, the full radio page, or a station/shuffle action.
  // Every user-facing entry point sets this to true right before calling
  // play(); media-session and effect-driven callers do NOT set it, so they
  // cannot start audio that the user did not request.
  const userInitiatedRef = useRef(false);

  const play = useCallback(async (station?: RadioStation) => {
    // Block any path that did not originate from an explicit user gesture.
    // Internal recoveries (error skip, ended->next, station changes while
    // already playing) are allowed because they happen while audio is live.
    const userOk = userInitiatedRef.current;
    userInitiatedRef.current = false;
    // Allow internal recoveries (error skip, track-ended->next, city change
    // while already playing) — those happen while the audio element has
    // already produced output, so audio.played.length > 0.
    const hasPriorPlayback = !!audioRef.current?.played && audioRef.current.played.length > 0;
    if (!userOk && !hasPriorPlayback) {
      logger.info('[RadioPlayer] play() blocked — not user-initiated');
      return;
    }
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
          // 🚀 SWIPESS VISIBILITY: Automatically expand when music starts
          miniPlayerMode: prev.miniPlayerMode === 'closed' ? 'expanded' : prev.miniPlayerMode
        }));
        savePreferences({ currentStation: targetStation, currentCity: targetStation.city });
      }

      // 📡 TURBO TIMEOUT: 15s for slower connections. Only mark failed if
      // the stream really hasn't delivered enough data (readyState < 2 means
      // we don't even have current data) — protects slow-but-fine streams.
      loadTimeoutRef.current = setTimeout(() => {
        const audio = audioRef.current;
        if (audio && audio.readyState >= 2) {
          // Stream is alive, just slow. Clear the deadline silently.
          loadTimeoutRef.current = null;
          return;
        }
        console.warn(`[RadioPlayer] Station ${targetStation.id} (${targetStation.name}) timeout after 15s, skipping...`);
        logger.warn(`[RadioPlayer] Station ${targetStation.id} timeout, skipping`);
        failedStationsRef.current.add(targetStation.id);
        setTimeout(() => failedStationsRef.current.delete(targetStation.id), 20000);
        setError('Station timeout, switching...');
        // CRITICAL: release the play lock — without this, the radio gets
        // permanently stuck because every subsequent play() exits early.
        isPlayingRef.current = false;
        try { audio?.pause(); } catch {/* ignore */}
        setTimeout(() => {
          setError(null);
          changeStationRef.current('next');
        }, 300);
      }, 15000);

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
          artist: "Swipess: Find Your Direct Deal",
          album: "Swipe & Save Big",
          artwork: [
            { src: targetStation.albumArt || '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          ]
        });

        // Only allow system "play" (headphones/lockscreen) to resume when
        // the user already had the radio playing in this session. This
        // prevents the OS from spontaneously starting the radio when no
        // playback was ever requested.
        navigator.mediaSession.setActionHandler('play', () => {
          if (!audioRef.current || !audioRef.current.src) return;
          userInitiatedRef.current = true;
          audioRef.current.play().catch(() => {});
          setState(prev => ({ ...prev, isPlaying: true }));
        });
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
      userInitiatedRef.current = true;
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
          // Re-shuffle and push recently-played stations to the back of queue
          const reshuffled = shuffleArray(radioStations, state.currentStation?.id);
          shuffleQueueRef.current = avoidRecent(reshuffled, recentPlayedRef.current);
          nextIndex = 0;
        }
      } else {
        nextIndex = Math.max(0, shuffleIndexRef.current - 1);
      }
      shuffleIndexRef.current = nextIndex;
      const station = shuffleQueueRef.current[nextIndex];
      if (station) {
        pushRecent(station.id);
        play(station);
      }
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
    // Only auto-tune to first station of new city if radio is already playing.
    // Never start audio from a city change alone.
    if (stations.length > 0 && state.isPlaying) play(stations[0]);
    else if (stations.length > 0) {
      setState(prev => ({ ...prev, currentStation: stations[0] }));
    }
  }, [state.currentCity, state.isPlaying, play]);

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

  const toggleShuffle = useCallback((customStations?: RadioStation[]) => {
    const newShuffle = !state.isShuffle;
    if (newShuffle) {
      const currentId = state.currentStation?.id;
      const targetStations = customStations || activeStations;
      shuffleQueueRef.current = shuffleArray(targetStations, currentId);
      shuffleIndexRef.current = 0;
    } else {
      shuffleQueueRef.current = [];
      shuffleIndexRef.current = 0;
    }
    setState(prev => ({ ...prev, isShuffle: newShuffle }));
    savePreferences({ isShuffle: newShuffle });
  }, [state.isShuffle, state.currentStation, activeStations]);

  const shuffleAndPlay = useCallback((customStations?: RadioStation[]) => {
    const targetStations = customStations || activeStations;
    if (targetStations.length === 0) return;
    const currentId = state.currentStation?.id;
    // Build queue, avoiding repeats of current + recently-played stations
    const baseShuffle = shuffleArray(targetStations, currentId);
    const queue = avoidRecent(baseShuffle, [
      ...(currentId ? [currentId] : []),
      ...recentPlayedRef.current,
    ]);
    const first = queue[0];
    if (!first) return;
    pushRecent(first.id);
    userInitiatedRef.current = true;
    play(first);

    // Also enable shuffle mode with the new queue
    shuffleQueueRef.current = queue;
    shuffleIndexRef.current = 0;
    setState(prev => ({ ...prev, isShuffle: true }));
    savePreferences({ isShuffle: true });
  }, [activeStations, play, state.currentStation]);

  

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
    if (firstStation) { userInitiatedRef.current = true; play(firstStation); }
  }, [play]);

  const playFavorites = useCallback(() => playPlaylist(state.favorites), [state.favorites, playPlaylist]);

  const setMiniPlayerMode = useCallback((mode: 'expanded' | 'minimized' | 'closed') => {
    setState(prev => ({ ...prev, miniPlayerMode: mode }));
    localStorage.setItem('Swipess_radio_mini_player_mode', mode);
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
    // External callers (mini player, radio page, directory) always invoke
    // play from a user click — wrap to set the user-intent flag.
    play: (station?: RadioStation) => { userInitiatedRef.current = true; return play(station); },
    pause,
    togglePlayPause,
    togglePower,
    changeStation,
    setCity,
    setVolume,
    toggleShuffle,
    shuffleAndPlay,
    toggleFavorite,
    isStationFavorite,
    playPlaylist,
    playFavorites,
    setMiniPlayerMode,
    getFrequencyData,
  }), [state, loading, error, play, pause, togglePlayPause, togglePower, changeStation, setCity, setVolume, toggleShuffle, shuffleAndPlay, toggleFavorite, isStationFavorite, playPlaylist, playFavorites, setMiniPlayerMode, getFrequencyData]);

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    return fallbackRadioContext;
  }
  return context;
}


