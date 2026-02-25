import { RadioStation, CityTheme, CityLocation } from '@/types/radio';

/**
 * City themes with color schemes
 */
export const cityThemes: Record<CityLocation, CityTheme> = {
  'new-york': {
    id: 'new-york',
    name: 'New York',
    primaryColor: '#ff0000', // Red
    secondaryColor: '#1a1a1a',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #ff0000 0%, #1a1a1a 100%)',
    description: 'The city that never sleeps'
  },
  'miami': {
    id: 'miami',
    name: 'Miami',
    primaryColor: '#0070f3', // Blue
    secondaryColor: '#E4007C', // Mexican Pink
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #0070f3 0%, #E4007C 100%)',
    description: 'Neon nights and tropical vibes'
  },
  'ibiza': {
    id: 'ibiza',
    name: 'Ibiza',
    primaryColor: '#5e17eb', // Purple
    secondaryColor: '#4cc9f0',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #5e17eb 0%, #4cc9f0 100%)',
    description: 'Electronic paradise'
  },
  'tulum': {
    id: 'tulum',
    name: 'Tulum/Playa',
    primaryColor: '#FF4D00', // Orange
    secondaryColor: '#FFB347',
    accentColor: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF4D00 0%, #FFB347 50%, #FF6B35 100%)',
    description: 'Earthy jungle meets beach sunset'
  },
  'california': {
    id: 'california',
    name: 'California',
    primaryColor: '#E4007C', // Mexican Pink
    secondaryColor: '#fdc500',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #E4007C 0%, #fdc500 100%)',
    description: 'West coast sunshine'
  },
  'texas': {
    id: 'texas',
    name: 'Texas',
    primaryColor: '#8b0000',
    secondaryColor: '#cd853f',
    accentColor: '#daa520',
    gradient: 'linear-gradient(135deg, #8b0000 0%, #cd853f 50%, #daa520 100%)',
    description: 'Lone star vibes'
  },
  'french': {
    id: 'french',
    name: 'French',
    primaryColor: '#001f3f',
    secondaryColor: '#ffffff',
    accentColor: '#ff4136',
    gradient: 'linear-gradient(135deg, #001f3f 0%, #ffffff 50%, #ff4136 100%)',
    description: 'Parisian elegance'
  },
  'italy': {
    id: 'italy',
    name: 'Italy',
    primaryColor: '#009246',
    secondaryColor: '#ce2b37',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #009246 0%, #ffffff 50%, #ce2b37 100%)',
    description: 'Italian vibes and electronic energy'
  },
  'podcasts': {
    id: 'podcasts',
    name: 'Podcasts',
    primaryColor: '#6a0572',
    secondaryColor: '#ab83a1',
    accentColor: '#ffc300',
    gradient: 'linear-gradient(135deg, #6a0572 0%, #ab83a1 50%, #ffc300 100%)',
    description: 'Talk shows and storytelling'
  }
};

/**
 * All radio stations organized by city
 */
export const radioStations: RadioStation[] = [
  // Tulum/Playa del Carmen - Ambient & Spiritual
  {
    id: 'tulum-gs',
    name: 'Groove Salad',
    frequency: '102.1',
    streamUrl: 'https://ice2.somafm.com/groovesalad-256-mp3',
    city: 'tulum',
    genre: 'Ambient',
    description: 'A nicely chilled plate of ambient/downtempo beats'
  },
  {
    id: 'tulum-lush',
    name: 'Lush',
    frequency: '98.5',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'tulum',
    genre: 'Chillout',
    description: 'Sensuous and mellow vocals'
  },
  {
    id: 'tulum-drone',
    name: 'Drone Zone',
    frequency: '100.1',
    streamUrl: 'https://ice1.somafm.com/dronezone-256-mp3',
    city: 'tulum',
    genre: 'Ambient',
    description: 'Atmospheric space music'
  },
  {
    id: 'tulum-deepspace',
    name: 'Deep Space One',
    frequency: '94.3',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    city: 'tulum',
    genre: 'Space',
    description: 'Ambient electronic space music'
  },

  // Miami - Deep House & Neon Vibes
  {
    id: 'miami-deep',
    name: 'Miami Deep House',
    frequency: '93.1',
    streamUrl: 'https://streaming.tmcrental.com/radio/8000/radio.mp3',
    city: 'miami',
    genre: 'Deep House',
    description: 'Beach club vibes and deep beats'
  },
  {
    id: 'miami-latin',
    name: 'Miami Latin',
    frequency: '99.5',
    streamUrl: 'https://ice1.somafm.com/u80s-128-mp3',
    city: 'miami',
    genre: 'Latin Fusion',
    description: 'Modern Latin electronic beats'
  },

  // New York - Underground Jazz & Hip Hop
  {
    id: 'ny-jazz',
    name: 'NYC Jazz',
    frequency: '89.9',
    streamUrl: 'https://wkcr.streamguys1.com/live',
    city: 'new-york',
    genre: 'Jazz',
    description: 'Real jazz from the heart of NY'
  },
  {
    id: 'ny-hiphop',
    name: 'Hot 97',
    frequency: '97.1',
    streamUrl: 'https://19163.live.streamtheworld.com/WQHTFM.mp3',
    city: 'new-york',
    genre: 'Hip Hop',
    description: 'Where Hip Hop lives'
  },

  // Ibiza - Electronic paradise
  {
    id: 'ibiza-global',
    name: 'Ibiza Global',
    frequency: '97.6',
    streamUrl: 'https://api.ibizaglobalradio.com:8443/live',
    city: 'ibiza',
    genre: 'Electronic',
    description: 'The sound of Ibiza'
  },
  {
    id: 'ibiza-sonica',
    name: 'Ibiza Sonica',
    frequency: '92.4',
    streamUrl: 'https://s3.sonicabroadcast.com/7002/stream',
    city: 'ibiza',
    genre: 'Deep House',
    description: 'Pure Balearic energy'
  },

  // Italy - Pure Pop & Dance
  {
    id: 'italy-deejay',
    name: 'Radio Deejay',
    frequency: '90.3',
    streamUrl: 'https://deejay.coolstream.it/radio-deejay.mp3',
    city: 'italy',
    genre: 'Pop/Dance',
    description: 'Italy\'s biggest dance station'
  },
  {
    id: 'italy-105',
    name: 'Radio 105',
    frequency: '105.0',
    streamUrl: 'https://edge.radioplayer.cloud/105_low',
    city: 'italy',
    genre: 'Dance',
    description: 'Milan\'s finest'
  },
  {
    id: 'italy-italia',
    name: 'Radio Italia',
    frequency: '101.5',
    streamUrl: 'https://radioitaliacloud1.m9.net/radioitalia.mp3',
    city: 'italy',
    genre: 'Italian Pop',
    description: 'Solo musica italiana'
  }
];

/**
 * Get stations for a specific city
 */
export function getStationsByCity(city: CityLocation): RadioStation[] {
  return radioStations.filter(station => station.city === city);
}

/**
 * Get station by ID
 */
export function getStationById(id: string): RadioStation | undefined {
  return radioStations.find(station => station.id === id);
}

/**
 * Get all cities
 */
export function getAllCities(): CityLocation[] {
  return Object.keys(cityThemes) as CityLocation[];
}

/**
 * Get random station from any city (for shuffle mode)
 */
export function getRandomStation(): RadioStation {
  return radioStations[Math.floor(Math.random() * radioStations.length)];
}
