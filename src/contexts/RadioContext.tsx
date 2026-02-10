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
  }, []);

  // Update listeners when state changes to have access to latest state
  useEffect(() => {
    if (!audioRef.current) return;

    const handleTrackEnded = () => {
      changeStation('next');
    };

    const handleAudioError = (e: Event) => {
      if (audioRef.current?.paused === false) {
        logger.error('[RadioPlayer] Audio error:', e);
        setError('Stream unavailable');
        setTimeout(() => {
          changeStation('next');
        }, 3000);
      }
    };

    audioRef.current.addEventListener('ended', handleTrackEnded);
    audioRef.current.addEventListener('error', handleAudioError);

    return () => {
      audioRef.current?.removeEventListener('ended', handleTrackEnded);
      audioRef.current?.removeEventListener('error', handleAudioError);
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
        .select('radio_skin, radio_current_city, radio_current_station_id, radio_volume, radio_shuffle_mode, radio_favorite_stations')
        .eq('id', user.id)
        .single();

      if (error) {
        setLoading(false);
        return;
      }

      if (data) {
        const city = (data.radio_current_city as CityLocation) || 'tulum';
        const currentStationId = data.radio_current_station_id;
        let currentStation = currentStationId ? getStationById(currentStationId) : null;

        if (!currentStation) {
          const stations = getStationsByCity(city);
          currentStation = stations.length > 0 ? stations[0] : null;
        }

        setState(prev => ({
          ...prev,
          skin: (data.radio_skin as RadioSkin) || 'modern',
          currentCity: city,
          currentStation: currentStation || defaultStation,
          volume: data.radio_volume || 0.7,
          isShuffle: data.radio_shuffle_mode || false,
          favorites: data.radio_favorite_stations || []
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
      if (updates.skin !== undefined) dbUpdates.radio_skin = updates.skin;
      if (updates.currentCity !== undefined) dbUpdates.radio_current_city = updates.currentCity;
      if (updates.currentStation !== undefined) dbUpdates.radio_current_station_id = updates.currentStation?.id || null;
      if (updates.volume !== undefined) dbUpdates.radio_volume = updates.volume;
      if (updates.isShuffle !== undefined) dbUpdates.radio_shuffle_mode = updates.isShuffle;
      if (updates.favorites !== undefined) dbUpdates.radio_favorite_stations = updates.favorites;

      await supabase.from('profiles').update(dbUpdates).eq('id', user.id);
    } catch (err) {
      logger.info('[RadioPlayer] Error saving preferences:', err);
    }
  };

  const play = useCallback(async (station?: RadioStation) => {
    const targetStation = station || state.currentStation;
    if (!targetStation || !audioRef.current) return;

    try {
      if (audioRef.current.src !== targetStation.streamUrl) {
        audioRef.current.src = targetStation.streamUrl;
        audioRef.current.load();
        setState(prev => ({ ...prev, currentStation: targetStation }));
        savePreferences({ currentStation: targetStation });
      }

      await audioRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true }));
      setError(null);
    } catch (err) {
      logger.error('[RadioPlayer] Playback error:', err);
      setError('Failed to play station');
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
