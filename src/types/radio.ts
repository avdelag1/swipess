/**
 * Radio Player Types
 * Types and interfaces for the location-themed radio player
 */

export type RadioSkin = 'modern' | 'vinyl' | 'retro';

export type CityLocation =
  | 'new-york'
  | 'miami'
  | 'ibiza'
  | 'tulum'
  | 'california'
  | 'texas'
  | 'french'
  | 'podcasts';

export interface RadioStation {
  id: string;
  name: string;
  frequency: string; // e.g., "101.9 FM"
  streamUrl: string;
  city: CityLocation;
  genre?: string;
  description?: string;
  albumArt?: string; // Default album art for station
}

export interface CityTheme {
  id: CityLocation;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient?: string;
  description?: string;
}

export interface NowPlaying {
  title: string;
  artist: string;
  albumArt?: string;
  station: RadioStation;
}

export interface UserPlaylist {
  id: string;
  user_id: string;
  name: string;
  station_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface RadioPlayerState {
  isPlaying: boolean;
  currentStation: RadioStation | null;
  currentCity: CityLocation;
  volume: number;
  isShuffle: boolean;
  skin: RadioSkin;
  favorites: string[]; // station IDs
}
