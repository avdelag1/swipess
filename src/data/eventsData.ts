import { Sparkles, Palmtree, Leaf, Music, Utensils, Tag, Heart } from 'lucide-react';
import { EventItem } from '@/types/events';

export const CATEGORIES = [
  { key: 'all', label: 'All', icon: Sparkles, img: '/images/events/gallery_night.png', color: '#f97316' }, 
  { key: 'beach', label: 'Beach', icon: Palmtree, img: '/images/events/cacao_ceremony.png', color: '#0ea5e9' }, 
  { key: 'jungle', label: 'Jungle', icon: Leaf, img: '/images/events/yoga_sound.png', color: '#22c55e' }, 
  { key: 'music', label: 'Music', icon: Music, img: '/images/events/cenote_rave.png', color: '#8b5cf6' }, 
  { key: 'food', label: 'Restaurants', icon: Utensils, img: '/images/events/food_market.png', color: '#ef4444' }, 
  { key: 'promo', label: 'Deals', icon: Tag, img: '/images/events/sunset_session.png', color: '#facc15' }, 
  { key: 'likes', label: 'My Likes', icon: Heart, img: '/images/events/gallery_night.png', color: '#ec4899' }, 
];

export const MOCK_EVENTS: EventItem[] = [
  {
    id: 'm1', title: 'Sunset Cacao Ceremony', category: 'beach',
    image_url: '/images/events/cacao_ceremony.png',
    description: 'Sacred cacao ceremony at sunset on the Caribbean shore. Meditation, sound healing, and deep connection with yourself.',
    event_date: '2026-04-05T18:00:00', location: 'Playa Paraíso, Tulum', location_detail: 'Beach Club',
    organizer_name: 'Casa Luna', organizer_whatsapp: '+529841234567', promo_text: 'Limited spots', discount_tag: 'EARLY BIRD', is_free: false, price_text: '$350 MXN',
  },
  {
    id: 'm2', title: 'Full Moon Beach Party', category: 'music',
    image_url: '/images/events/cenote_rave.png',
    description: 'Full moon jungle party on the beach. International DJs, laser lights, fire torches, and dancing under the stars all night long.',
    event_date: '2026-04-06T22:00:00', location: 'Playa Ruinas, Tulum', location_detail: 'Beach Stage',
    organizer_name: 'Zamna Tulum', organizer_whatsapp: '+529847654321', promo_text: 'Full moon night', discount_tag: 'TONIGHT', is_free: false, price_text: '$800 MXN',
  },
  {
    id: 'm3', title: 'Beachfront Yoga Flow', category: 'jungle',
    image_url: '/images/events/yoga_sound.png',
    description: 'Ocean-view yoga class in an open palapa studio. Expert-led flow for all levels with the sound of the waves as your backdrop.',
    event_date: '2026-04-07T08:00:00', location: 'Aldea Zamá, Tulum', location_detail: 'Palapa Studio',
    organizer_name: 'Ahau Tulum', organizer_whatsapp: '+529841112233', promo_text: 'All levels welcome', discount_tag: null, is_free: false, price_text: '$450 MXN',
  },
  {
    id: 'm4', title: 'Reiki & Energy Healing', category: 'beach',
    image_url: '/images/events/gallery_night.png',
    description: 'Private and group reiki sessions in an open-air jungle setting. Release blockages, restore balance, and leave feeling renewed.',
    event_date: '2026-04-08T10:00:00', location: 'Holistika, Tulum', location_detail: 'Healing Hut',
    organizer_name: 'Tulum Wellness', organizer_whatsapp: '+529841119900', promo_text: 'Private & group sessions', discount_tag: null, is_free: false, price_text: '$550 MXN',
  },
  {
    id: 'm5', title: "Chef's Table: Tulum Kitchen", category: 'food',
    image_url: '/images/events/food_market.png',
    description: 'Intimate cooking experience with a local chef. Fresh ceviche, avocado dishes, and regional flavors made from scratch in a rustic kitchen.',
    event_date: '2026-04-09T13:00:00', location: 'La Veleta, Tulum', location_detail: 'Rustic Kitchen',
    organizer_name: 'Tulum Sabor', organizer_whatsapp: '+529841557788', promo_text: 'Max 8 guests', discount_tag: 'EXCLUSIVE', is_free: false, price_text: '$650 MXN',
  },
  {
    id: 'm6', title: 'Seafood & Bubbles Promo', category: 'promo',
    image_url: '/images/events/sunset_session.png',
    description: 'Celebrate with fresh calamari, oysters, and champagne by the sea. Special prix-fixe menu every evening until midnight.',
    event_date: '2026-04-10T20:00:00', location: 'Zona Hotelera, Tulum', location_detail: 'El Arco Bar',
    organizer_name: 'El Arco', organizer_whatsapp: '+529845556644', promo_text: 'Prix-fixe menu', discount_tag: '20% OFF', is_free: false, price_text: 'From $350 MXN',
  },
  {
    id: 'm7', title: 'Mexican Cooking Class', category: 'food',
    image_url: '/images/events/food_market.png',
    description: 'Learn authentic Mexican recipes with a local abuela. Tamales, handmade salsas, and traditional techniques passed down for generations.',
    event_date: '2026-04-11T10:00:00', location: 'Holistika, Tulum', location_detail: 'Open-air kitchen',
    organizer_name: 'Viva Tulum', organizer_whatsapp: '+529849998877', promo_text: 'Hands-on experience', discount_tag: null, is_free: false, price_text: '$500 MXN',
  },
  {
    id: 'm8', title: 'Kids Storytime & Play', category: 'beach',
    image_url: '/images/filters/workers.png',
    description: 'A fun morning of interactive storytelling and guided play for toddlers and young children. Bilingual, creative, and full of laughter.',
    event_date: '2026-04-12T09:00:00', location: 'La Veleta, Tulum', location_detail: 'Family Space',
    organizer_name: 'Tulum Families', organizer_whatsapp: '+529843334455', promo_text: 'Kids 1–6 years', discount_tag: 'FREE ENTRY', is_free: true, price_text: null,
  },
  {
    id: 'm9', title: 'Vespa Tour: Hidden Tulum', category: 'jungle',
    image_url: '/images/filters/scooter.png',
    description: 'Rent a classic red Vespa and explore Tulum\'s hidden corners with a local guide. Cenotes, jungle roads, and secret spots.',
    event_date: '2026-04-13T09:00:00', location: 'Centro, Tulum', location_detail: 'Scooter Shop',
    organizer_name: 'Tulum Rides', organizer_whatsapp: '+529847771234', promo_text: 'All experience levels', discount_tag: null, is_free: false, price_text: '$400 MXN',
  },
  {
    id: 'm10', title: 'Sunrise Beach Walk', category: 'beach',
    image_url: '/images/events/sunset_session.png',
    description: 'Guided sunrise walk along pristine Caribbean shores. Warm sand, gentle breeze, and golden light — the best way to start your day.',
    event_date: '2026-04-14T06:00:00', location: 'Playa Paraíso, Tulum', location_detail: 'South Beach',
    organizer_name: 'Tulum Dive', organizer_whatsapp: '+529843332211', promo_text: 'Small group', discount_tag: 'EXCLUSIVE', is_free: false, price_text: '$200 MXN',
  },
  {
    id: 'm11', title: 'Jungle Bike Tour', category: 'jungle',
    image_url: '/images/filters/bicycle.png',
    description: 'Explore Tulum on a classic beach cruiser through jungle paths, cenote roads, and sandy trails. Bikes provided, all levels welcome.',
    event_date: '2026-04-15T08:00:00', location: 'Tulum Pueblo', location_detail: 'Jungle trails',
    organizer_name: 'Tulum Rides', organizer_whatsapp: '+529847771234', promo_text: 'Bikes included', discount_tag: null, is_free: false, price_text: '$250 MXN',
  },
  {
    id: 'm12', title: 'Sunset DJ Set: Beach Club', category: 'music',
    image_url: '/images/events/sunset_session.png',
    description: 'Two world-class DJs behind the decks at sunset. Afro house, melodic techno, and tropical beats with the Caribbean as your backdrop.',
    event_date: '2026-04-15T17:00:00', location: 'Zona Hotelera, Tulum', location_detail: 'Beach Club Stage',
    organizer_name: 'Papaya Playa', organizer_whatsapp: '+529848887766', promo_text: 'Open air', discount_tag: 'SUNSET SET', is_free: false, price_text: '$600 MXN',
  },
  {
    id: 'm13', title: 'Group Dog Walk', category: 'jungle',
    image_url: '/images/promo/promo_1.png',
    description: 'Morning pack walk through shaded jungle streets with your furry friend. Meet other pet owners and let the dogs run free together.',
    event_date: '2026-04-16T07:30:00', location: 'La Veleta, Tulum', location_detail: 'Tree-lined streets',
    organizer_name: 'Tulum Pets', organizer_whatsapp: '+529843339988', promo_text: 'All dogs welcome', discount_tag: 'FREE ENTRY', is_free: true, price_text: null,
  },
  {
    id: 'm14', title: 'Jungle Architecture Walk', category: 'jungle',
    image_url: '/images/filters/property.png',
    description: 'Guided tour of Tulum\'s most iconic brutalist and organic architecture hidden deep in the jungle. Art, design, and nature converge.',
    event_date: '2026-04-16T16:00:00', location: 'Aldea Zamá, Tulum', location_detail: 'Jungle district',
    organizer_name: 'Tulum Design', organizer_whatsapp: '+529841234000', promo_text: 'Small group tour', discount_tag: null, is_free: false, price_text: '$300 MXN',
  },
  {
    id: 'm15', title: 'Bike Rental Promo', category: 'promo',
    image_url: '/images/filters/bicycle.png',
    description: 'Rent a colorful beach cruiser and explore Tulum at your own pace. Daily and weekly rates available. Helmets and baskets included.',
    event_date: '2026-04-17T09:00:00', location: 'Centro, Tulum', location_detail: 'Main strip',
    organizer_name: 'Tulum Cruisers', organizer_whatsapp: '+529849990011', promo_text: 'Daily & weekly rates', discount_tag: '20% OFF', is_free: false, price_text: 'From $150 MXN',
  },
  {
    id: 'm16', title: 'Jungle Villa Open House', category: 'jungle',
    image_url: '/images/filters/property.png',
    description: 'Exclusive open house tour of a stunning jungle villa. Brutalist architecture, cascading plants, private pool, and golden-hour lighting.',
    event_date: '2026-04-18T17:00:00', location: 'Aldea Zamá, Tulum', location_detail: 'Private Villa',
    organizer_name: 'Tulum Estates', organizer_whatsapp: '+529841230000', promo_text: 'By appointment', discount_tag: 'OPEN HOUSE', is_free: true, price_text: null,
  },
  {
    id: 'm17', title: 'Luxury Villa Weekend Promo', category: 'promo',
    image_url: '/images/filters/property.png',
    description: 'Unwind in a private jungle villa with a plunge pool, terrace, and lush garden views. Special weekly rates for Swipess members.',
    event_date: '2026-04-19T12:00:00', location: 'Aldea Zamá, Tulum', location_detail: 'Jungle Villa',
    organizer_name: 'Tulum Stays', organizer_whatsapp: '+529847770099', promo_text: 'Members-only rate', discount_tag: '15% OFF', is_free: false, price_text: 'From $2,800 MXN/night',
  },
];


