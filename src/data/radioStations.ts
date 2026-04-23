import { RadioStation, CityTheme, CityLocation } from '@/types/radio';

/**
 * City themes with color schemes
 */
export const cityThemes: Record<CityLocation, CityTheme> = {
  'new-york': {
    id: 'new-york',
    name: 'New York',
    primaryColor: '#ff3d00',
    secondaryColor: '#1a1a1a',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #ff3d00 0%, #1a1a1a 100%)',
    description: 'The city that never sleeps'
  },
  'miami': {
    id: 'miami',
    name: 'Miami',
    primaryColor: '#00d2ff',
    secondaryColor: '#E4007C',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #00d2ff 0%, #E4007C 100%)',
    description: 'Neon nights and tropical vibes'
  },
  'ibiza': {
    id: 'ibiza',
    name: 'Ibiza',
    primaryColor: '#a100ff',
    secondaryColor: '#00e5ff',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #a100ff 0%, #00e5ff 100%)',
    description: 'Electronic paradise'
  },
  'tulum': {
    id: 'tulum',
    name: 'Tulum/Playa',
    primaryColor: '#FF4D00',
    secondaryColor: '#FFB347',
    accentColor: '#FF6B35',
    gradient: 'linear-gradient(135deg, #FF4D00 0%, #FFB347 50%, #FF6B35 100%)',
    description: 'Earthy jungle meets beach sunset'
  },
  'california': {
    id: 'california',
    name: 'California',
    primaryColor: '#FF1493',
    secondaryColor: '#FFD700',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #FF1493 0%, #FFD700 100%)',
    description: 'West coast sunshine'
  },
  'texas': {
    id: 'texas',
    name: 'Texas',
    primaryColor: '#9e0000',
    secondaryColor: '#cd853f',
    accentColor: '#daa520',
    gradient: 'linear-gradient(135deg, #9e0000 0%, #cd853f 50%, #daa520 100%)',
    description: 'Lone star vibes'
  },
  'french': {
    id: 'french',
    name: 'French',
    primaryColor: '#002395',
    secondaryColor: '#ffffff',
    accentColor: '#ed2939',
    gradient: 'linear-gradient(135deg, #002395 0%, #ffffff 50%, #ed2939 100%)',
    description: 'Parisian elegance'
  },
  'italy': {
    id: 'italy',
    name: 'Italy',
    primaryColor: '#008c45',
    secondaryColor: '#cd212a',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #008c45 0%, #ffffff 50%, #cd212a 100%)',
    description: 'Italian vibes and electronic energy'
  },
  'podcasts': {
    id: 'podcasts',
    name: 'Podcasts',
    primaryColor: '#7b1fa2',
    secondaryColor: '#ce93d8',
    accentColor: '#ffd600',
    gradient: 'linear-gradient(135deg, #7b1fa2 0%, #ce93d8 50%, #ffd600 100%)',
    description: 'Talk shows and storytelling'
  },
  'reggae': {
    id: 'reggae',
    name: 'Reggae',
    primaryColor: '#388e3c',
    secondaryColor: '#fbc02d',
    accentColor: '#000000',
    gradient: 'linear-gradient(135deg, #388e3c 0%, #fbc02d 50%, #000000 100%)',
    description: 'Island vibes and roots music'
  },
  'jazz': {
    id: 'jazz',
    name: 'Jazz',
    primaryColor: '#263238',
    secondaryColor: '#ffa000',
    accentColor: '#ff5252',
    gradient: 'linear-gradient(135deg, #263238 0%, #ffa000 50%, #ff5252 100%)',
    description: 'Smooth jazz and improvisations'
  },
  'arabic': {
    id: 'arabic',
    name: 'Arabic',
    primaryColor: '#af9164',
    secondaryColor: '#7d1e28',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #af9164 0%, #7d1e28 100%)',
    description: 'Middle Eastern Sounds'
  },
  'persian': {
    id: 'persian',
    name: 'Persian',
    primaryColor: '#008450',
    secondaryColor: '#ffffff',
    accentColor: '#d32f2f',
    gradient: 'linear-gradient(135deg, #008450 0%, #d32f2f 100%)',
    description: 'Iranian Melodies'
  },
  'meditation': {
    id: 'meditation',
    name: 'Meditation',
    primaryColor: '#9c27b0',
    secondaryColor: '#f06292',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #9c27b0 0%, #f06292 100%)',
    description: 'Zen and Relaxation'
  },
  'bongs': {
    id: 'bongs',
    name: 'Bowls & Gongs',
    primaryColor: '#c5b358',
    secondaryColor: '#121212',
    accentColor: '#ffffff',
    gradient: 'linear-gradient(135deg, #c5b358 0%, #121212 100%)',
    description: 'Sound Baths & Healing'
  }
};

/**
 * All radio stations organized by city (10 stations per city)
 */
export const radioStations: RadioStation[] = [
  // Miami - 10 Stations
  {
    id: 'miami-1',
    name: 'Miami Deep House',
    frequency: '93.1',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'miami',
    genre: 'Deep House',
    description: 'Ultra-lux house vibes',
    albumArt: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'miami-2',
    name: 'Revolution Radio',
    frequency: '93.5',
    streamUrl: 'https://ice1.somafm.com/sf1033-128-mp3',
    city: 'miami',
    genre: 'EDM',
    description: 'Miami Electronic Music',
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'miami-3',
    name: 'Chill Miami',
    frequency: '104.1',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'miami',
    genre: 'Chillout',
    description: 'Downtempo Beats',
    albumArt: 'https://images.unsplash.com/photo-1514525253344-f81bad00a926?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'miami-4',
    name: 'Miami Vibes',
    frequency: '99.5',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'miami',
    genre: 'Downtempo',
    description: 'Tropical Rhythms',
    albumArt: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'miami-5',
    name: 'South Beach Lounge',
    frequency: '102.3',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'miami',
    genre: 'Lounge',
    description: 'Elegant nights'
  },
  {
    id: 'miami-6',
    name: 'Ocean Drive',
    frequency: '95.1',
    streamUrl: 'https://ice1.somafm.com/thetrip-128-mp3',
    city: 'miami',
    genre: 'House',
    description: 'Cruising the coast'
  },
  {
    id: 'miami-7',
    name: 'Secret Agent',
    frequency: '101.5',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'miami',
    genre: 'Retro',
    description: 'Old school vibes'
  },
  {
    id: 'miami-8',
    name: 'Miami 80s',
    frequency: '88.7',
    streamUrl: 'https://ice1.somafm.com/u80s-128-mp3',
    city: 'miami',
    genre: '80s Pop',
    description: 'Vice City sound'
  },
  {
    id: 'miami-9',
    name: 'Sub-Zero',
    frequency: '94.3',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'miami',
    genre: 'IDM',
    description: 'Intelligent beats'
  },
  {
    id: 'miami-10',
    name: 'Sunshine State',
    frequency: '107.1',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
    city: 'miami',
    genre: 'Indie',
    description: 'Bright and breezy'
  },

  // New York - 10 Stations
  {
    id: 'ny-1',
    name: 'WNYC Public',
    frequency: '93.9',
    streamUrl: 'https://fm939.wnyc.org/wnycfm.mp3',
    city: 'new-york',
    genre: 'Talk',
    description: 'Public Radio'
  },
  {
    id: 'ny-2',
    name: 'WKCR Jazz',
    frequency: '89.9',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'new-york',
    genre: 'Jazz',
    description: 'Real NY Jazz',
    albumArt: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'ny-3',
    name: 'The Big Apple',
    frequency: '101.1',
    streamUrl: 'https://ice1.somafm.com/seven-128-mp3',
    city: 'new-york',
    genre: '70s Pop',
    description: 'Classic NY',
    albumArt: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'ny-4',
    name: 'Brooklyn Underground',
    frequency: '105.5',
    streamUrl: 'https://ice1.somafm.com/suburbansprawl-128-mp3',
    city: 'new-york',
    genre: 'Indie',
    description: 'Bushwick sounds'
  },
  {
    id: 'ny-5',
    name: 'Central Park Chill',
    frequency: '92.3',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'new-york',
    genre: 'Chillout',
    description: 'Oasis in the city'
  },
  {
    id: 'ny-6',
    name: 'Modern Rock',
    frequency: '98.7',
    streamUrl: 'https://ice1.somafm.com/bagel-128-mp3',
    city: 'new-york',
    genre: 'Rock',
    description: 'Power chords'
  },
  {
    id: 'ny-7',
    name: 'Empire Classical',
    frequency: '96.3',
    streamUrl: 'https://ice1.somafm.com/bootliquor-128-mp3',
    city: 'new-york',
    genre: 'Classical',
    description: 'Masterpieces'
  },
  {
    id: 'ny-8',
    name: 'NYC Ambient',
    frequency: '104.5',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'new-york',
    genre: 'Ambient',
    description: 'Late night NY'
  },
  {
    id: 'ny-9',
    name: 'Worldwide FM',
    frequency: '90.7',
    streamUrl: 'https://ice1.somafm.com/covers-128-mp3',
    city: 'new-york',
    genre: 'Eclectic',
    description: 'Global sounds'
  },
  {
    id: 'ny-10',
    name: 'Rinse FM',
    frequency: '106.8',
    streamUrl: 'https://ice1.somafm.com/missioncontrol-128-mp3',
    city: 'new-york',
    genre: 'Underground',
    description: 'London to NY'
  },

  // Ibiza - 10 Stations
  {
    id: 'ibiza-1',
    name: 'Ibiza Global Live',
    frequency: '97.6',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'ibiza',
    genre: 'Electronic',
    description: 'The Soul of Ibiza',
    albumArt: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'ibiza-2',
    name: 'Ibiza Sonica',
    frequency: '92.4',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'ibiza',
    genre: 'House',
    description: 'Deep Vibes',
    albumArt: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'ibiza-3',
    name: 'Blue Marlin',
    frequency: '101.2',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'ibiza',
    genre: 'Chill',
    description: 'Beach Club',
    albumArt: 'https://images.unsplash.com/photo-1514525253344-f81bad00a926?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'ibiza-4',
    name: 'Pure Ibiza',
    frequency: '95.5',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'ibiza',
    genre: 'Electronic',
    description: 'Sunset Bliss'
  },
  {
    id: 'ibiza-5',
    name: 'Groove Salad',
    frequency: '104.7',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'ibiza',
    genre: 'Ambient',
    description: 'Chillout Lounge'
  },
  {
    id: 'ibiza-6',
    name: 'Lush Ibiza',
    frequency: '99.9',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'ibiza',
    genre: 'Vocals',
    description: 'Deep & Melodic'
  },
  {
    id: 'ibiza-7',
    name: 'Cafe Del Mar',
    frequency: '107.0',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    city: 'ibiza',
    genre: 'Chillout',
    description: 'The Original Sunset'
  },
  {
    id: 'ibiza-8',
    name: 'Underground Ibiza',
    frequency: '102.1',
    streamUrl: 'https://ice1.somafm.com/thetrip-128-mp3',
    city: 'ibiza',
    genre: 'Techno',
    description: 'Afterparty vibes'
  },
  {
    id: 'ibiza-9',
    name: 'Ibiza 80s',
    frequency: '106.3',
    streamUrl: 'https://ice1.somafm.com/u80s-128-mp3',
    city: 'ibiza',
    genre: 'Retro',
    description: 'Classic Island'
  },
  {
    id: 'ibiza-10',
    name: 'Secret Agent',
    frequency: '105.5',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'ibiza',
    genre: 'Lounge',
    description: 'Elegant Mystery'
  },

  // Tulum - 10 Stations
  {
    id: 'tulum-1',
    name: 'Tulum Deep Pulse',
    frequency: '102.1',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'tulum',
    genre: 'Deep House',
    description: 'Sunset & Jungle beats',
    albumArt: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'tulum-2',
    name: 'Nomade Vibes',
    frequency: '98.5',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'tulum',
    genre: 'Chillout',
    description: 'Vocal Bliss',
    albumArt: 'https://images.unsplash.com/photo-1454486326920-d4443bc37478?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'tulum-3',
    name: 'Drone Zone',
    frequency: '100.1',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'tulum',
    genre: 'Ambient',
    description: 'Deep Roots'
  },
  {
    id: 'tulum-4',
    name: 'Deep Space',
    frequency: '94.3',
    streamUrl: 'https://ice1.somafm.com/deepspaceone-128-mp3',
    city: 'tulum',
    genre: 'Space',
    description: 'Cosmic Journey'
  },
  {
    id: 'tulum-5',
    name: 'Papaya Playa',
    frequency: '91.7',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'tulum',
    genre: 'House',
    description: 'Beach Club'
  },
  {
    id: 'tulum-6',
    name: 'Be Tulum',
    frequency: '105.9',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'tulum',
    genre: 'Lounge',
    description: 'Elegant nights'
  },
  {
    id: 'tulum-7',
    name: 'Ahau Vibes',
    frequency: '103.5',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'tulum',
    genre: 'Jazz',
    description: 'Global Jazz'
  },
  {
    id: 'tulum-8',
    name: 'PopTron',
    frequency: '107.5',
    streamUrl: 'https://ice1.somafm.com/poptron-128-mp3',
    city: 'tulum',
    genre: 'Indie Pop',
    description: 'Fresh Beats'
  },
  {
    id: 'tulum-9',
    name: 'The Trip',
    frequency: '96.7',
    streamUrl: 'https://ice1.somafm.com/thetrip-128-mp3',
    city: 'tulum',
    genre: 'Techno',
    description: 'After dark'
  },
  {
    id: 'tulum-10',
    name: 'Illinois Street',
    frequency: '89.1',
    streamUrl: 'https://ice1.somafm.com/illstreet-128-mp3',
    city: 'tulum',
    genre: 'Lounge',
    description: 'Classic Lounge'
  },

  // California - 10 Stations
  {
    id: 'cali-1',
    name: 'LA Chill',
    frequency: '104.3',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'california',
    genre: 'Chillout',
    description: 'West Coast Calm'
  },
  {
    id: 'cali-2',
    name: 'Surfer Pop',
    frequency: '99.1',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
    city: 'california',
    genre: 'Indie',
    description: 'Beach Bound'
  },
  {
    id: 'cali-3',
    name: 'SF Underground',
    frequency: '107.7',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'california',
    genre: 'House',
    description: 'Foggy Beats'
  },
  {
    id: 'cali-4',
    name: 'Hills Folk',
    frequency: '90.5',
    streamUrl: 'https://ice1.somafm.com/folkfwd-128-mp3',
    city: 'california',
    genre: 'Folk',
    description: 'Canyon Sounds'
  },
  {
    id: 'cali-5',
    name: 'Silicon Valley',
    frequency: '101.9',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'california',
    genre: 'IDM',
    description: 'Tech Flow'
  },
  {
    id: 'cali-6',
    name: 'Sunset Blvd',
    frequency: '95.3',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'california',
    genre: 'Vocals',
    description: 'Golden Hour'
  },
  {
    id: 'cali-7',
    name: 'Pacific Ambient',
    frequency: '88.1',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'california',
    genre: 'Ambient',
    description: 'Ocean Deep'
  },
  {
    id: 'cali-8',
    name: 'Retro LA',
    frequency: '103.1',
    streamUrl: 'https://ice1.somafm.com/u80s-128-mp3',
    city: 'california',
    genre: '80s',
    description: 'Synthesizer Sunsets'
  },
  {
    id: 'cali-9',
    name: 'Malibu Lounge',
    frequency: '106.5',
    streamUrl: 'https://ice1.somafm.com/bagel-128-mp3',
    city: 'california',
    genre: 'Alt Rock',
    description: 'Coastline Vibes'
  },
  {
    id: 'cali-10',
    name: 'Napa Jazz',
    frequency: '97.5',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'california',
    genre: 'Jazz',
    description: 'Smooth Harvest'
  },

  // Texas - 10 Stations
  {
    id: 'texas-1',
    name: 'Austin Indie',
    frequency: '90.5',
    streamUrl: 'https://ice1.somafm.com/bagel-128-mp3',
    city: 'texas',
    genre: 'Indie',
    description: 'Keep Austin Weird'
  },
  {
    id: 'texas-2',
    name: 'Lone Star Folk',
    frequency: '101.9',
    streamUrl: 'https://ice1.somafm.com/folkfwd-128-mp3',
    city: 'texas',
    genre: 'Folk',
    description: 'Coyote Nights'
  },
  {
    id: 'texas-3',
    name: 'Dallas Deep',
    frequency: '93.7',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'texas',
    genre: 'Chill',
    description: 'Big State Beats'
  },
  {
    id: 'texas-4',
    name: 'Houston Hop',
    frequency: '97.9',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'texas',
    genre: 'IDM',
    description: 'Space City Sound'
  },
  {
    id: 'texas-5',
    name: 'San Antonio Soul',
    frequency: '105.3',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'texas',
    genre: 'R&B',
    description: 'Alamo Beats'
  },
  {
    id: 'texas-6',
    name: 'Ranch Radio',
    frequency: '92.1',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'texas',
    genre: 'Retro',
    description: 'Dusty Classics'
  },
  {
    id: 'texas-7',
    name: 'Texas Techno',
    frequency: '107.5',
    streamUrl: 'https://ice1.somafm.com/thetrip-128-mp3',
    city: 'texas',
    genre: 'Techno',
    description: 'Warehouse Raves'
  },
  {
    id: 'texas-8',
    name: 'Bluebonnet Jazz',
    frequency: '89.5',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'texas',
    genre: 'Jazz',
    description: 'Meadow Improvisation'
  },
  {
    id: 'texas-9',
    name: 'Border Blast',
    frequency: '94.1',
    streamUrl: 'https://ice1.somafm.com/poptron-128-mp3',
    city: 'texas',
    genre: 'Pop',
    description: 'South State Hits'
  },
  {
    id: 'texas-10',
    name: 'Prairie Drone',
    frequency: '100.9',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'texas',
    genre: 'Ambient',
    description: 'Endless Horizon'
  },

  // French - 10 Stations
  {
    id: 'french-1',
    name: 'Paris Chill',
    frequency: '102.3',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'french',
    genre: 'Lounge',
    description: 'Chic Parisien'
  },
  {
    id: 'french-2',
    name: 'Riviera Beats',
    frequency: '95.5',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'french',
    genre: 'House',
    description: 'Beach Club Luxury'
  },
  {
    id: 'french-3',
    name: 'Lyon Lounge',
    frequency: '107.1',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'french',
    genre: 'Chill',
    description: 'Silk City Sounds'
  },
  {
    id: 'french-4',
    name: 'Marseille Mix',
    frequency: '98.9',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'french',
    genre: 'Electronic',
    description: 'Mediterranean Pulse'
  },
  {
    id: 'french-5',
    name: 'Cannes Classic',
    frequency: '101.5',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'french',
    genre: 'Jazz',
    description: 'Red Carpet Vibes'
  },
  {
    id: 'french-6',
    name: 'French Folk',
    frequency: '92.7',
    streamUrl: 'https://ice1.somafm.com/folkfwd-128-mp3',
    city: 'french',
    genre: 'Folk',
    description: 'Countryside Dreams'
  },
  {
    id: 'french-7',
    name: 'Vogue Radio',
    frequency: '103.7',
    streamUrl: 'https://ice1.somafm.com/poptron-128-mp3',
    city: 'french',
    genre: 'Pop',
    description: 'Trendsetter Tracks'
  },
  {
    id: 'french-8',
    name: 'Paris Ambient',
    frequency: '89.5',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'french',
    genre: 'Ambient',
    description: 'Rainy Paris Nights'
  },
  {
    id: 'french-9',
    name: 'Retro France',
    frequency: '94.3',
    streamUrl: 'https://ice1.somafm.com/u80s-128-mp3',
    city: 'french',
    genre: '80s',
    description: 'Vintage Synth'
  },
  {
    id: 'french-10',
    name: 'Indie Paris',
    frequency: '106.1',
    streamUrl: 'https://ice1.somafm.com/bagel-128-mp3',
    city: 'french',
    genre: 'Indie',
    description: 'Modern Boutique'
  },

  // Italy - 10 Stations
  {
    id: 'italy-1',
    name: 'Milan Deep',
    frequency: '90.3',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'italy',
    genre: 'House',
    description: 'Fashion Week Beats'
  },
  {
    id: 'italy-2',
    name: 'Rome Chill',
    frequency: '105.0',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'italy',
    genre: 'Chillout',
    description: 'Eternal City Lounge'
  },
  {
    id: 'italy-3',
    name: 'Venice Ambient',
    frequency: '101.5',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'italy',
    genre: 'Ambient',
    description: 'Floating Melodies'
  },
  {
    id: 'italy-4',
    name: 'Tuscany Folk',
    frequency: '92.9',
    streamUrl: 'https://ice1.somafm.com/folkfwd-128-mp3',
    city: 'italy',
    genre: 'Folk',
    description: 'Rolling Hills Soundtrack'
  },
  {
    id: 'italy-5',
    name: 'Naples Neo',
    frequency: '98.1',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'italy',
    genre: 'IDM',
    description: 'Modern Heritage'
  },
  {
    id: 'italy-6',
    name: 'Sicily Soul',
    frequency: '104.5',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'italy',
    genre: 'Vocals',
    description: 'Heart of Italy'
  },
  {
    id: 'italy-7',
    name: 'Italian Jazz',
    frequency: '89.7',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'italy',
    genre: 'Jazz',
    description: 'Elegant Evenings'
  },
  {
    id: 'italy-8',
    name: 'Dolce Pop',
    frequency: '107.3',
    streamUrl: 'https://ice1.somafm.com/poptron-128-mp3',
    city: 'italy',
    genre: 'Pop',
    description: 'Sweetest Hits'
  },
  {
    id: 'italy-9',
    name: 'Vintage Roma',
    frequency: '96.5',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'italy',
    genre: 'Retro',
    description: 'La Dolce Vita'
  },
  {
    id: 'italy-10',
    name: 'Firenze Indie',
    frequency: '94.9',
    streamUrl: 'https://ice1.somafm.com/bagel-128-mp3',
    city: 'italy',
    genre: 'Indie Rock',
    description: 'Renaissance Energy'
  },

  // Podcasts - 10 Stations
  {
    id: 'pod-1',
    name: 'Secret Agent',
    frequency: '105.5',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'podcasts',
    genre: 'Espionage',
    description: 'Spies & Soundtrack'
  },
  {
    id: 'pod-2',
    name: 'Mission Control',
    frequency: '93.3',
    streamUrl: 'https://ice1.somafm.com/missioncontrol-128-mp3',
    city: 'podcasts',
    genre: 'Space',
    description: 'NASA Audio & Beats'
  },
  {
    id: 'pod-3',
    name: 'Boot Liquor',
    frequency: '88.5',
    streamUrl: 'https://ice1.somafm.com/bootliquor-128-mp3',
    city: 'podcasts',
    genre: 'Americana',
    description: 'Stories of the Road'
  },
  {
    id: 'pod-4',
    name: 'Folk Forward',
    frequency: '90.9',
    streamUrl: 'https://ice1.somafm.com/folkfwd-128-mp3',
    city: 'podcasts',
    genre: 'Folk Radio',
    description: 'Modern Storytelling'
  },
  {
    id: 'pod-5',
    name: 'Seven Inch Soul',
    frequency: '101.1',
    streamUrl: 'https://ice1.somafm.com/seven-128-mp3',
    city: 'podcasts',
    genre: 'Soul Music',
    description: 'Classic Grooves'
  },
  {
    id: 'pod-6',
    name: 'Suburban Sprawl',
    frequency: '96.3',
    streamUrl: 'https://ice1.somafm.com/suburbansprawl-128-mp3',
    city: 'podcasts',
    genre: 'Indie Talk',
    description: 'Underground Culture'
  },
  {
    id: 'pod-7',
    name: 'Covers Podcast',
    frequency: '94.7',
    streamUrl: 'https://ice1.somafm.com/covers-128-mp3',
    city: 'podcasts',
    genre: 'Covers',
    description: 'New Takes on Classics'
  },
  {
    id: 'pod-8',
    name: 'Vaporwaves',
    frequency: '107.7',
    streamUrl: 'https://ice1.somafm.com/vaporwaves-128-mp3',
    city: 'podcasts',
    genre: 'Vaporwave',
    description: 'Internet Culture'
  },
  {
    id: 'pod-9',
    name: 'Cliqhop Podcast',
    frequency: '92.1',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'podcasts',
    genre: 'Electronic',
    description: 'Digital Discussion'
  },
  {
    id: 'pod-10',
    name: 'SF 10-33',
    frequency: '104.9',
    streamUrl: 'https://ice1.somafm.com/sf1033-128-mp3',
    city: 'podcasts',
    genre: 'Public Safety',
    description: 'City Pulse'
  },

  // Reggae - 10 Stations
  {
    id: 'reggae-1',
    name: 'Irie FM',
    frequency: '98.1',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'reggae',
    genre: 'Reggae',
    description: 'The heartbeat of reggae music'
  },
  {
    id: 'reggae-2',
    name: 'Riddim FM',
    frequency: '99.9',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'reggae',
    genre: 'Reggae',
    description: 'Jamaican rhythms 24/7'
  },
  {
    id: 'reggae-3',
    name: 'Reggae Radio 247',
    frequency: '101.5',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'reggae',
    genre: 'Reggae',
    description: 'Non-stop reggae'
  },
  {
    id: 'reggae-4',
    name: 'Hitdiffusion Reggae',
    frequency: '103.7',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'reggae',
    genre: 'Reggae',
    description: 'Best reggae hits'
  },
  {
    id: 'reggae-5',
    name: 'Radio Jamaica',
    frequency: '94.1',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'reggae',
    genre: 'Reggae',
    description: 'Jamaican news and music'
  },
  {
    id: 'reggae-6',
    name: 'Roots Reggae Radio',
    frequency: '96.5',
    streamUrl: 'https://ice1.somafm.com/folkfwd-128-mp3',
    city: 'reggae',
    genre: 'Roots Reggae',
    description: 'Classic roots reggae'
  },
  {
    id: 'reggae-7',
    name: 'Dubplate Radio',
    frequency: '105.3',
    streamUrl: 'https://ice1.somafm.com/thetrip-128-mp3',
    city: 'reggae',
    genre: 'Dub',
    description: 'Dub and roots'
  },
  {
    id: 'reggae-8',
    name: 'Caribbean FM',
    frequency: '92.7',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'reggae',
    genre: 'Caribbean',
    description: 'Caribbean vibes'
  },
  {
    id: 'reggae-9',
    name: 'Reggae Roots',
    frequency: '107.9',
    streamUrl: 'https://ice1.somafm.com/secretagent-128-mp3',
    city: 'reggae',
    genre: 'Roots',
    description: 'Roots and culture'
  },
  {
    id: 'reggae-10',
    name: 'Jamaica Radio',
    frequency: '88.3',
    streamUrl: 'https://ice1.somafm.com/suburbansprawl-128-mp3',
    city: 'reggae',
    genre: 'Reggae',
    description: 'Authentic Jamaican sound'
  },

  // Jazz - 10 Stations
  {
    id: 'jazz-1',
    name: 'Jazz24 (KNKX)',
    frequency: '88.5',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'jazz',
    genre: 'Jazz',
    description: '24/7 jazz music'
  },
  {
    id: 'jazz-2',
    name: 'Jazz FM (UK)',
    frequency: '96.9',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'jazz',
    genre: 'Jazz',
    description: "UK's number one for jazz"
  },
  {
    id: 'jazz-3',
    name: 'Smooth Jazz',
    frequency: '103.5',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'jazz',
    genre: 'Smooth Jazz',
    description: 'Smooth jazz sounds'
  },
  {
    id: 'jazz-4',
    name: 'Jazz Radio France',
    frequency: '99.3',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'jazz',
    genre: 'Jazz',
    description: 'French jazz radio'
  },
  {
    id: 'jazz-5',
    name: 'Radio Swiss Jazz',
    frequency: '92.1',
    streamUrl: 'https://ice1.somafm.com/dronezone-128-mp3',
    city: 'jazz',
    genre: 'Jazz',
    description: 'Swiss jazz 24/7'
  },
  {
    id: 'jazz-6',
    name: 'Jazz24 Seattle',
    frequency: '105.9',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'jazz',
    genre: 'Jazz',
    description: "Seattle's jazz station"
  },
  {
    id: 'jazz-7',
    name: 'Smooth Jazz Florida',
    frequency: '94.7',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'jazz',
    genre: 'Smooth Jazz',
    description: "Florida's smooth jazz"
  },
  {
    id: 'jazz-8',
    name: 'FM Jazz',
    frequency: '101.1',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'jazz',
    genre: 'Jazz',
    description: 'World class jazz'
  },
  {
    id: 'jazz-9',
    name: 'Jazz88',
    frequency: '88.3',
    streamUrl: 'https://ice1.somafm.com/sonicuniverse-128-mp3',
    city: 'jazz',
    genre: 'Jazz',
    description: "Minnesota's jazz station"
  },
  {
    id: 'jazz-10',
    name: 'KJAZZ',
    frequency: '91.9',
    streamUrl: 'https://ice1.somafm.com/beatblender-128-mp3',
    city: 'jazz',
    genre: 'Jazz',
    description: 'Santa Monica jazz'
  },

  // Tulum/Beach Special — 5 Swipess Featured Stations
  {
    id: 'tulum-beach-1',
    name: 'Tulum Sunset Beats',
    frequency: '96.3',
    streamUrl: 'https://ice1.somafm.com/groovesalad-128-mp3',
    city: 'tulum',
    genre: 'Downtempo',
    description: 'Jungle meets ocean — the Tulum vibe'
  },
  {
    id: 'tulum-beach-2',
    name: 'Playa del Carmen FM',
    frequency: '98.7',
    streamUrl: 'https://ice1.somafm.com/lush-128-mp3',
    city: 'tulum',
    genre: 'Chillout',
    description: 'Beachfront lounge vibes from the Riviera Maya'
  },
  {
    id: 'tulum-beach-3',
    name: 'Cenote Sounds',
    frequency: '103.5',
    streamUrl: 'https://ice1.somafm.com/vaporwaves-128-mp3',
    city: 'tulum',
    genre: 'Organic House',
    description: 'Deep jungle electronic from the Yucatan'
  },
  {
    id: 'tulum-beach-4',
    name: 'Caribbean Reggae Waves',
    frequency: '91.1',
    streamUrl: 'https://ice1.somafm.com/indiepop-128-mp3',
    city: 'reggae',
    genre: 'Reggae',
    description: 'Island roots from the Caribbean coast'
  },
  {
    id: 'tulum-beach-5',
    name: 'Swipess Beach Radio',
    frequency: '105.9',
    streamUrl: 'https://ice1.somafm.com/cliqhop-128-mp3',
    city: 'tulum',
    genre: 'Electronic',
    description: 'The official Swipess beach frequency'
  }
];

export function getStationsByCity(city: CityLocation): RadioStation[] {
  return radioStations.filter(station => station.city === city);
}

export function getStationById(id: string): RadioStation | undefined {
  return radioStations.find(station => station.id === id);
}

export function getAllCities(): CityLocation[] {
  return Object.keys(cityThemes) as CityLocation[];
}

export function getRandomStation(): RadioStation {
  return radioStations[Math.floor(Math.random() * radioStations.length)];
}


