import { RadioStation, CityTheme, CityLocation } from '@/types/radio';

/**
 * City themes with color schemes
 */
export const cityThemes: Record<CityLocation, CityTheme> = {
  'new-york': {
    id: 'new-york',
    name: 'New York',
    primaryColor: '#1a1a1a',
    secondaryColor: '#ffd700',
    accentColor: '#ff4500',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #333333 100%)',
    description: 'The city that never sleeps'
  },
  'miami': {
    id: 'miami',
    name: 'Miami',
    primaryColor: '#ff006e',
    secondaryColor: '#fb5607',
    accentColor: '#ffbe0b',
    gradient: 'linear-gradient(135deg, #ff006e 0%, #fb5607 50%, #ffbe0b 100%)',
    description: 'Neon nights and tropical vibes'
  },
  'ibiza': {
    id: 'ibiza',
    name: 'Ibiza',
    primaryColor: '#5e17eb',
    secondaryColor: '#3a0ca3',
    accentColor: '#4cc9f0',
    gradient: 'linear-gradient(135deg, #5e17eb 0%, #3a0ca3 50%, #4cc9f0 100%)',
    description: 'Electronic paradise'
  },
  'tulum': {
    id: 'tulum',
    name: 'Tulum/Playa',
    primaryColor: '#2d6a4f',
    secondaryColor: '#52b788',
    accentColor: '#f4a261',
    gradient: 'linear-gradient(135deg, #2d6a4f 0%, #52b788 50%, #f4a261 100%)',
    description: 'Earthy jungle meets beach sunset'
  },
  'california': {
    id: 'california',
    name: 'California',
    primaryColor: '#ff6b35',
    secondaryColor: '#f7931e',
    accentColor: '#fdc500',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #fdc500 100%)',
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
  // New York - SomaFM channels
  {
    id: 'ny-groovesalad',
    name: 'Groove Salad',
    frequency: '100.3 FM',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'new-york',
    genre: 'Chillout',
    description: 'A nicely chilled plate of ambient/downtempo beats'
  },
  {
    id: 'ny-defcon',
    name: 'DEF CON Radio',
    frequency: '104.3 FM',
    streamUrl: 'https://ice1.somafm.com/defcon-128-mp3',
    city: 'new-york',
    genre: 'Electronic',
    description: 'Music for Hacking'
  },
  {
    id: 'ny-indiepop',
    name: 'Indie Pop Rocks',
    frequency: '105.1 FM',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
    city: 'new-york',
    genre: 'Indie Pop',
    description: 'New and classic indie pop'
  },
  {
    id: 'ny-u80s',
    name: 'Underground 80s',
    frequency: '103.5 FM',
    streamUrl: 'https://ice1.somafm.com/u80s-128-mp3',
    city: 'new-york',
    genre: 'Alternative',
    description: 'Early 80s UK Synthpop and a bit of New Wave'
  },
  {
    id: 'ny-secretagent',
    name: 'Secret Agent',
    frequency: '101.9 FM',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'new-york',
    genre: 'Lounge',
    description: 'The soundtrack for your stylish, mysterious life'
  },

  // Miami - Tropical & Dance Vibes
  {
    id: 'miami-beach',
    name: 'Miami Beach Radio',
    frequency: '98.7 FM',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'miami',
    genre: 'Electronic',
    description: 'A late night blend of deep-house and downtempo chill'
  },
  {
    id: 'miami-vibes',
    name: 'Miami Vibes',
    frequency: '97.5 FM',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'miami',
    genre: 'Chillout',
    description: 'Smooth tropical beats for sunset sessions'
  },
  {
    id: 'miami-latin',
    name: 'Miami Latin',
    frequency: '99.1 FM',
    streamUrl: 'https://ice1.somafm.com/u80s-128-mp3',
    city: 'miami',
    genre: 'Latin Fusion',
    description: 'Latin rhythms with modern electronic twist'
  },
  {
    id: 'miami-poolside',
    name: 'Poolside FM',
    frequency: '100.5 FM',
    streamUrl: 'https://ice1.somafm.com/poptron-128-mp3',
    city: 'miami',
    genre: 'Poolside Pop',
    description: 'Sunny daytime vibes for pool parties'
  },
  {
    id: 'miami-deep',
    name: 'Miami Deep House',
    frequency: '96.9 FM',
    streamUrl: 'https://ice1.somafm.com/fluid-128-mp3',
    city: 'miami',
    genre: 'Deep House',
    description: 'Deep underground house music'
  },

  // Ibiza - Electronic Paradise
  {
    id: 'ibiza-global',
    name: 'Ibiza Global Radio',
    frequency: '97.6 FM',
    streamUrl: 'https://s1.radio.co/s4e8c8c3d1/listen',
    city: 'ibiza',
    genre: 'Electronic',
    description: 'The worlds most iconic electronic music station'
  },
  {
    id: 'ibiza-deep',
    name: 'Ibiza Deep House',
    frequency: '95.2 FM',
    streamUrl: 'https://ice1.somafm.com/fluid-128-mp3',
    city: 'ibiza',
    genre: 'Deep House',
    description: 'Deep house vibes from the white isle'
  },
  {
    id: 'ibiza-club',
    name: 'Ibiza Club Classics',
    frequency: '98.4 FM',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'ibiza',
    genre: 'Club Classics',
    description: 'Iconic club tracks from the island legends'
  },
  {
    id: 'ibiza-chill',
    name: 'Ibiza Sunset Chill',
    frequency: '92.8 FM',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'ibiza',
    genre: 'Chillout',
    description: 'Sunset sounds for the beach clubs'
  },
  {
    id: 'ibiza-trance',
    name: 'Ibiza Trance',
    frequency: '94.6 FM',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'ibiza',
    genre: 'Trance',
    description: 'Progressive trance and melodic journeys'
  },
  {
    id: 'ibiza-afterhours',
    name: 'Ibiza Afterhours',
    frequency: '91.2 FM',
    streamUrl: 'https://ice1.somafm.com/spacestation-128-mp3',
    city: 'ibiza',
    genre: 'Ambient Electronic',
    description: 'Late night ambient for sunrise sessions'
  },

  // Tulum/Playa del Carmen - Meditation, Chill, Ambient
  {
    id: 'tulum-dronezone',
    name: 'Drone Zone',
    frequency: '100.1 FM',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'tulum',
    genre: 'Ambient Meditation',
    description: 'Atmospheric ambient for meditation and contemplation'
  },
  {
    id: 'tulum-deepspace',
    name: 'Deep Space One',
    frequency: '102.5 FM',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    city: 'tulum',
    genre: 'Ambient Space',
    description: 'Deep ambient electronic and space music for exploration'
  },
  {
    id: 'tulum-paradise-mellow',
    name: 'RP Mellow Mix',
    frequency: '94.1 FM',
    streamUrl: 'https://stream.radioparadise.com/mellow-128',
    city: 'tulum',
    genre: 'Mellow Eclectic',
    description: 'Eclectic mix of calming music for relaxation'
  },
  {
    id: 'tulum-suburbs',
    name: 'Suburbs of Goa',
    frequency: '101.5 FM',
    streamUrl: 'https://ice1.somafm.com/suburbsofgoa-128-mp3',
    city: 'tulum',
    genre: 'Psybient',
    description: 'Downtempo psybient music for stargazing and relaxation'
  },
  {
    id: 'tulum-lush',
    name: 'Lush',
    frequency: '99.3 FM',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'tulum',
    genre: 'Chillout Vocals',
    description: 'Sensuous and mellow vocals, mostly female, with chillout beats'
  },

  // California - Electronic, Pop, Chill
  {
    id: 'ca-groovesalad',
    name: 'Groove Salad',
    frequency: '106.7 FM',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'california',
    genre: 'Chillout',
    description: 'A nicely chilled plate of ambient/downtempo beats'
  },
  {
    id: 'ca-poptron',
    name: 'PopTron',
    frequency: '102.7 FM',
    streamUrl: 'https://ice1.somafm.com/poptron-128-mp3',
    city: 'california',
    genre: 'Electropop',
    description: 'Electropop and indie dance rock'
  },
  {
    id: 'ca-indiepop',
    name: 'Indie Pop Rocks',
    frequency: '91.5 FM',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
    city: 'california',
    genre: 'Indie Pop',
    description: 'New and classic indie pop from around the world'
  },
  {
    id: 'ca-beatblender',
    name: 'Beat Blender',
    frequency: '89.9 FM',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'california',
    genre: 'Electronic',
    description: 'A late night blend of deep-house and downtempo chill'
  },
  {
    id: 'ca-seventies',
    name: 'Left Coast 70s',
    frequency: '89.3 FM',
    streamUrl: 'https://ice1.somafm.com/seventies-128-mp3',
    city: 'california',
    genre: 'Classic Rock',
    description: 'Mellow album rock from the 70s - one rock station'
  },

  // Texas - Electronic, Lounge, Americana
  {
    id: 'tx-bootliquor',
    name: 'Boot Liquor',
    frequency: '91.7 FM',
    streamUrl: 'https://ice1.somafm.com/bootliquor-128-mp3',
    city: 'texas',
    genre: 'Americana',
    description: 'Americana Roots music - the one rock/country station'
  },
  {
    id: 'tx-spacesta',
    name: 'Space Station Soma',
    frequency: '96.7 FM',
    streamUrl: 'https://ice1.somafm.com/spacestation-128-mp3',
    city: 'texas',
    genre: 'Ambient Electronic',
    description: 'Tune in, turn on, space out - electronic ambient'
  },
  {
    id: 'tx-fluid',
    name: 'Fluid',
    frequency: '96.7 FM',
    streamUrl: 'https://ice1.somafm.com/fluid-128-mp3',
    city: 'texas',
    genre: 'Instrumental Hip Hop',
    description: 'Drown in instrumental hip-hop, future soul and liquid trap'
  },
  {
    id: 'tx-illstreet',
    name: 'Illinois Street Lounge',
    frequency: '90.5 FM',
    streamUrl: 'https://ice1.somafm.com/illstreet-128-mp3',
    city: 'texas',
    genre: 'Lounge',
    description: 'Classic bachelor pad, playful exotica and vintage music'
  },
  {
    id: 'tx-secretagent',
    name: 'Secret Agent',
    frequency: '98.9 FM',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'texas',
    genre: 'Lounge Spy',
    description: 'The soundtrack for your stylish, mysterious life'
  },

  // French - Keeping original French stations (these URLs should work)
  {
    id: 'fr-fip',
    name: 'FIP',
    frequency: '105.1 FM',
    streamUrl: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
    city: 'french',
    genre: 'Eclectic',
    description: 'Eclectic Music Selection'
  },
  {
    id: 'fr-inter',
    name: 'France Inter',
    frequency: '87.8 FM',
    streamUrl: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
    city: 'french',
    genre: 'Talk/Culture',
    description: 'Culture & Information'
  },
  {
    id: 'fr-musique',
    name: 'France Musique',
    frequency: '91.7 FM',
    streamUrl: 'https://icecast.radiofrance.fr/francemusique-midfi.mp3',
    city: 'french',
    genre: 'Classical',
    description: 'Classical and Jazz Music'
  },
  {
    id: 'fr-cultura',
    name: 'France Culture',
    frequency: '93.5 FM',
    streamUrl: 'https://icecast.radiofrance.fr/franceculture-midfi.mp3',
    city: 'french',
    genre: 'Talk/Culture',
    description: 'Ideas, Arts, and Knowledge'
  },
  {
    id: 'fr-nova',
    name: 'Radio Nova',
    frequency: '101.5 FM',
    streamUrl: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3',
    city: 'french',
    genre: 'Eclectic',
    description: 'New Music and World Sounds'
  },

  // Talk Radio & Informational - News, Culture, Variety
  {
    id: 'talk-bbc-world',
    name: 'BBC World Service',
    frequency: 'Talk 1',
    streamUrl: 'https://stream.live.vc.bbcmedia.co.uk/bbc_world_service',
    city: 'podcasts',
    genre: 'World News',
    description: 'Global news, analysis and features from the BBC'
  },
  {
    id: 'talk-fip',
    name: 'FIP',
    frequency: 'Talk 2',
    streamUrl: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
    city: 'podcasts',
    genre: 'Eclectic Radio',
    description: 'French eclectic radio with diverse music and minimal talk'
  },
  {
    id: 'talk-paradise-main',
    name: 'Radio Paradise',
    frequency: 'Talk 3',
    streamUrl: 'https://stream.radioparadise.com/mp3-128',
    city: 'podcasts',
    genre: 'Eclectic Mix',
    description: 'Eclectic mix of rock, indie, electronica, world - DJ curated'
  },
  {
    id: 'talk-francecult',
    name: 'France Culture',
    frequency: 'Talk 4',
    streamUrl: 'https://icecast.radiofrance.fr/franceculture-midfi.mp3',
    city: 'podcasts',
    genre: 'Culture & Ideas',
    description: 'French cultural radio with debates, documentaries, and analysis'
  },
  {
    id: 'talk-inter',
    name: 'France Inter',
    frequency: 'Talk 5',
    streamUrl: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
    city: 'podcasts',
    genre: 'News & Culture',
    description: 'French talk radio with news, interviews, and entertainment'
  },
  {
    id: 'talk-sonicuniverse',
    name: 'Sonic Universe',
    frequency: 'Talk 6',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'podcasts',
    genre: 'Jazz Variety',
    description: 'Transcending jazz with eclectic, avant-garde takes and world fusion'
  },
  {
    id: 'talk-indie',
    name: 'Indie Pop Rocks',
    frequency: 'Talk 7',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
    city: 'podcasts',
    genre: 'Indie Pop',
    description: 'New and classic indie pop from around the world'
  },
  {
    id: 'talk-folkfwd',
    name: 'Folk Forward',
    frequency: 'Talk 8',
    streamUrl: 'https://ice1.somafm.com/folkfwd-128-mp3',
    city: 'podcasts',
    genre: 'Folk & Americana',
    description: 'Indie folk, alt-folk and occasional classics'
  },
  {
    id: 'talk-covers',
    name: 'Covers',
    frequency: 'Talk 9',
    streamUrl: 'https://ice1.somafm.com/covers-128-mp3',
    city: 'podcasts',
    genre: 'Cover Songs',
    description: 'Songs you know by artists you don\'t - unique cover versions'
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
