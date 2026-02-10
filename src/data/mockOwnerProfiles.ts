/**
 * MOCK OWNER PROFILES DATA
 * 2 owners with photos and one post each for:
 * - Motorcycle listing
 * - Bicycle listing
 * - Worker listing (services)
 * - Job listing
 */

export interface MockOwnerProfile {
  user_id: string;
  name: string;
  age: number;
  city: string;
  country: string;
  bio: string;
  profile_images: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  responseTime: string;
  listings: MockListing[];
}

export interface MockListing {
  id: string;
  type: 'motorcycle' | 'bicycle' | 'worker' | 'job';
  title: string;
  description: string;
  price: number;
  priceType: 'month' | 'hour' | 'sale' | 'fixed';
  images: string[];
  location: string;
  specifications: Record<string, string>;
  tags: string[];
  postedAt: string;
}

// Using placeholder images from standard placeholder services
const PLACEHOLDER_BASE = 'https://images.unsplash.com';

export const mockOwnerProfiles: MockOwnerProfile[] = [
  {
    user_id: 'owner_001_carlos_motos',
    name: 'Carlos Rodríguez',
    age: 32,
    city: 'Cancún',
    country: 'Mexico',
    bio: 'Mecánico profesional con 10 años de experiencia. Me apasionan las motos y me encanta compartir mi taller con entusiastas. Disponible para reparaciones, mantenimiento y asesoría.',
    profile_images: [
      `${PLACEHOLDER_BASE}/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face`,
      `${PLACEHOLDER_BASE}/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop&crop=face`,
    ],
    rating: 4.9,
    reviewCount: 127,
    verified: true,
    responseTime: '< 1 hora',
    listings: [
      {
        id: 'moto_001',
        type: 'motorcycle',
        title: 'Honda CBR 600RR 2021 - Excelente Estado',
        description: 'Motocicleta sport en perfectas condiciones. Solo 15,000 km. Service completo reciente. Includes tanque de carbono, escape Akrapovic y quilla. Ideal para pista o calle.',
        price: 185000,
        priceType: 'sale',
        images: [
          `${PLACEHOLDER_BASE}/photo-1568772585407-9361f9bf3a87?w=800&h=600&fit=crop`,
          `${PLACEHOLDER_BASE}/photo-1558981806-ec527fa84c3d?w=800&h=600&fit=crop`,
          `${PLACEHOLDER_BASE}/photo-1449426468159-d96dbf08f19f?w=800&h=600&fit=crop`,
        ],
        location: 'Cancún, Quintana Roo',
        specifications: {
          'Marca': 'Honda',
          'Modelo': 'CBR 600RR',
          'Año': '2021',
          'Kilómetros': '15,000 km',
          'Cilindrada': '600cc',
          'Transmisión': '6 velocidades',
          'Color': 'Rojo/Negro',
        },
        tags: ['Sport', '600cc', 'Honda', '、低公里数', 'Service completo'],
        postedAt: '2024-01-15',
      },
      {
        id: 'bici_001',
        type: 'bicycle',
        title: 'Bicicleta de Montaña Trek Marlin 7 2023',
        description: 'Bicicleta trekking profesional, usada solo 3 meses. Perfecta para caminos de Cancún. Incluye casco, guantes y candado U-Lock.',
        price: 8500,
        priceType: 'sale',
        images: [
          `${PLACEHOLDER_BASE}/photo-1576435728678-68d0fbf94e91?w=800&h=600&fit=crop`,
          `${PLACEHOLDER_BASE}/photo-1507035895480-08acdf9b909d?w=800&h=600&fit=crop`,
        ],
        location: 'Cancún, Quintana Roo',
        specifications: {
          'Marca': 'Trek',
          'Modelo': 'Marlin 7',
          'Año': '2023',
          'Rodado': '29 pulgadas',
          'Cambios': 'Shimano Deore 10 velocidades',
          'Suspensión': 'Delantera SR Suntour',
          'Color': 'Negro/Verde',
        },
        tags: ['Trekking', 'Montaña', '2023', 'Casi nueva'],
        postedAt: '2024-01-18',
      },
      {
        id: 'worker_001',
        type: 'worker',
        title: 'Servicio de Mecánica Moto - Taller Carlos',
        description: 'Servicio profesional de mecánica para motocicletas de todas las marcas. Cambios de aceite, afinación, reparación de motor, eléctrico, y más. 10 años de experiencia.',
        price: 350,
        priceType: 'hour',
        images: [
          `${PLACEHOLDER_BASE}/photo-1487754180451-c456f719a1fc?w=800&h=600&fit=crop`,
          `${PLACEHOLDER_BASE}/photo-1621905251189-08b45d6a269e?w=800&h=600&fit=crop`,
        ],
        location: 'Cancún, Quintana Roo',
        specifications: {
          'Servicio': 'Mecánica General',
          'Especialidad': 'Motocicletas Sport y Naked',
          'Experiencia': '10 años',
          'Garantía': '3 meses en reparación',
          'Servicios': 'Cambio de aceite, afinación, eléctricos, suspensión',
        },
        tags: ['Mecánico', 'Motos', 'Professional', '10 años experiencia'],
        postedAt: '2024-01-10',
      },
      {
        id: 'job_001',
        type: 'job',
        title: 'Se Busca Ayudante de Mecánico - Medio Tiempo',
        description: 'Taller de motos busca ayudante con conocimiento básico en mecánica. Horario flexible. Ideal para estudiantes de mecánica o entusiastas que quieran aprender.',
        price: 5000,
        priceType: 'month',
        images: [
          `${PLACEHOLDER_BASE}/photo-1581092160562-40aa08e78837?w=800&h=600&fit=crop`,
        ],
        location: 'Cancún, Quintana Roo',
        specifications: {
          'Puesto': 'Ayudante de Mecánico',
          'Tipo': 'Medio Tiempo',
          'Horario': 'Sábado y Domingo 9am-5pm',
          'Requisitos': 'Conocimiento básico, responsabilidad',
          'Ofrecemos': 'Capacitación, posibilidad de crecimiento',
          'Sueldo': '$5,000 MN mensual',
        },
        tags: ['Empleo', 'Mecánico', 'Medio Tiempo', 'Aprendizaje'],
        postedAt: '2024-01-20',
      },
    ],
  },
  {
    user_id: 'owner_002_maria_bikes',
    name: 'María González',
    age: 28,
    city: 'Playa del Carmen',
    country: 'Mexico',
    bio: 'Instructora de yoga y emprendedora de movilidad sostenible. Ofrezco bicicletas eléctricas de alta gama para experiencias únicas en la Riviera Maya. Amante del medio ambiente.',
    profile_images: [
      `${PLACEHOLDER_BASE}/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face`,
      `${PLACEHOLDER_BASE}/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face`,
    ],
    rating: 4.8,
    reviewCount: 89,
    verified: true,
    responseTime: '< 2 horas',
    listings: [
      {
        id: 'moto_002',
        type: 'motorcycle',
        title: 'Scooter Eléctrica NIU NQi Pro 2023',
        description: 'Scooter eléctrica ultima generación. 80km de autonomía. Perfecta para moverte por la ciudad sin preocuparte por la gasolina. Incluye casco y seguro.',
        price: 65000,
        priceType: 'sale',
        images: [
          `${PLACEHOLDER_BASE}/photo-1558981403-c5f9899a28bc?w=800&h=600&fit=crop`,
          `${PLACEHOLDER_BASE}/photo-1623126908029-58cb08a2b272?w=800&h=600&fit=crop`,
        ],
        location: 'Playa del Carmen, Quintana Roo',
        specifications: {
          'Marca': 'NIU',
          'Modelo': 'NQi Pro',
          'Año': '2023',
          'Autonomía': '80 km',
          'Batería': 'Extraíble de litio',
          'Velocidad máxima': '45 km/h',
          'Color': 'Blanco',
        },
        tags: ['Eléctrica', 'NIU', 'Eco-friendly', 'Ciudad'],
        postedAt: '2024-01-12',
      },
      {
        id: 'bici_002',
        type: 'bicycle',
        title: 'Bicicleta Eléctrica Brompton C Line Explore',
        description: 'Bicicleta plegable eléctrica británica de alta gama. Plegado ultracompacto, perfecta para departamentos y viajes. 4 velocidades internas, frenos de disco.',
        price: 45000,
        priceType: 'sale',
        images: [
          `${PLACEHOLDER_BASE}/photo-1506103896118-56c7185ffd2c?w=800&h=600&fit=crop`,
          `${PLACEHOLDER_BASE}/photo-1485965120184-e224f721d03e?w=800&h=600&fit=crop`,
        ],
        location: 'Playa del Carmen, Quintana Roo',
        specifications: {
          'Marca': 'Brompton',
          'Modelo': 'C Line Explore',
          'Año': '2023',
          'Tipo': 'Plegable Eléctrica',
          'Velocidades': '4 velocidades internas',
          'Peso': '17.4 kg',
          'Color': 'Negro mate',
        },
        tags: ['Plegable', 'Eléctrica', 'Premium', 'Brompton'],
        postedAt: '2024-01-16',
      },
      {
        id: 'worker_002',
        type: 'worker',
        title: 'Clases de Yoga y Meditación en Bicicleta',
        description: 'Sesiones únicas de yoga y meditación combinadas con ciclismo urbano. Ideal para reducir estrés y conectar con la naturaleza. Sesiones de 1.5 horas.',
        price: 500,
        priceType: 'hour',
        images: [
          `${PLACEHOLDER_BASE}/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop`,
          `${PLACEHOLDER_BASE}/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop`,
        ],
        location: 'Playa del Carmen, Quintana Roo',
        specifications: {
          'Servicio': 'Clases de Yoga + Ciclismo',
          'Duración': '1.5 horas',
          'Nivel': 'Todos los niveles',
          'Incluye': 'Bicicleta, agua, tapete',
          'Ubicación': 'ParqueFundadores y alrededores',
        },
        tags: ['Yoga', 'Bicicleta', 'Wellness', 'Outdoor'],
        postedAt: '2024-01-08',
      },
      {
        id: 'job_002',
        type: 'job',
        title: 'Guía de Tours en Bicicleta - Tiempo Completo',
        description: 'Empresa de ecoturismo busca guías apasionados por el ciclismo y la naturaleza. Conocimiento del área de Riviera Maya y capacidad de分组 de grupos.',
        price: 12000,
        priceType: 'month',
        images: [
          `${PLACEHOLDER_BASE}/photo-1468421201265-2e60fce5f04c?w=800&h=600&fit=crop`,
        ],
        location: 'Playa del Carmen, Quintana Roo',
        specifications: {
          'Puesto': 'Guía de Tours',
          'Tipo': 'Tiempo Completo',
          'Horario': 'Lunes a Sábado, horarios rotativos',
          'Requisitos': 'Licencia de manejo, inglés, condición física',
          'Ofrecemos': 'Sueldo base + propinas, capacitación',
          'Sueldo': '$12,000 MN + propinas',
        },
        tags: ['Empleo', 'Guía', 'Turismo', 'Bicicleta'],
        postedAt: '2024-01-19',
      },
    ],
  },
];

// Helper function to get a specific listing
export function getListingById(listingId: string): MockListing | undefined {
  for (const profile of mockOwnerProfiles) {
    const listing = profile.listings.find(l => l.id === listingId);
    if (listing) return listing;
  }
  return undefined;
}

// Helper function to get listings by type
export function getListingsByType(type: MockListing['type']): Array<{ profile: MockOwnerProfile; listing: MockListing }> {
  const results: Array<{ profile: MockOwnerProfile; listing: MockListing }> = [];
  for (const profile of mockOwnerProfiles) {
    for (const listing of profile.listings) {
      if (listing.type === type) {
        results.push({ profile, listing });
      }
    }
  }
  return results;
}

// Helper function to get all listings
export function getAllListings(): Array<{ profile: MockOwnerProfile; listing: MockListing }> {
  const results: Array<{ profile: MockOwnerProfile; listing: MockListing }> = [];
  for (const profile of mockOwnerProfiles) {
    for (const listing of profile.listings) {
      results.push({ profile, listing });
    }
  }
  return results;
}
