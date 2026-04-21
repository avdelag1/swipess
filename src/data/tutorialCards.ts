/**
 * TUTORIAL SWIPE CARDS DATA
 *
 * 18 listing cards (3 properties, 3 workers, 3 motorcycles, 3 bicycles)
 * for the CLIENT SIDE swipe experience.
 *
 * 6 client profiles (3 men, 3 women) for the OWNER SIDE swipe experience.
 *
 * Each card includes 6 insights — real things a new user should notice
 * before swiping left or right. Used as onboarding tutorial cards.
 */

const UNS = 'https://images.unsplash.com';

export type TutorialCategory = 'property' | 'worker' | 'motorcycle' | 'bicycle';
export type ClientGender = 'male' | 'female';

export interface TutorialInsight {
  question: string;  // The insight question/label
  answer: string;    // The value / answer
  icon: string;      // Emoji icon for visual context
  highlight?: boolean; // Whether to highlight this insight (important)
}

export interface TutorialListing {
  id: string;
  category: TutorialCategory;
  title: string;
  subtitle: string;
  price: number;
  priceUnit: string;      // '/mo', '/hr', 'sale', etc.
  city: string;
  country: string;
  images: string[];
  description: string;
  tags: string[];
  ownerName: string;
  ownerAvatar: string;
  ownerRating: number;
  ownerVerified: boolean;
  insights: TutorialInsight[];  // Exactly 6 insights
  video_url?: string;
}

export interface TutorialClientProfile {
  id: string;
  gender: ClientGender;
  name: string;
  age: number;
  city: string;
  country: string;
  bio: string;
  profile_images: string[];
  interests: string[];
  verified: boolean;
  budget_min: number;
  budget_max: number;
  insights: TutorialInsight[];  // Exactly 6 insights
}

// ─────────────────────────────────────────────────────────────
//  PROPERTY LISTINGS  (3)
// ─────────────────────────────────────────────────────────────
const propertyListings: TutorialListing[] = [
  {
    id: 'tut_prop_001',
    category: 'property',
    title: 'Penthouse en Tulum Centro',
    subtitle: '3 Beds · 2 Baths · Rooftop Terrace',
    price: 28000,
    priceUnit: '/mo',
    city: 'Tulum',
    country: 'Mexico',
    images: [
      'marketing:property:slide1',
      'marketing:property:slide2',
      'marketing:property:slide3',
    ],
    video_url: 'https://cdn.pixabay.com/video/2018/06/07/16641-274191081_large.mp4',
    description:
      'Stunning penthouse in the heart of Tulum with panoramic jungle views. Fully furnished with high-end finishes, private rooftop terrace, plunge pool and concierge service. Walking distance to cenotes and the famous Tulum strip.',
    tags: ['Furnished', 'Rooftop Pool', 'Pet-Friendly', 'Concierge', 'Long-Term'],
    ownerName: 'Sofía Méndez',
    ownerAvatar: `${UNS}/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.9,
    ownerVerified: true,
    insights: [
      {
        question: 'Price per square meter',
        answer: '$420 MXN / m² — below market average for this zone',
        icon: '📐',
        highlight: true,
      },
      {
        question: 'Pet policy',
        answer: 'Pets welcome (up to 2 dogs or cats, no extra deposit)',
        icon: '🐾',
      },
      {
        question: 'Availability',
        answer: 'Available from March 1 — flexible move-in date',
        icon: '📅',
        highlight: true,
      },
      {
        question: 'Amenities rating',
        answer: '9.2 / 10 — rooftop pool, gym, 24h security, parking',
        icon: '⭐',
      },
      {
        question: 'Owner response history',
        answer: 'Responds within 1 hour · 127 happy renters',
        icon: '⚡',
      },
      {
        question: 'Contract flexibility',
        answer: 'Min 3 months · can negotiate 6–12 month discount',
        icon: '📄',
      },
    ],
  },
  {
    id: 'tut_prop_002',
    category: 'property',
    title: 'Studio Frente al Mar — PDC',
    subtitle: '1 Bed · 1 Bath · Oceanfront',
    price: 14500,
    priceUnit: '/mo',
    city: 'Playa del Carmen',
    country: 'Mexico',
    images: [
      'marketing:property:slide1',
      'marketing:property:slide2',
      'marketing:property:slide3',
    ],
    description:
      'Cozy beachfront studio with direct ocean access. Includes high-speed WiFi, air conditioning, fully equipped kitchen and a private balcony with hammock. Perfect for digital nomads or couples.',
    tags: ['Beachfront', 'WiFi 200Mbps', 'A/C', 'Balcony', 'Digital Nomad'],
    ownerName: 'Rodrigo Fuentes',
    ownerAvatar: `${UNS}/photo-1566492031773-4f4e44671857?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.7,
    ownerVerified: true,
    insights: [
      {
        question: 'Lease flexibility',
        answer: 'Month-to-month available · no long-term commitment needed',
        icon: '🗓️',
        highlight: true,
      },
      {
        question: 'Utilities included',
        answer: 'Water & internet included · electricity capped at $800/mo',
        icon: '💡',
      },
      {
        question: 'Noise level',
        answer: 'Quiet zone · beach side faces south (no street noise)',
        icon: '🔇',
        highlight: true,
      },
      {
        question: 'Natural light',
        answer: 'Full east-west light · sunrise & sunset from balcony',
        icon: '☀️',
      },
      {
        question: 'Storage space',
        answer: 'Compact (studio) — 2 closets, under-bed storage available',
        icon: '🗄️',
      },
      {
        question: 'Neighborhood safety',
        answer: 'Gated complex · 24h guard · rated 8.8/10 by previous renters',
        icon: '🛡️',
      },
    ],
  },
  {
    id: 'tut_prop_003',
    category: 'property',
    title: 'Casa Colonial · 3 Recámaras',
    subtitle: '3 Beds · 2 Baths · Private Garden',
    price: 18000,
    priceUnit: '/mo',
    city: 'Mérida',
    country: 'Mexico',
    images: [
      'marketing:property:slide1',
      'marketing:property:slide2',
      'marketing:property:slide3',
    ],
    description:
      'Authentic 1930s colonial house fully restored with modern comforts. Thick stone walls keep it naturally cool. Private courtyard garden with fountain. 10 minutes walk from the main plaza and top restaurants.',
    tags: ['Colonial', 'Garden', 'Historic District', 'Parking', 'Family-Friendly'],
    ownerName: 'Carmen Villanueva',
    ownerAvatar: `${UNS}/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.8,
    ownerVerified: true,
    insights: [
      {
        question: 'Maintenance history',
        answer: 'Full renovation in 2022 · new plumbing, A/C and electrical',
        icon: '🔧',
        highlight: true,
      },
      {
        question: 'HOA / extra fees',
        answer: 'No HOA · gardener included in rent price',
        icon: '💰',
      },
      {
        question: 'Parking',
        answer: '2 covered parking spaces inside the property',
        icon: '🚗',
        highlight: true,
      },
      {
        question: 'Public transport access',
        answer: 'Bus stop 200m · taxi zone 50m · easy Uber access',
        icon: '🚌',
      },
      {
        question: 'Nearby amenities',
        answer: 'Supermarket, pharmacy, gym all within 5-min walk',
        icon: '🏪',
      },
      {
        question: 'Renovation allowed',
        answer: 'Minor changes OK with approval · owner open to discussion',
        icon: '🏗️',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  WORKER / SERVICE LISTINGS  (3)
// ─────────────────────────────────────────────────────────────
const workerListings: TutorialListing[] = [
  {
    id: 'tut_work_001',
    category: 'worker',
    title: 'Electricista Certificado CFE',
    subtitle: 'Residential & Commercial · 12 yrs exp',
    price: 450,
    priceUnit: '/hr',
    city: 'Cancún',
    country: 'Mexico',
    images: [
      'marketing:worker:slide1',
      'marketing:worker:slide2',
      'marketing:worker:slide3',
    ],
    description:
      'CFE-certified electrician specializing in residential and commercial installations. Fault diagnosis, panel upgrades, solar pre-wiring, EV charger installation, and emergency callouts. Fully insured with 3-month work guarantee.',
    tags: ['CFE Certified', 'Emergency Callouts', 'Solar', 'EV Charger', 'Insured'],
    ownerName: 'Javier Torres',
    ownerAvatar: `${UNS}/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.9,
    ownerVerified: true,
    insights: [
      {
        question: 'Response time',
        answer: 'Emergency: under 2 hours · Scheduled: next-day available',
        icon: '⚡',
        highlight: true,
      },
      {
        question: 'Insurance coverage',
        answer: 'Fully insured up to $500,000 MXN · covers all damage',
        icon: '🛡️',
      },
      {
        question: 'Warranty on work',
        answer: '3-month full warranty on all installations and repairs',
        icon: '✅',
        highlight: true,
      },
      {
        question: 'Rate flexibility',
        answer: 'Fixed quote available for large jobs · no hidden charges',
        icon: '💲',
      },
      {
        question: 'Languages',
        answer: 'Spanish (native) · English (intermediate) · communicates clearly',
        icon: '🗣️',
      },
      {
        question: 'Availability',
        answer: 'Mon–Sat 7am–7pm · Sunday emergency only',
        icon: '📅',
      },
    ],
  },
  {
    id: 'tut_work_002',
    category: 'worker',
    title: 'Chef Privado & Catering',
    subtitle: 'Mexican · Mediterranean · Fusion',
    price: 1200,
    priceUnit: '/hr',
    city: 'Tulum',
    country: 'Mexico',
    images: [
      'marketing:worker:slide1',
      'marketing:worker:slide2',
      'marketing:worker:slide3',
    ],
    description:
      'Private chef with 8 years in top Tulum restaurants. Specializes in Mexican fusion, raw vegan, and Mediterranean cuisine. Available for intimate dinners, villa events, weekly meal prep, and private cooking classes.',
    tags: ['Private Dinners', 'Vegan Menu', 'Meal Prep', 'Cooking Classes', 'Events'],
    ownerName: 'Daniela Reyes',
    ownerAvatar: `${UNS}/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 5.0,
    ownerVerified: true,
    insights: [
      {
        question: 'Cuisine styles',
        answer: 'Mexican fusion, raw vegan, Mediterranean, Japanese — flexible',
        icon: '🍽️',
        highlight: true,
      },
      {
        question: 'Equipment needs',
        answer: 'Brings own knives & spices · uses your kitchen appliances',
        icon: '🔪',
      },
      {
        question: 'Menu flexibility',
        answer: 'Custom menus designed 48h in advance · allergy-sensitive',
        icon: '📋',
        highlight: true,
      },
      {
        question: 'Event capacity',
        answer: 'Intimate dinners (2–8 guests) · parties up to 30 with assistant',
        icon: '👥',
      },
      {
        question: 'References',
        answer: '50+ 5-star reviews · worked with celebrities & executives',
        icon: '⭐',
      },
      {
        question: 'Health certifications',
        answer: 'COFEPRIS certified · food handler card renewed annually',
        icon: '🏥',
      },
    ],
  },
  {
    id: 'tut_work_003',
    category: 'worker',
    title: 'Personal Trainer Certificado',
    subtitle: 'Strength · HIIT · Outdoor Fitness',
    price: 650,
    priceUnit: '/hr',
    city: 'Playa del Carmen',
    country: 'Mexico',
    images: [
      'marketing:worker:slide1',
      'marketing:worker:slide2',
      'marketing:worker:slide3',
    ],
    description:
      'NASM-certified personal trainer specializing in strength training, HIIT, and outdoor beach workouts. Offers personalized nutrition plans and can train at your home, beach, or a local gym. Online sessions available.',
    tags: ['NASM Certified', 'Nutrition Plans', 'Home Training', 'Beach Workouts', 'Online'],
    ownerName: 'Miguel Ángel Ruiz',
    ownerAvatar: `${UNS}/photo-1568602471122-7832951cc4c5?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.8,
    ownerVerified: true,
    insights: [
      {
        question: 'Training methodology',
        answer: 'Science-based periodization · progressive overload · tracked weekly',
        icon: '💪',
        highlight: true,
      },
      {
        question: 'Nutrition coaching',
        answer: 'Custom macro plans included in packages of 8+ sessions',
        icon: '🥗',
      },
      {
        question: 'Schedule flexibility',
        answer: 'Sessions 6am–8pm · reschedule with 12h notice · no penalty',
        icon: '🕐',
        highlight: true,
      },
      {
        question: 'Equipment provided',
        answer: 'Brings resistance bands, TRX & kettlebells for home training',
        icon: '🏋️',
      },
      {
        question: 'Online sessions',
        answer: 'Zoom sessions $350/hr · same quality · custom video programs',
        icon: '💻',
      },
      {
        question: 'Injury experience',
        answer: 'Sports rehab background · safe for knee, back & shoulder issues',
        icon: '🩺',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  MOTORCYCLE LISTINGS  (3)
// ─────────────────────────────────────────────────────────────
const motorcycleListings: TutorialListing[] = [
  {
    id: 'tut_moto_001',
    category: 'motorcycle',
    title: 'Yamaha MT-07 2022 — Naked Sport',
    subtitle: '689cc · 74hp · 5,200 km',
    price: 105000,
    priceUnit: 'sale',
    city: 'Cancún',
    country: 'Mexico',
    images: [
      'marketing:moto:slide1',
      'marketing:moto:slide2',
      'marketing:moto:slide3',
    ],
    description:
      'One owner, garage kept. The MT-07 is one of the most thrilling and accessible naked bikes on the market. Low mileage, recent service. Includes original toolkit, keys, and manual. SOAT and tenencia up to date.',
    tags: ['One Owner', 'Low Km', 'Recent Service', 'SOAT OK', 'Garage Kept'],
    ownerName: 'Carlos Herrera',
    ownerAvatar: `${UNS}/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.7,
    ownerVerified: true,
    insights: [
      {
        question: 'Service history',
        answer: 'Full Yamaha dealer service at 3k & 5k km · receipts included',
        icon: '🔧',
        highlight: true,
      },
      {
        question: 'Insurance status',
        answer: 'SOAT valid until Dec 2025 · full coverage easy to transfer',
        icon: '🛡️',
      },
      {
        question: 'Accident history',
        answer: 'Zero accidents · no repairs · frame perfectly straight',
        icon: '✅',
        highlight: true,
      },
      {
        question: 'Modifications',
        answer: 'Yoshimura slip-on exhaust · bar-end mirrors · frame sliders',
        icon: '🔩',
      },
      {
        question: 'Test ride policy',
        answer: 'Test ride welcome with valid license & passport deposit',
        icon: '🏍️',
      },
      {
        question: 'Price negotiation',
        answer: 'Firm at $105,000 — recent dealer quote was $118,000',
        icon: '💬',
      },
    ],
  },
  {
    id: 'tut_moto_002',
    category: 'motorcycle',
    title: 'Kawasaki Z400 2023 — Entry Naked',
    subtitle: '399cc · 45hp · 1,800 km',
    price: 72000,
    priceUnit: 'sale',
    city: 'Playa del Carmen',
    country: 'Mexico',
    images: [
      'marketing:moto:slide1',
      'marketing:moto:slide2',
      'marketing:moto:slide3',
    ],
    description:
      'Nearly new 2023 Kawasaki Z400 — perfect beginner to intermediate bike. Sharp styling, light chassis, and punchy 400cc twin. Ideal for city commuting and weekend fun. Selling due to upgrade.',
    tags: ['Beginner Friendly', 'Nearly New', 'City Commuter', 'Selling to Upgrade'],
    ownerName: 'Andrés López',
    ownerAvatar: `${UNS}/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.6,
    ownerVerified: false,
    insights: [
      {
        question: 'License requirement',
        answer: 'Standard A license required · no special endorsement needed',
        icon: '📋',
        highlight: true,
      },
      {
        question: 'Current registration',
        answer: 'Plates & tenencia paid through 2026 · transfer included',
        icon: '📄',
      },
      {
        question: 'Fuel economy',
        answer: '25–30 km/L city · ~350 km range per tank · very cheap to run',
        icon: '⛽',
        highlight: true,
      },
      {
        question: 'Parts availability',
        answer: 'Kawasaki dealer in Cancún · parts in stock · easy to maintain',
        icon: '🔩',
      },
      {
        question: 'Resale value',
        answer: 'Z400 holds value well · 2022 models still sell at $65k+',
        icon: '📈',
      },
      {
        question: 'Delivery option',
        answer: 'Can deliver within Riviera Maya for $500 flat fee',
        icon: '🚚',
      },
    ],
  },
  {
    id: 'tut_moto_003',
    category: 'motorcycle',
    title: 'Royal Enfield Meteor 350 — 2023',
    subtitle: '349cc · Classic Cruiser · 3,400 km',
    price: 58000,
    priceUnit: 'sale',
    city: 'Mérida',
    country: 'Mexico',
    images: [
      'marketing:moto:slide1',
      'marketing:moto:slide2',
      'marketing:moto:slide3',
    ],
    description:
      'Royal Enfield Meteor 350 in Supernova Bronze — the most comfortable 350cc cruiser you can ride. Upright posture, smooth torque, and classic styling. Great for long hauls on the Yucatan peninsula. Like new.',
    tags: ['Cruiser', 'Comfortable', 'Long Distance', 'Classic Style', 'Like New'],
    ownerName: 'Fernando Castro',
    ownerAvatar: `${UNS}/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.8,
    ownerVerified: true,
    insights: [
      {
        question: 'Riding comfort',
        answer: 'Upright ergonomics · low seat 765mm · ideal for all heights',
        icon: '🛋️',
        highlight: true,
      },
      {
        question: 'Maintenance cost',
        answer: 'Service every 5,000 km · approx $800 MXN at RE dealer',
        icon: '💰',
      },
      {
        question: 'Road suitability',
        answer: 'Smooth highways & city streets · not for off-road use',
        icon: '🛣️',
        highlight: true,
      },
      {
        question: 'Customization options',
        answer: 'RE accessories catalogue + aftermarket seats, racks, screens',
        icon: '🎨',
      },
      {
        question: 'Community & clubs',
        answer: 'Active RE Owners Club Mérida — monthly rides and meetups',
        icon: '👥',
      },
      {
        question: 'Financing',
        answer: 'Open to 50% down + 6 monthly payments with signed agreement',
        icon: '💳',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  BICYCLE LISTINGS  (3)
// ─────────────────────────────────────────────────────────────
const bicycleListings: TutorialListing[] = [
  {
    id: 'tut_bici_001',
    category: 'bicycle',
    title: 'Trek FX 3 Disc 2023 — Urban Fitness',
    subtitle: 'Hybrid · Hydraulic Disc · Size M',
    price: 14500,
    priceUnit: 'sale',
    city: 'Cancún',
    country: 'Mexico',
    images: [
      'marketing:bicycle:slide1',
      'marketing:bicycle:slide2',
      'marketing:bicycle:slide3',
    ],
    description:
      'Trek FX 3 Disc in matte black — the perfect city speedster. Hydraulic disc brakes, Shimano Deore groupset, and Bontrager tires. Includes rear rack, fenders and Bontrager Ion light set. Barely used, showroom condition.',
    tags: ['Hydraulic Disc', 'Shimano Deore', 'Rear Rack', 'Fenders', 'Lights Included'],
    ownerName: 'Lucía Arroyo',
    ownerAvatar: `${UNS}/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.9,
    ownerVerified: true,
    insights: [
      {
        question: 'Component grade',
        answer: 'Shimano Deore 10-speed — mid-range and highly reliable',
        icon: '⚙️',
        highlight: true,
      },
      {
        question: 'Fit & sizing',
        answer: 'Size M fits 170–185cm riders · standover height 77cm',
        icon: '📏',
      },
      {
        question: 'Warranty remaining',
        answer: 'Trek lifetime frame warranty · drivetrain warranty until 2025',
        icon: '✅',
        highlight: true,
      },
      {
        question: 'Upgrade path',
        answer: 'Fork mounts for pannier racks · easy to add dropper post',
        icon: '🔼',
      },
      {
        question: 'Urban vs trail use',
        answer: 'Urban-focused · handles light gravel but not singletrack',
        icon: '🏙️',
      },
      {
        question: 'Lock included',
        answer: 'Kryptonite Evolution Mini U-lock included ($800 MXN value)',
        icon: '🔒',
      },
    ],
  },
  {
    id: 'tut_bici_002',
    category: 'bicycle',
    title: 'Cannondale Synapse Carbon — 2022',
    subtitle: 'Road Bike · Carbon Frame · Size 54',
    price: 38000,
    priceUnit: 'sale',
    city: 'Guadalajara',
    country: 'Mexico',
    images: [
      'marketing:bicycle:slide1',
      'marketing:bicycle:slide2',
      'marketing:bicycle:slide3',
    ],
    description:
      'Cannondale Synapse Carbon with Shimano 105 Di2 electronic shifting. Endurance geometry for long rides with compliance. Light and fast — 8.2 kg complete. Carbon wheels upgraded. Perfect for gran fondos and century rides.',
    tags: ['Carbon Frame', 'Shimano 105 Di2', 'Carbon Wheels', 'Endurance Geo', 'Electronic Shifting'],
    ownerName: 'Pablo Guzmán',
    ownerAvatar: `${UNS}/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.7,
    ownerVerified: true,
    insights: [
      {
        question: 'Carbon frame condition',
        answer: 'Zero cracks or delamination · professional inspection done',
        icon: '🔍',
        highlight: true,
      },
      {
        question: 'Groupset level',
        answer: 'Shimano 105 Di2 electronic — top endurance tier for price',
        icon: '⚙️',
      },
      {
        question: 'Saddle & pedals',
        answer: 'Fizik Arione saddle included · pedals NOT included (your choice)',
        icon: '🚴',
        highlight: true,
      },
      {
        question: 'Race readiness',
        answer: 'Gran fondo ready · UCI legal · just add pedals and ride',
        icon: '🏁',
      },
      {
        question: 'Service record',
        answer: 'Annual service at Cannondale dealer · cables replaced 2024',
        icon: '📋',
      },
      {
        question: 'Total weight',
        answer: '8.2 kg as listed · well under UCI 6.8 kg racing limit (legal)',
        icon: '⚖️',
      },
    ],
  },
  {
    id: 'tut_bici_003',
    category: 'bicycle',
    title: 'Giant Escape E+ 1 — 2023 Electric',
    subtitle: 'E-Bike · 80 km Range · Size L',
    price: 42000,
    priceUnit: 'sale',
    city: 'Ciudad de México',
    country: 'Mexico',
    images: [
      'marketing:bicycle:slide1',
      'marketing:bicycle:slide2',
      'marketing:bicycle:slide3',
    ],
    description:
      'Giant Escape E+ 1 — the perfect electric commuter. SyncDrive Sport motor with 80km real-world range, Shimano hydraulic disc brakes, and integrated lights. Arrives fully charged. Barely 600 km on the odometer.',
    tags: ['SyncDrive Motor', '80km Range', 'Hydraulic Disc', 'Integrated Lights', 'App Connected'],
    ownerName: 'Valentina Ríos',
    ownerAvatar: `${UNS}/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop&crop=face`,
    ownerRating: 4.8,
    ownerVerified: true,
    insights: [
      {
        question: 'Real-world range',
        answer: '80 km on ECO mode · 45 km on SPORT mode (tested on CDMX roads)',
        icon: '🔋',
        highlight: true,
      },
      {
        question: 'Charge time',
        answer: 'Full charge in 4.5 hours · standard 110v outlet works',
        icon: '⚡',
      },
      {
        question: 'Motor type',
        answer: 'Giant SyncDrive Sport (Yamaha tech) · smooth mid-drive assist',
        icon: '🔌',
        highlight: true,
      },
      {
        question: 'App connectivity',
        answer: 'Giant RideControl EVO app — displays range, speed, and modes',
        icon: '📱',
      },
      {
        question: 'Service center',
        answer: 'Giant authorized dealer in CDMX · 2-year battery warranty',
        icon: '🏪',
      },
      {
        question: 'Total weight',
        answer: '21.5 kg — heavier than acoustic but manageable for stairs',
        icon: '⚖️',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  MALE CLIENT PROFILES  (3) — Owner Side
// ─────────────────────────────────────────────────────────────
const maleClients: TutorialClientProfile[] = [
  {
    id: 'tut_client_m001',
    gender: 'male',
    name: 'Marco Delgado',
    age: 29,
    city: 'Tulum',
    country: 'Mexico',
    bio: 'Remote software engineer from Mexico City, relocating to Tulum for a year. I work from home, keep a clean space, and love the ocean. Looking for a furnished place with strong WiFi. No pets, no parties.',
    profile_images: [
      'marketing:client:slide1',
      'marketing:client:slide2',
      'marketing:client:slide3',
    ],
    interests: ['Remote Work', 'Surfing', 'Photography', 'Coffee', 'Cycling'],
    verified: true,
    budget_min: 12000,
    budget_max: 20000,
    insights: [
      {
        question: 'Budget range',
        answer: '$12,000 – $20,000 MXN/mo · flexible for the right place',
        icon: '💰',
        highlight: true,
      },
      {
        question: 'Move-in timeline',
        answer: 'Ready in 2 weeks · prefers March 1st start date',
        icon: '📅',
        highlight: true,
      },
      {
        question: 'Employment type',
        answer: 'Full-time remote engineer · stable USD salary · verified',
        icon: '💼',
      },
      {
        question: 'Pets & smoking',
        answer: 'No pets · non-smoker · quiet lifestyle',
        icon: '🚭',
      },
      {
        question: 'Co-tenants',
        answer: 'Living solo · occasionally partner visits (1 person extra max)',
        icon: '🏠',
      },
      {
        question: 'Special requirements',
        answer: 'WiFi 100Mbps minimum · dedicated desk space · blackout curtains',
        icon: '💻',
      },
    ],
  },
  {
    id: 'tut_client_m002',
    gender: 'male',
    name: 'Alejandro Vargas',
    age: 35,
    city: 'Cancún',
    country: 'Mexico',
    bio: 'Entrepreneur and weekend rider. Looking for a sport or naked bike to ride on weekends and some commuting. I have an A license and 6 years riding experience. Prefer something between 400cc and 700cc.',
    profile_images: [
      'marketing:client:slide1',
      'marketing:client:slide2',
      'marketing:client:slide3',
    ],
    interests: ['Motorcycles', 'Entrepreneurship', 'Travel', 'MotoGP', 'Gym'],
    verified: true,
    budget_min: 60000,
    budget_max: 120000,
    insights: [
      {
        question: 'Riding experience',
        answer: '6 years · previously owned Honda CB500F and Kawasaki Z650',
        icon: '🏍️',
        highlight: true,
      },
      {
        question: 'Budget flexibility',
        answer: 'Up to $120,000 MXN · can pay cash immediately',
        icon: '💰',
        highlight: true,
      },
      {
        question: 'Preferred brand',
        answer: 'Open to Yamaha, Kawasaki, Honda · not Royal Enfield',
        icon: '🏷️',
      },
      {
        question: 'Usage frequency',
        answer: 'Weekends + 2–3 commutes per week · approx 300 km/month',
        icon: '📍',
      },
      {
        question: 'License type',
        answer: 'Class A motorcycle license · valid and current',
        icon: '📄',
      },
      {
        question: 'Financing',
        answer: 'Prefers full cash payment · not interested in installments',
        icon: '💳',
      },
    ],
  },
  {
    id: 'tut_client_m003',
    gender: 'male',
    name: 'Daniel Morales',
    age: 42,
    city: 'Mérida',
    country: 'Mexico',
    bio: 'Corporate executive relocating from Monterrey with my family. Looking for a high-quality 3–4 bedroom house or apartment. We have two kids and a golden retriever. Need 2 parking spaces and proximity to top schools.',
    profile_images: [
      'marketing:client:slide1',
      'marketing:client:slide2',
      'marketing:client:slide3',
    ],
    interests: ['Family Life', 'Golf', 'Real Estate', 'Travel', 'Fine Dining'],
    verified: true,
    budget_min: 25000,
    budget_max: 45000,
    insights: [
      {
        question: 'Lease preference',
        answer: '12-month minimum · open to 24-month for lower monthly rate',
        icon: '📄',
        highlight: true,
      },
      {
        question: 'Corporate billing',
        answer: 'Company can issue invoice (factura) · company pays rent',
        icon: '🏢',
      },
      {
        question: 'Parking needs',
        answer: '2 covered parking spots required · essential requirement',
        icon: '🚗',
        highlight: true,
      },
      {
        question: 'Hosting frequency',
        answer: 'Business guests 1–2x/month · small family gatherings only',
        icon: '🤝',
      },
      {
        question: 'Pet ownership',
        answer: '1 golden retriever (calm, trained) · willing to pay pet deposit',
        icon: '🐕',
      },
      {
        question: 'Credit & reliability',
        answer: 'Excellent credit · 3 landlord references · zero complaints history',
        icon: '✅',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  FEMALE CLIENT PROFILES  (3) — Owner Side
// ─────────────────────────────────────────────────────────────
const femaleClients: TutorialClientProfile[] = [
  {
    id: 'tut_client_f001',
    gender: 'female',
    name: 'Sofía Peña',
    age: 26,
    city: 'Tulum',
    country: 'Mexico',
    bio: 'Digital nomad and content creator based in Tulum. I travel often but this is my home base. I need a beautiful, well-lit furnished studio or 1-bedroom with fast internet. Very tidy, quiet, and responsible.',
    profile_images: [
      'marketing:client:slide1',
      'marketing:client:slide2',
      'marketing:client:slide3',
    ],
    interests: ['Content Creation', 'Yoga', 'Travel', 'Sustainability', 'Art'],
    verified: true,
    budget_min: 10000,
    budget_max: 18000,
    insights: [
      {
        question: 'Work-from-home needs',
        answer: 'Needs quiet space for video calls · natural lighting essential',
        icon: '💻',
        highlight: true,
      },
      {
        question: 'WiFi requirements',
        answer: 'Minimum 100 Mbps · fiber preferred · deal-breaker if slow',
        icon: '📶',
        highlight: true,
      },
      {
        question: 'Lease flexibility',
        answer: 'Prefers 3-month rolling lease · travels 1 week/month',
        icon: '✈️',
      },
      {
        question: 'Budget',
        answer: '$10,000–$18,000 MXN · utilities not included preferred',
        icon: '💰',
      },
      {
        question: 'Pet ownership',
        answer: 'No pets · no smoking · very clean and organized',
        icon: '✨',
      },
      {
        question: 'Social lifestyle',
        answer: 'Quiet home · occasional friend visits · no late-night gatherings',
        icon: '🧘',
      },
    ],
  },
  {
    id: 'tut_client_f002',
    gender: 'female',
    name: 'Isabella Ramos',
    age: 31,
    city: 'Playa del Carmen',
    country: 'Mexico',
    bio: 'Yoga instructor and cycling enthusiast. Looking for a quality bicycle to use daily for teaching commutes and weekend beach rides. I ride about 20–30 km daily. Eco-conscious and prefer sustainable brands.',
    profile_images: [
      'marketing:client:slide1',
      'marketing:client:slide2',
      'marketing:client:slide3',
    ],
    interests: ['Yoga', 'Cycling', 'Nutrition', 'Nature', 'Mindfulness'],
    verified: true,
    budget_min: 8000,
    budget_max: 20000,
    insights: [
      {
        question: 'Riding style',
        answer: 'Daily urban commuter + leisure beach rides · not racing',
        icon: '🚴',
        highlight: true,
      },
      {
        question: 'Distance needs',
        answer: '20–30 km daily · needs reliable, low-maintenance drivetrain',
        icon: '📏',
      },
      {
        question: 'Storage capacity',
        answer: 'Needs rear rack for yoga mat and bag · basket a plus',
        icon: '🎒',
        highlight: true,
      },
      {
        question: 'Electric preference',
        answer: 'Open to e-bike for hilly routes · not required if flat route',
        icon: '⚡',
      },
      {
        question: 'Budget',
        answer: '$8,000–$20,000 MXN · will pay more for quality & reliability',
        icon: '💰',
      },
      {
        question: 'Color & aesthetic',
        answer: 'Prefers muted tones: black, white, sage green · no neon',
        icon: '🎨',
      },
    ],
  },
  {
    id: 'tut_client_f003',
    gender: 'female',
    name: 'Valentina Cruz',
    age: 38,
    city: 'Cancún',
    country: 'Mexico',
    bio: 'Architect and studio owner looking for a rental property that doubles as home + client meeting space. Need a spacious, modern property with at least one area I can use as a studio/office. Design-forward aesthetic preferred.',
    profile_images: [
      'marketing:client:slide1',
      'marketing:client:slide2',
      'marketing:client:slide3',
    ],
    interests: ['Architecture', 'Interior Design', 'Art', 'Photography', 'Cooking'],
    verified: true,
    budget_min: 22000,
    budget_max: 40000,
    insights: [
      {
        question: 'Space requirements',
        answer: '3+ bedrooms · 1 room converted to studio · min 120 m²',
        icon: '📐',
        highlight: true,
      },
      {
        question: 'Client meetings',
        answer: '3–5 client meetings/week at home · professional setting needed',
        icon: '🤝',
        highlight: true,
      },
      {
        question: 'Parking',
        answer: '2 spaces: 1 personal + 1 for clients · covered preferred',
        icon: '🚗',
      },
      {
        question: 'Lease type',
        answer: 'Wants 12-month minimum · will sign mixed use lease agreement',
        icon: '📄',
      },
      {
        question: 'Renovation permission',
        answer: 'Needs to paint walls white + install shelving · fully reversible',
        icon: '🎨',
      },
      {
        question: 'Budget',
        answer: '$22,000–$40,000 MXN · pays on time · bank transfer preferred',
        icon: '💰',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

export const tutorialListings: Record<TutorialCategory, TutorialListing[]> = {
  property: propertyListings,
  worker: workerListings,
  motorcycle: motorcycleListings,
  bicycle: bicycleListings,
};

export const tutorialClientProfiles: Record<ClientGender, TutorialClientProfile[]> = {
  male: maleClients,
  female: femaleClients,
};

export const allTutorialListings: TutorialListing[] = [
  ...propertyListings,
  ...workerListings,
  ...motorcycleListings,
  ...bicycleListings,
];

export const allTutorialClients: TutorialClientProfile[] = [
  ...maleClients,
  ...femaleClients,
];


