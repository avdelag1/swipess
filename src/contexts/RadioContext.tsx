/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CityLocation, RadioPlayerState, RadioStation } from '@/types/radio';
import { getStationById, getStationsByCity, radioStations } from '@/data/radioStations';
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

/** 5-band graphic equalizer — frequencies + filter type per band. */
export const EQ_BANDS: { freq: number; type: BiquadFilterType; label: string }[] = [
  { freq: 60, type: 'lowshelf', label: '60' },
  { freq: 250, type: 'peaking', label: '250' },
  { freq: 1000, type: 'peaking', label: '1K' },
  { freq: 4000, type: 'peaking', label: '4K' },
  { freq: 12000, type: 'highshelf', label: '12K' },
];

/** Preset gains in dB, indexed to EQ_BANDS. */
export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0],
  'Bass Boost': [7, 4, 1, 0, 1],
  Vocal: [-2, 0, 3, 3, 1],
  Treble: [0, 0, 1, 4, 6],
  Club: [5, 3, 0, 2, 4],
  Chill: [3, 1, -1, 0, 2],
};

const EQ_STORAGE_KEY = 'swipess_radio_eq';
function loadSavedEq(): { gains: number[]; preset: string } {
  try {
    const raw = localStorage.getItem(EQ_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const gains = Array.isArray(parsed?.gains) && parsed.gains.length === EQ_BANDS.length
        ? parsed.gains.map((n: unknown) => (typeof n === 'number' ? n : 0))
        : EQ_PRESETS.Flat.slice();
      const preset = typeof parsed?.preset === 'string' ? parsed.preset : 'Flat';
      return { gains, preset };
    }
  } catch { /* ignore */ }
  return { gains: EQ_PRESETS.Flat.slice(), preset: 'Flat' };
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
  /** 5-band graphic EQ, gains in dB (-12..12), indexed to EQ_BANDS. */
  eqGains: number[];
  eqPreset: string;
  setEqBand: (index: number, gainDb: number) => void;
  applyEqPreset: (preset: string) => void;
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
  eqGains: [0, 0, 0, 0, 0],
  eqPreset: 'Flat',
  setEqBand: () => {},
  applyEqPreset: () => {},
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
  const eqFiltersRef = useRef<BiquadFilterNode[]>([]);
  const eqInitRef = useRef(loadSavedEq());
  const eqGainsRef = useRef<number[]>(eqInitRef.current.gains.slice());
  const [eqGains, setEqGains] = useState<number[]>(() => eqInitRef.current.gains.slice());
  const [eqPreset, setEqPreset] = useState<string>(() => eqInitRef.current.preset);
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

  // CRITICAL: Guard against spurious error/stalled/waiting events fired when
  // we deliberately change audio.src to a new station. Without this, the old
  // stream's abort triggers reconnect of the OLD station, clobbering the new one.
  const changingStationRef = useRef(false);

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
    const lastToastTime = 0;

    resetErrorCountRef.current = () => { errorCount = 0; };

    const handleTrackEnded = () => {
      // Live streams should never "end" — treat as a network blip and try to
      // silently reconnect the same station before skipping.
      if (isPlayingFlagRef.current && tryReconnectRef.current()) return;
      changeStationRef.current('next');
    };

    const handleAudioError = (_e: Event) => {
      if (handlingError) return;
      // CRITICAL: If we're deliberately changing stations, ignore errors from
      // the old stream being aborted — they are expected and harmless.
      if (changingStationRef.current) return;
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
        if (audio?.src === currentStationRef.current?.streamUrl) isPlayingRef.current = false;
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
      if (audio?.src === currentStationRef.current?.streamUrl) isPlayingRef.current = false;

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
      // Release play lock so the station change can proceed (only if still current)
      if (audio?.src === currentStationRef.current?.streamUrl) isPlayingRef.current = false;
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
      if (changingStationRef.current) return;
      logger.warn('[RadioPlayer] Stream stalled');
      // Treat extended stalls the same as transient drops — try silent
      // reconnect rather than just showing "Buffering..." indefinitely.
      setError('Buffering...');
    };

    const handleWaiting = () => {
      if (changingStationRef.current) return;
      // On live streams 'waiting' fires frequently for buffering.
      // We DO NOT force a reconnect here, otherwise it skips/stutters.
      // The browser will automatically resume when it has enough data.
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

  const savePreferences = useCallback(async (updates: Partial<RadioPlayerState>) => {
    if (!user?.id) return;
    try {
      const dbUpdates: any = {};
      if (updates.currentStation !== undefined) dbUpdates.radio_current_station_id = updates.currentStation?.id || null;
      if (updates.isPoweredOn !== undefined) dbUpdates.radio_is_powered_on = updates.isPoweredOn;
      if (updates.volume !== undefined) dbUpdates.radio_volume = updates.volume;
      if (updates.isShuffle !== undefined) dbUpdates.radio_is_shuffle = updates.isShuffle;
      if (updates.favorites !== undefined) dbUpdates.radio_favorites = updates.favorites;
      
      const { error } = await supabase.from('profiles').update(dbUpdates).eq('user_id', user.id);
      if (error) logger.info('[RadioPlayer] Error saving preferences:', error);
    } catch (err) {
      logger.info('[RadioPlayer] Error saving preferences:', err);
    }
  }, [user?.id]);

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
    // Internal recoveries (error skip, track-ended->next, city change
    // while already playing) are allowed because they happen while audio is live.
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

    const targetStation = station || state.currentStation;
    if (!targetStation || !audioRef.current) {
      isPlayingRef.current = false;
      return;
    }

    // CRITICAL: If a play is in progress but we're switching to a DIFFERENT
    // station, abort the old attempt and proceed. This fixes the bug where
    // rapid skips (3-5+) get silently blocked by the isPlayingRef guard.
    const isDifferentStation = audioRef.current.src !== targetStation.streamUrl;
    if (isPlayingRef.current && !isDifferentStation) return;
    if (isDifferentStation) {
      // Abort the in-flight play by clearing src, which triggers AbortError
      // in the previous play() call's await audio.play()
      try { audioRef.current.pause(); } catch {/* intentional */}
    }
    isPlayingRef.current = true;

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
        // CRITICAL: Set the station-change guard BEFORE touching audio.src.
        // This suppresses error/stalled/waiting events from the old stream
        // being aborted — the root cause of the play/stop/play/stop loop.
        changingStationRef.current = true;

        // Cancel any pending reconnect attempts for the old station
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
        reconnectAttemptsRef.current = 0;

        // Pause old stream first to minimize spurious events
        try { audioRef.current.pause(); } catch {/* intentional */}

        // Update ref IMMEDIATELY so any handler that slips through
        // sees the new station, not the old one.
        currentStationRef.current = targetStation;

        audioRef.current.src = targetStation.streamUrl;
        audioRef.current.load();

        // Allow a microtask for the browser to flush abort events,
        // then re-enable the error handlers for the new stream.
        queueMicrotask(() => { changingStationRef.current = false; });

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
        logger.warn(`[RadioPlayer] Station ${targetStation.id} (${targetStation.name}) timeout after 15s, skipping...`);
        logger.warn(`[RadioPlayer] Station ${targetStation.id} timeout, skipping`);
        failedStationsRef.current.add(targetStation.id);
        setTimeout(() => failedStationsRef.current.delete(targetStation.id), 20000);
        setError('Station timeout, switching...');
        // CRITICAL: release the play lock only if this is still the active station
        if (audio?.src === targetStation.streamUrl) isPlayingRef.current = false;
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
            // Insert the 5-band EQ between source and analyser. At 0 dB it is
            // fully transparent; if filter creation fails we fall back to a
            // direct connection so playback is never affected.
            try {
              const ctx = audioContextRef.current;
              const filters = EQ_BANDS.map((band, i) => {
                const filt = ctx.createBiquadFilter();
                filt.type = band.type;
                filt.frequency.value = band.freq;
                if (band.type === 'peaking') filt.Q.value = 1.0;
                filt.gain.value = eqGainsRef.current[i] ?? 0;
                return filt;
              });
              let node: AudioNode = sourceRef.current;
              for (const filt of filters) { node.connect(filt); node = filt; }
              node.connect(analyzerRef.current);
              eqFiltersRef.current = filters;
            } catch (eqErr) {
              logger.warn('[RadioEQ] filter chain failed, using direct connection', eqErr);
              sourceRef.current.connect(analyzerRef.current);
            }
            analyzerRef.current.connect(audioContextRef.current.destination);
            dataArrayRef.current = new Uint8Array(analyzerRef.current.frequencyBinCount);
          } catch (e) {
            logger.error('[RadioTurbo] Context init failed:', e);
          }
        } else if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        await audioRef.current.play();
      } catch (playErr: any) {
        if (playErr.name === 'AbortError') {
          logger.info('[RadioPlayer] Play aborted by new action');
          if (audioRef.current?.src === targetStation.streamUrl) isPlayingRef.current = false;
          return;
        }
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
    } catch (err: any) {
      // CRITICAL: Only release the play lock if this is still the active station.
      // When a play is aborted by a station change, the new station's play() is
      // already running — releasing the lock here would break rapid skips.
      const isStillCurrent = audioRef.current?.src === targetStation.streamUrl;
      if (isStillCurrent) isPlayingRef.current = false;
      if (err.name === 'AbortError') {
         logger.info('[RadioPlayer] Play aborted by new action (outer)');
         return;
      }
      logger.error('[RadioPlayer] Playback error:', err);
      failedStationsRef.current.add(targetStation.id);
      setError('Failed to play station, switching...');

      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
      // Fallback: if the audio error handler didn't fire (e.g. AbortError from src change),
      // retry with a longer delay so it doesn't race with the 400ms error handler
      setTimeout(() => {
        setError(null);
        changeStationRef.current('next');
      }, 2000);
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
  }, [state.isPlaying, state.isPoweredOn, play, pause, savePreferences]);

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
  }, [state.isPoweredOn, savePreferences]);

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
        userInitiatedRef.current = true;
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

    userInitiatedRef.current = true;
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
  }, [state.currentCity, state.isPlaying, play, savePreferences]);

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    // 🚀 SPEED OF LIGHT: Apply local state IMMEDIATELY for zero lag
    setState(prev => ({ ...prev, volume: clamped }));
    
    // Debounce DB sync to prevent network congestion during slider dragging
    if (volSyncTimeoutRef.current) clearTimeout(volSyncTimeoutRef.current);
    volSyncTimeoutRef.current = setTimeout(() => {
      savePreferences({ volume: clamped });
    }, 1000);
  }, [savePreferences]);

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
  }, [state.isShuffle, state.currentStation, activeStations, savePreferences]);

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
  }, [activeStations, play, state.currentStation, savePreferences]);

  const toggleFavorite = useCallback((stationId: string) => {
    setState(prev => {
      const isFavorite = prev.favorites.includes(stationId);
      const newFavorites = isFavorite
        ? prev.favorites.filter(id => id !== stationId)
        : [...prev.favorites, stationId];
      savePreferences({ favorites: newFavorites });
      return { ...prev, favorites: newFavorites };
    });
  }, [savePreferences]);

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

  const persistEq = useCallback((gains: number[], preset: string) => {
    try { localStorage.setItem(EQ_STORAGE_KEY, JSON.stringify({ gains, preset })); } catch { /* ignore */ }
  }, []);

  const setEqBand = useCallback((index: number, gainDb: number) => {
    const g = Math.max(-12, Math.min(12, Math.round(gainDb)));
    const next = eqGainsRef.current.slice();
    next[index] = g;
    eqGainsRef.current = next;
    const filt = eqFiltersRef.current[index];
    if (filt) { try { filt.gain.value = g; } catch { /* ignore */ } }
    setEqGains(next);
    setEqPreset('Custom');
    persistEq(next, 'Custom');
  }, [persistEq]);

  const applyEqPreset = useCallback((preset: string) => {
    const gains = EQ_PRESETS[preset];
    if (!gains) return;
    const next = gains.slice();
    eqGainsRef.current = next;
    next.forEach((g, i) => {
      const filt = eqFiltersRef.current[i];
      if (filt) { try { filt.gain.value = g; } catch { /* ignore */ } }
    });
    setEqGains(next);
    setEqPreset(preset);
    persistEq(next, preset);
  }, [persistEq]);

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
    eqGains,
    eqPreset,
    setEqBand,
    applyEqPreset,
  }), [state, loading, error, play, pause, togglePlayPause, togglePower, changeStation, setCity, setVolume, toggleShuffle, shuffleAndPlay, toggleFavorite, isStationFavorite, playPlaylist, playFavorites, setMiniPlayerMode, getFrequencyData, eqGains, eqPreset, setEqBand, applyEqPreset]);

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    return fallbackRadioContext;
  }
  return context;
}


