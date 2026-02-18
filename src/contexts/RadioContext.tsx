// @ts-nocheck
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RadioStation, CityLocation, RadioSkin, RadioPlayerState } from '@/types/radio';
import { getStationsByCity, getStationById, getRandomStation } from '@/data/radioStations';
import { logger } from '@/utils/prodLogger';

interface RadioContextType {
  state: RadioPlayerState;
  loading: boolean;
  error: string | null;
  play: (station?: RadioStation) => Promise<void>;
  pause: () => void;
  togglePlayPause: () => void;
  changeStation: (direction: 'next' | 'prev') => void;
  setCity: (city: CityLocation) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  setSkin: (skin: RadioSkin) => void;
  toggleFavorite: (stationId: string) => void;
  isStationFavorite: (stationId: string) => boolean;
  playPlaylist: (stationIds: string[]) => void;
  playFavorites: () => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [state, setState] = useState<RadioPlayerState>({
    isPlaying: false,
    currentStation: null,
    currentCity: 'tulum',
    volume: 0.7,
    isShuffle: false,
    skin: 'modern',
    favorites: []
  });

  // Set loading to false immediately - don't block UI for preferences
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
      audioRef.current.preload = 'auto';
    }

    // Cleanup on unmount
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Track failed stations to avoid infinite loops
  const failedStationsRef = useRef<Set<string>>(new Set());
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update listeners when state changes to have access to latest state
  useEffect(() => {
    if (!audioRef.current) return;

    const handleTrackEnded = () => {
      changeStation('next');
    };

    const handleAudioError = (e: Event) => {
      const currentStationId = state.currentStation?.id;
      if (currentStationId) {
        failedStationsRef.current.add(currentStationId);
        logger.error(`[RadioPlayer] Station ${currentStationId} failed:`, e);
      }

      setError('Station unavailable, switching...');

      // Immediately cancel the current stream
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }

      // Skip to next station immediately (reduced from 3000ms to 500ms)
      setTimeout(() => {
        setError(null);
        changeStation('next');
      }, 500);
    };

    const handleCanPlay = () => {
      // Clear any loading timeout when stream successfully loads
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

    audioRef.current.addEventListener('ended', handleTrackEnded);
    audioRef.current.addEventListener('error', handleAudioError);
    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('stalled', handleStalled);

    return () => {
      audioRef.current?.removeEventListener('ended', handleTrackEnded);
      audioRef.current?.removeEventListener('error', handleAudioError);
      audioRef.current?.removeEventListener('canplay', handleCanPlay);
      audioRef.current?.removeEventListener('stalled', handleStalled);
    };
  }, [state.isPlaying, state.currentStation, state.isShuffle, state.currentCity]);

  // Load user preferences from Supabase
  useEffect(() => {
    loadUserPreferences();
  }, [user?.id]);

  // Update audio volume when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  const loadUserPreferences = async () => {
    // Set default station immediately
    const defaultStations = getStationsByCity('tulum');
    const defaultStation = defaultStations.length > 0 ? defaultStations[0] : null;
    
    if (!user?.id) {
      if (defaultStation) {
        setState(prev => ({ ...prev, currentStation: defaultStation }));
      }
      setLoading(false);
      return;
    }

    // Set defaults immediately before fetching
    setState(prev => ({
      ...prev,
      currentStation: defaultStation || prev.currentStation
    }));

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('radio_current_station_id')
        .eq('id', user.id)
        .single();

      if (error) {
        setLoading(false);
        return;
      }

      if (data) {
        const currentStationId = data.radio_current_station_id;
        let currentStation = currentStationId ? getStationById(currentStationId) : null;

        if (!currentStation) {
          const stations = getStationsByCity('tulum');
          currentStation = stations.length > 0 ? stations[0] : null;
        }

        setState(prev => ({
          ...prev,
          currentStation: currentStation || defaultStation,
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
      // Only persist the station column that exists in the schema
      if (updates.currentStation !== undefined) dbUpdates.radio_current_station_id = updates.currentStation?.id || null;

      await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    } catch (err) {
      logger.info('[RadioPlayer] Error saving preferences:', err);
    }
  };

  const play = useCallback(async (station?: RadioStation) => {
    const targetStation = station || state.currentStation;
    if (!targetStation || !audioRef.current) return;

    // Check if this station failed recently, if so skip it
    if (failedStationsRef.current.has(targetStation.id)) {
      logger.info(`[RadioPlayer] Skipping recently failed station: ${targetStation.id}`);
      // Clear the failed status after some time
      setTimeout(() => {
        failedStationsRef.current.delete(targetStation.id);
      }, 60000); // Allow retry after 1 minute
      changeStation('next');
      return;
    }

    try {
      // Clear any existing timeout
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }

      if (audioRef.current.src !== targetStation.streamUrl) {
        audioRef.current.src = targetStation.streamUrl;
        audioRef.current.load();

        // Update station AND city (important for shuffle mode)
        setState(prev => ({
          ...prev,
          currentStation: targetStation,
          currentCity: targetStation.city // Update city to match the station
        }));
        savePreferences({
          currentStation: targetStation,
          currentCity: targetStation.city // Save the new city too
        });
      }

      // Set a timeout to detect if the stream takes too long to load
      loadTimeoutRef.current = setTimeout(() => {
        logger.warn(`[RadioPlayer] Station ${targetStation.id} took too long to load, skipping`);
        failedStationsRef.current.add(targetStation.id);
        setError('Station timeout, switching...');
        setTimeout(() => {
          setError(null);
          changeStation('next');
        }, 500);
      }, 10000); // 10 second timeout

      await audioRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true }));
      setError(null);

      // Clear timeout on successful play
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }
    } catch (err) {
      logger.error('[RadioPlayer] Playback error:', err);
      failedStationsRef.current.add(targetStation.id);
      setError('Failed to play station, switching...');

      // Clear timeout on error
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
        loadTimeoutRef.current = null;
      }

      setTimeout(() => {
        setError(null);
        changeStation('next');
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
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  const changeStation = useCallback((direction: 'next' | 'prev') => {
    const city = state.currentCity;
    const stations = getStationsByCity(city);
    if (stations.length === 0) return;

    if (state.isShuffle) {
      play(getRandomStation());
      return;
    }

    const currentIndex = state.currentStation 
      ? stations.findIndex(s => s.id === state.currentStation?.id)
      : -1;

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % stations.length;
    } else {
      nextIndex = (currentIndex - 1 + stations.length) % stations.length;
    }

    play(stations[nextIndex]);
  }, [state.currentStation, state.currentCity, state.isShuffle, play]);

  const setCity = useCallback((city: CityLocation) => {
    if (city === state.currentCity) return;
    const stations = getStationsByCity(city);
    setState(prev => ({ ...prev, currentCity: city }));
    savePreferences({ currentCity: city });
    if (stations.length > 0) {
      play(stations[0]);
    }
  }, [state.currentCity, play]);

  const setVolume = useCallback((volume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    setState(prev => ({ ...prev, volume: clampedVolume }));
    savePreferences({ volume: clampedVolume });
  }, []);

  const toggleShuffle = useCallback(() => {
    const newShuffle = !state.isShuffle;
    setState(prev => ({ ...prev, isShuffle: newShuffle }));
    savePreferences({ isShuffle: newShuffle });
  }, [state.isShuffle]);

  const setSkin = useCallback((skin: RadioSkin) => {
    setState(prev => ({ ...prev, skin }));
    savePreferences({ skin });
  }, []);

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
    if (firstStation) {
      play(firstStation);
    }
  }, [play]);

  const playFavorites = useCallback(() => {
    playPlaylist(state.favorites);
  }, [state.favorites, playPlaylist]);

  const value = {
    state,
    loading,
    error,
    play,
    pause,
    togglePlayPause,
    changeStation,
    setCity,
    setVolume,
    toggleShuffle,
    setSkin,
    toggleFavorite,
    isStationFavorite: (stationId: string) => state.favorites.includes(stationId),
    playPlaylist,
    playFavorites
  };

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}
