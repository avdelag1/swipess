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

// LocalStorage keys
const RADIO_STATE_KEY = 'swipess_radio_state';

function getInitialState(): RadioPlayerState {
  try {
    const saved = localStorage.getItem(RADIO_STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Restore currentStation with full object if we have the ID
      if (parsed.currentStationId) {
        const station = getStationById(parsed.currentStationId);
        if (station) {
          parsed.currentStation = station;
        }
      }
      return {
        isPlaying: false,
        currentStation: null,
        currentCity: 'tulum',
        volume: 0.7,
        isShuffle: false,
        skin: 'modern',
        favorites: [],
        ...parsed,
      };
    }
  } catch (e) {
    logger.info('[RadioPlayer] Error loading state from localStorage:', e);
  }
  
  return {
    isPlaying: false,
    currentStation: null,
    currentCity: 'tulum',
    volume: 0.7,
    isShuffle: false,
    skin: 'modern',
    favorites: []
  };
}

export function RadioProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSessionRef = useRef<MediaSessionHandle | null>(null);
  const [state, setState] = useState<RadioPlayerState>(getInitialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      const toSave = {
        currentCity: state.currentCity,
        currentStationId: state.currentStation?.id || null,
        volume: state.volume,
        isShuffle: state.isShuffle,
        skin: state.skin,
        favorites: state.favorites,
      };
      localStorage.setItem(RADIO_STATE_KEY, JSON.stringify(toSave));
    } catch (e) {
      // localStorage might be full or unavailable
    }
  }, [state.currentCity, state.currentStation?.id, state.volume, state.isShuffle, state.skin, state.favorites]);

  // Initialize audio element and Media Session API
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume;
      audioRef.current.preload = 'auto';
    }

    // Initialize Media Session API for background playback
    if ('mediaSession' in navigator) {
      mediaSessionRef.current = new MediaSessionHandle(audioRef.current, state, setState);
    }

    return () => {
      if (mediaSessionRef.current) {
        mediaSessionRef.current.cleanup();
      }
    };
  }, []);

  // Update audio volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  // Handle audio events
  useEffect(() => {
    if (!audioRef.current) return;

    const handleTrackEnded = () => {
      changeStation('next');
    };

    const handleAudioError = (e: Event) => {
      logger.error('[RadioPlayer] Audio error:', e);
      if (audioRef.current?.paused === false) {
        setError('Stream unavailable');
        setTimeout(() => {
          changeStation('next');
        }, 3000);
      }
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }));
      setError(null);
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }));
    };

    audioRef.current.addEventListener('ended', handleTrackEnded);
    audioRef.current.addEventListener('error', handleAudioError);
    audioRef.current.addEventListener('play', handlePlay);
    audioRef.current.addEventListener('pause', handlePause);

    return () => {
      audioRef.current?.removeEventListener('ended', handleTrackEnded);
      audioRef.current?.removeEventListener('error', handleAudioError);
      audioRef.current?.removeEventListener('play', handlePlay);
      audioRef.current?.removeEventListener('pause', handlePause);
    };
  }, []);

  // Load user preferences from Supabase
  useEffect(() => {
    loadUserPreferences();
  }, [user?.id]);

  // Update Media Session when state changes
  useEffect(() => {
    if (mediaSessionRef.current) {
      mediaSessionRef.current.update(state);
    }
  }, [state.currentStation, state.isPlaying]);

  const loadUserPreferences = async () => {
    const defaultStations = getStationsByCity('tulum');
    const defaultStation = defaultStations.length > 0 ? defaultStations[0] : null;
    
    if (!user?.id) {
      if (defaultStation && !state.currentStation) {
        setState(prev => ({ ...prev, currentStation: defaultStation }));
      }
      setLoading(false);
      return;
    }

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
          skin: (data.radio_skin as RadioSkin) || prev.skin,
          currentCity: city,
          currentStation: currentStation || prev.currentStation,
          volume: data.radio_volume ?? prev.volume,
          isShuffle: data.radio_shuffle_mode ?? prev.isShuffle,
          favorites: data.radio_favorite_stations || prev.favorites
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

// Media Session API handler for background playback
class MediaSessionHandle {
  private audio: HTMLAudioElement;
  private state: RadioPlayerState;
  private setState: React.Dispatch<React.SetStateAction<RadioPlayerState>>;
  private cleanup: () => void;

  constructor(audio: HTMLAudioElement, state: RadioPlayerState, setState: React.Dispatch<React.SetStateAction<RadioPlayerState>>) {
    this.audio = audio;
    this.state = state;
    this.setState = setState;
    this.cleanup = () => {};

    this.setupMediaSession();
  }

  private setupMediaSession() {
    if (!('mediaSession' in navigator)) return;

    const media = navigator.mediaSession as MediaSession;

    // Set action handlers for lock screen controls
    media.setActionHandler('play', () => {
      this.audio.play().catch(() => {});
    });

    media.setActionHandler('pause', () => {
      this.audio.pause();
    });

    media.setActionHandler('previoustrack', () => {
      this.changeStation('prev');
    });

    media.setActionHandler('nexttrack', () => {
      this.changeStation('next');
    });

    this.updateMetadata(this.state);
  }

  private changeStation(direction: 'next' | 'prev') {
    // This will be handled by the context
    const event = new CustomEvent('radio:changeStation', { detail: { direction } });
    window.dispatchEvent(event);
  }

  private updateMetadata(state: RadioPlayerState) {
    if (!('mediaSession' in navigator)) return;

    const media = navigator.mediaSession as MediaSession;
    
    if (state.currentStation) {
      media.metadata = new MediaMetadata({
        title: state.currentStation.name,
        artist: state.currentStation.genre,
        artwork: [
          { src: state.currentStation.logo || '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    }
  }

  public update(state: RadioPlayerState) {
    this.state = state;
    this.updateMetadata(state);
  }

  public cleanup() {
    if ('mediaSession' in navigator) {
      const media = navigator.mediaSession as MediaSession;
      media.setActionHandler('play', null);
      media.setActionHandler('pause', null);
      media.setActionHandler('previoustrack', null);
      media.setActionHandler('nexttrack', null);
    }
  }
}

export function useRadio() {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
}
