// World Locations Database - Curated tourist destinations and popular cities
// Structure: Region -> Country -> Cities with neighborhoods and coordinates

export interface CityLocation {
  name: string;
  neighborhoods: string[];
  coordinates: { lat: number; lng: number };
  popular?: boolean; // Featured destination
}

export interface CountryData {
  cities: CityLocation[];
}

export interface RegionData {
  [country: string]: CountryData;
}

export interface WorldLocations {
  [region: string]: RegionData;
}

export const WORLD_LOCATIONS: WorldLocations = {
  'North America': {
    'United States': {
      cities: [
        // Top US Cities
        {
          name: 'New York City',
          neighborhoods: ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island', 'Williamsburg', 'SoHo', 'Chelsea', 'Upper East Side', 'Upper West Side', 'Harlem', 'Tribeca', 'East Village', 'West Village', 'Midtown', 'Financial District', 'Long Island City', 'DUMBO', 'Park Slope', 'Astoria'],
          coordinates: { lat: 40.7128, lng: -74.0060 },
          popular: true
        },
        {
          name: 'Los Angeles',
          neighborhoods: ['Hollywood', 'Santa Monica', 'Beverly Hills', 'Venice', 'Downtown LA', 'West Hollywood', 'Malibu', 'Silver Lake', 'Echo Park', 'Los Feliz', 'Brentwood', 'Culver City', 'Pasadena', 'Marina del Rey', 'Manhattan Beach', 'Hermosa Beach', 'Redondo Beach', 'Long Beach'],
          coordinates: { lat: 34.0522, lng: -118.2437 },
          popular: true
        },
        {
          name: 'Miami',
          neighborhoods: ['South Beach', 'Miami Beach', 'Brickell', 'Wynwood', 'Design District', 'Downtown Miami', 'Coconut Grove', 'Coral Gables', 'Little Havana', 'Key Biscayne', 'Bal Harbour', 'Aventura', 'Sunny Isles', 'North Miami', 'Midtown', 'Edgewater'],
          coordinates: { lat: 25.7617, lng: -80.1918 },
          popular: true
        },
        {
          name: 'San Francisco',
          neighborhoods: ['Downtown', 'SoMa', 'Mission District', 'Castro', 'Haight-Ashbury', 'Marina District', 'Pacific Heights', 'Nob Hill', 'Russian Hill', 'North Beach', 'Fisherman\'s Wharf', 'Chinatown', 'Financial District', 'Union Square', 'Hayes Valley'],
          coordinates: { lat: 37.7749, lng: -122.4194 },
          popular: true
        },
        {
          name: 'Las Vegas',
          neighborhoods: ['The Strip', 'Downtown', 'Summerlin', 'Henderson', 'Paradise', 'Spring Valley', 'North Las Vegas', 'Enterprise', 'Arts District'],
          coordinates: { lat: 36.1699, lng: -115.1398 },
          popular: true
        },
        {
          name: 'San Diego',
          neighborhoods: ['Downtown', 'Gaslamp Quarter', 'La Jolla', 'Pacific Beach', 'Ocean Beach', 'Mission Beach', 'Coronado', 'North Park', 'Hillcrest', 'Little Italy', 'Del Mar', 'Encinitas'],
          coordinates: { lat: 32.7157, lng: -117.1611 },
          popular: true
        },
        {
          name: 'Chicago',
          neighborhoods: ['Loop', 'River North', 'Lincoln Park', 'Wicker Park', 'Gold Coast', 'Old Town', 'Lakeview', 'Wrigleyville', 'Hyde Park', 'Pilsen', 'Logan Square', 'Bucktown', 'West Loop'],
          coordinates: { lat: 41.8781, lng: -87.6298 },
          popular: true
        },
        {
          name: 'Seattle',
          neighborhoods: ['Downtown', 'Capitol Hill', 'Queen Anne', 'Ballard', 'Fremont', 'Wallingford', 'University District', 'Belltown', 'South Lake Union', 'Pioneer Square', 'West Seattle', 'Georgetown'],
          coordinates: { lat: 47.6062, lng: -122.3321 },
          popular: true
        },
        {
          name: 'Austin',
          neighborhoods: ['Downtown', 'South Congress', 'East Austin', 'Zilker', 'Hyde Park', 'Travis Heights', 'Rainey Street', 'Domain', 'Mueller', 'Clarksville', 'Barton Hills', 'West Lake Hills'],
          coordinates: { lat: 30.2672, lng: -97.7431 },
          popular: true
        },
        {
          name: 'Denver',
          neighborhoods: ['Downtown', 'LoDo', 'RiNo', 'Cherry Creek', 'Capitol Hill', 'Highlands', 'Baker', 'Washington Park', 'Congress Park', 'Stapleton'],
          coordinates: { lat: 39.7392, lng: -104.9903 },
          popular: true
        },
        {
          name: 'Boston',
          neighborhoods: ['Back Bay', 'Beacon Hill', 'North End', 'South End', 'Seaport', 'Cambridge', 'Somerville', 'Brookline', 'Jamaica Plain', 'Fenway'],
          coordinates: { lat: 42.3601, lng: -71.0589 },
          popular: true
        },
        {
          name: 'Nashville',
          neighborhoods: ['Downtown', 'The Gulch', 'East Nashville', 'Germantown', 'Hillsboro Village', '12 South', 'Music Row', 'Midtown', 'Green Hills', 'Belle Meade'],
          coordinates: { lat: 36.1627, lng: -86.7816 },
          popular: true
        },
        {
          name: 'New Orleans',
          neighborhoods: ['French Quarter', 'Garden District', 'Marigny', 'Bywater', 'CBD', 'Warehouse District', 'Uptown', 'Mid-City', 'Treme', 'Magazine Street'],
          coordinates: { lat: 29.9511, lng: -90.0715 },
          popular: true
        },
        {
          name: 'Phoenix',
          neighborhoods: ['Downtown', 'Scottsdale', 'Paradise Valley', 'Tempe', 'Mesa', 'Arcadia', 'Camelback East', 'Biltmore'],
          coordinates: { lat: 33.4484, lng: -112.0740 },
          popular: true
        },
        {
          name: 'Portland',
          neighborhoods: ['Downtown', 'Pearl District', 'Alberta Arts', 'Hawthorne', 'Division', 'Mississippi', 'Sellwood', 'Nob Hill', 'Lloyd District'],
          coordinates: { lat: 45.5152, lng: -122.6784 },
          popular: true
        },
        {
          name: 'Honolulu',
          neighborhoods: ['Waikiki', 'Diamond Head', 'Ala Moana', 'Downtown', 'Kaimuki', 'Kahala', 'Hawaii Kai', 'Manoa', 'Kailua', 'North Shore'],
          coordinates: { lat: 21.3069, lng: -157.8583 },
          popular: true
        },
        {
          name: 'Atlanta',
          neighborhoods: ['Midtown', 'Buckhead', 'Virginia Highland', 'Inman Park', 'Downtown', 'Old Fourth Ward', 'Decatur', 'West Midtown', 'Poncey Highland'],
          coordinates: { lat: 33.7490, lng: -84.3880 },
          popular: true
        },
        {
          name: 'Philadelphia',
          neighborhoods: ['Center City', 'Old City', 'Rittenhouse Square', 'Fishtown', 'Northern Liberties', 'Society Hill', 'University City', 'Manayunk'],
          coordinates: { lat: 39.9526, lng: -75.1652 },
        },
        {
          name: 'Washington DC',
          neighborhoods: ['Georgetown', 'Dupont Circle', 'Capitol Hill', 'Adams Morgan', 'U Street', 'Navy Yard', 'Logan Circle', 'Shaw', 'Foggy Bottom'],
          coordinates: { lat: 38.9072, lng: -77.0369 },
        },
        {
          name: 'Dallas',
          neighborhoods: ['Downtown', 'Uptown', 'Deep Ellum', 'Knox Henderson', 'Bishop Arts', 'Highland Park', 'Lakewood', 'Oak Lawn'],
          coordinates: { lat: 32.7767, lng: -96.7970 },
        },
        {
          name: 'Houston',
          neighborhoods: ['Downtown', 'Montrose', 'Heights', 'Midtown', 'River Oaks', 'Museum District', 'Galleria', 'Memorial', 'EaDo'],
          coordinates: { lat: 29.7604, lng: -95.3698 },
        },
        {
          name: 'Savannah',
          neighborhoods: ['Historic District', 'Victorian District', 'Forsyth Park', 'City Market', 'Riverfront', 'Tybee Island'],
          coordinates: { lat: 32.0809, lng: -81.0912 },
        },
        {
          name: 'Charleston',
          neighborhoods: ['Downtown', 'French Quarter', 'South of Broad', 'Upper King', 'Cannonborough', 'Mount Pleasant', 'Folly Beach', 'Isle of Palms'],
          coordinates: { lat: 32.7765, lng: -79.9311 },
        },
        {
          name: 'Key West',
          neighborhoods: ['Old Town', 'Duval Street', 'Bahama Village', 'Casa Marina', 'New Town', 'Stock Island'],
          coordinates: { lat: 24.5551, lng: -81.7800 },
          popular: true
        },
        {
          name: 'Palm Beach',
          neighborhoods: ['Worth Avenue', 'South End', 'North End', 'West Palm Beach', 'Lake Worth', 'Delray Beach', 'Boca Raton'],
          coordinates: { lat: 26.7056, lng: -80.0364 },
        },
        {
          name: 'Fort Lauderdale',
          neighborhoods: ['Las Olas', 'Fort Lauderdale Beach', 'Downtown', 'Wilton Manors', 'Victoria Park', 'Rio Vista', 'Harbor Beach'],
          coordinates: { lat: 26.1224, lng: -80.1373 },
        },
        {
          name: 'Tampa',
          neighborhoods: ['Downtown', 'Ybor City', 'Hyde Park', 'South Tampa', 'Channelside', 'Westshore', 'Seminole Heights'],
          coordinates: { lat: 27.9506, lng: -82.4572 },
        },
        {
          name: 'Orlando',
          neighborhoods: ['Downtown', 'Winter Park', 'Lake Nona', 'Dr. Phillips', 'International Drive', 'Thornton Park', 'Mills 50', 'College Park'],
          coordinates: { lat: 28.5383, lng: -81.3792 },
        },
        {
          name: 'Aspen',
          neighborhoods: ['Downtown', 'West End', 'Red Mountain', 'Snowmass Village', 'Aspen Highlands'],
          coordinates: { lat: 39.1911, lng: -106.8175 },
          popular: true
        },
        {
          name: 'Vail',
          neighborhoods: ['Vail Village', 'Lionshead', 'West Vail', 'East Vail', 'Beaver Creek'],
          coordinates: { lat: 39.6403, lng: -106.3742 },
        },
        {
          name: 'Park City',
          neighborhoods: ['Main Street', 'Deer Valley', 'Canyons Village', 'Prospector', 'Kimball Junction'],
          coordinates: { lat: 40.6461, lng: -111.4980 },
        },
        {
          name: 'Napa Valley',
          neighborhoods: ['Downtown Napa', 'Yountville', 'St. Helena', 'Calistoga', 'Oakville', 'Rutherford'],
          coordinates: { lat: 38.2975, lng: -122.2869 },
        },
        {
          name: 'Santa Barbara',
          neighborhoods: ['Downtown', 'Funk Zone', 'Montecito', 'Hope Ranch', 'Mesa', 'Riviera'],
          coordinates: { lat: 34.4208, lng: -119.6982 },
        },
        {
          name: 'Carmel-by-the-Sea',
          neighborhoods: ['Downtown Carmel', 'Carmel Valley', 'Pebble Beach', 'Pacific Grove', 'Monterey'],
          coordinates: { lat: 36.5552, lng: -121.9233 },
        },
        {
          name: 'Lake Tahoe',
          neighborhoods: ['South Lake Tahoe', 'North Lake Tahoe', 'Incline Village', 'Tahoe City', 'Truckee', 'Squaw Valley'],
          coordinates: { lat: 39.0968, lng: -120.0324 },
        },
        {
          name: 'Jackson Hole',
          neighborhoods: ['Town Square', 'Teton Village', 'Wilson', 'South Jackson'],
          coordinates: { lat: 43.4799, lng: -110.7624 },
        },
        {
          name: 'Scottsdale',
          neighborhoods: ['Old Town', 'North Scottsdale', 'Paradise Valley', 'McCormick Ranch', 'Gainey Ranch', 'DC Ranch'],
          coordinates: { lat: 33.4942, lng: -111.9261 },
          popular: true
        },
        {
          name: 'Sedona',
          neighborhoods: ['Uptown', 'West Sedona', 'Village of Oak Creek', 'Chapel Area', 'Red Rock Loop'],
          coordinates: { lat: 34.8697, lng: -111.7610 },
        },
        {
          name: 'Maui',
          neighborhoods: ['Lahaina', 'Kaanapali', 'Wailea', 'Kihei', 'Paia', 'Hana', 'Kahului', 'Kapalua', 'Makawao'],
          coordinates: { lat: 20.7984, lng: -156.3319 },
          popular: true
        },
        {
          name: 'Big Island Hawaii',
          neighborhoods: ['Kona', 'Hilo', 'Waikoloa', 'Kohala Coast', 'Volcano', 'Captain Cook', 'Waimea'],
          coordinates: { lat: 19.5429, lng: -155.6659 },
        },
        {
          name: 'Kauai',
          neighborhoods: ['Poipu', 'Princeville', 'Hanalei', 'Kapaa', 'Lihue', 'Koloa', 'Waimea'],
          coordinates: { lat: 22.0964, lng: -159.5261 },
        },
      ]
    },
    'Mexico': {
      cities: [
        // Baja California Norte
        {
          name: 'Tijuana',
          neighborhoods: ['Zona Rio', 'Playas de Tijuana', 'Centro', 'Hipódromo', 'Chapultepec', 'Otay', 'La Mesa'],
          coordinates: { lat: 32.5149, lng: -117.0382 },
          popular: true
        },
        {
          name: 'Ensenada',
          neighborhoods: ['Centro', 'Valle de Guadalupe', 'El Sauzal', 'Punta Banda', 'La Bufadora', 'San Antonio de las Minas'],
          coordinates: { lat: 31.8667, lng: -116.5964 },
          popular: true
        },
        {
          name: 'Rosarito',
          neighborhoods: ['Centro', 'Popotla', 'Puerto Nuevo', 'Calafia', 'Real del Mar'],
          coordinates: { lat: 32.3631, lng: -117.0581 },
        },
        {
          name: 'Mexicali',
          neighborhoods: ['Centro', 'Nueva Mexicali', 'Valle del Sol', 'Cataviña', 'San Felipe'],
          coordinates: { lat: 32.6245, lng: -115.4523 },
        },
        // Baja California Sur
        {
          name: 'Los Cabos',
          neighborhoods: ['Cabo San Lucas Centro', 'Medano', 'Pedregal', 'El Tezal', 'Palmilla', 'San Jose del Cabo Centro', 'Zona Hotelera', 'Puerto Los Cabos', 'Cabo Corridor', 'Costa Azul'],
          coordinates: { lat: 22.8905, lng: -109.9167 },
          popular: true
        },
        {
          name: 'La Paz',
          neighborhoods: ['Centro', 'Malecon', 'El Centenario', 'La Ventana', 'Todos Santos', 'Balandra', 'El Tecolote'],
          coordinates: { lat: 24.1426, lng: -110.3128 },
          popular: true
        },
        {
          name: 'Loreto',
          neighborhoods: ['Centro', 'Nopolo', 'Puerto Escondido', 'Ligui'],
          coordinates: { lat: 26.0114, lng: -111.3479 },
        },
        // Major Cities
        {
          name: 'Ciudad de Mexico',
          neighborhoods: ['Polanco', 'Condesa', 'Roma Norte', 'Roma Sur', 'Juarez', 'Cuauhtemoc', 'Santa Fe', 'Del Valle', 'Narvarte', 'Napoles', 'Coyoacan', 'San Angel', 'Pedregal', 'Tlalpan', 'Xochimilco', 'Centro Historico', 'Reforma'],
          coordinates: { lat: 19.4326, lng: -99.1332 },
          popular: true
        },
        {
          name: 'Monterrey',
          neighborhoods: ['Centro', 'San Pedro Garza Garcia', 'Valle Oriente', 'Del Valle', 'Cumbres', 'Contry', 'Mitras Centro', 'Obispado', 'Chipinque', 'Residencial', 'Carretera Nacional'],
          coordinates: { lat: 25.6866, lng: -100.3161 },
          popular: true
        },
        {
          name: 'Guadalajara',
          neighborhoods: ['Centro', 'Chapultepec', 'Providencia', 'Americana', 'Ladrón de Guevara', 'Tlaquepaque', 'Zapopan Centro', 'Andares', 'Puerta de Hierro', 'Colinas de San Javier', 'Country Club'],
          coordinates: { lat: 20.6597, lng: -103.3496 },
          popular: true
        },
        // Quintana Roo
        {
          name: 'Cancun',
          neighborhoods: ['Zona Hotelera', 'Centro', 'Puerto Juarez', 'El Table', 'Supermanzana 500', 'Punta Cancun', 'Punta Nizuc', 'Playa Delfines', 'Laguna Nichupte'],
          coordinates: { lat: 21.1619, lng: -86.8515 },
          popular: true
        },
        {
          name: 'Playa del Carmen',
          neighborhoods: ['Centro', 'Playacar', 'Gonzalo Guerrero', 'Ejidal', 'Colosio', 'Quinta Avenida', 'Zazil-Ha', 'Mamitas Beach', 'Xcaret'],
          coordinates: { lat: 20.6296, lng: -87.0739 },
          popular: true
        },
        {
          name: 'Tulum',
          neighborhoods: ['Centro', 'Aldea Zama', 'La Veleta', 'Region 15', 'Holistika', 'Zona Hotelera', 'Boca Paila', 'Sian Kaan', 'Tulum Beach', 'Tulum Ruins'],
          coordinates: { lat: 20.2111, lng: -87.4653 },
          popular: true
        },
        {
          name: 'Cozumel',
          neighborhoods: ['Centro', 'Zona Hotelera Norte', 'Zona Hotelera Sur', 'San Miguel', 'Playa Palancar', 'Punta Sur'],
          coordinates: { lat: 20.4318, lng: -86.9194 },
          popular: true
        },
        {
          name: 'Isla Mujeres',
          neighborhoods: ['Centro', 'Punta Sur', 'Playa Norte', 'El Garrafon', 'Salina Grande'],
          coordinates: { lat: 21.2320, lng: -86.7314 },
        },
        {
          name: 'Bacalar',
          neighborhoods: ['Centro', 'Costera', 'Xul-Ha', 'Laguna de los Siete Colores'],
          coordinates: { lat: 18.6814, lng: -88.3948 },
        },
        {
          name: 'Holbox',
          neighborhoods: ['Centro', 'Punta Mosquito', 'Punta Cocos', 'Playa Holbox'],
          coordinates: { lat: 21.5233, lng: -87.3817 },
          popular: true
        },
        // Guerrero
        {
          name: 'Acapulco',
          neighborhoods: ['Zona Dorada', 'Diamante', 'Centro', 'Costera', 'Punta Diamante', 'Las Brisas', 'Puerto Marques', 'Pie de la Cuesta'],
          coordinates: { lat: 16.8531, lng: -99.8237 },
          popular: true
        },
        {
          name: 'Zihuatanejo',
          neighborhoods: ['Centro', 'Playa La Ropa', 'Ixtapa Zona Hotelera', 'Playa Linda', 'Playa Las Gatas'],
          coordinates: { lat: 17.6417, lng: -101.5519 },
          popular: true
        },
        // Jalisco
        {
          name: 'Puerto Vallarta',
          neighborhoods: ['Zona Romantica', 'Centro', 'Marina Vallarta', 'Nuevo Vallarta', 'Zona Hotelera', 'Conchas Chinas', 'Amapas', 'Los Muertos', 'Malecon', 'Bucerias'],
          coordinates: { lat: 20.6534, lng: -105.2253 },
          popular: true
        },
        // Nayarit
        {
          name: 'Riviera Nayarit',
          neighborhoods: ['Punta Mita', 'Sayulita', 'San Pancho', 'Bucerias', 'La Cruz de Huanacaxtle', 'Nuevo Vallarta', 'Flamingos', 'Litibu'],
          coordinates: { lat: 20.8688, lng: -105.4428 },
          popular: true
        },
        // Oaxaca
        {
          name: 'Puerto Escondido',
          neighborhoods: ['Zicatela', 'La Punta', 'Rinconada', 'Centro', 'Carrizalillo', 'Playa Principal', 'Bacocho'],
          coordinates: { lat: 15.8720, lng: -97.0767 },
          popular: true
        },
        {
          name: 'Huatulco',
          neighborhoods: ['La Crucecita', 'Santa Cruz', 'Tangolunda', 'Chahue', 'Bahias de Huatulco'],
          coordinates: { lat: 15.7753, lng: -96.1344 },
        },
        {
          name: 'Oaxaca de Juarez',
          neighborhoods: ['Centro Historico', 'Reforma', 'Jalatlaco', 'Xochimilco', 'La Cascada', 'Monte Alban'],
          coordinates: { lat: 17.0732, lng: -96.7266 },
        },
        // Yucatan
        {
          name: 'Merida',
          neighborhoods: ['Centro Historico', 'Paseo de Montejo', 'Garcia Gineres', 'Campestre', 'Altabrisa', 'Montes de Ame', 'Gran Santa Fe', 'Cholul', 'Temozon Norte'],
          coordinates: { lat: 20.9674, lng: -89.5926 },
          popular: true
        },
        // Sinaloa
        {
          name: 'Mazatlan',
          neighborhoods: ['Zona Dorada', 'Centro', 'Marina Mazatlan', 'Cerritos', 'Sabalo Country', 'Malecon', 'Olas Altas', 'Stone Island'],
          coordinates: { lat: 23.2329, lng: -106.4245 },
          popular: true
        },
        // Queretaro
        {
          name: 'San Miguel de Allende',
          neighborhoods: ['Centro', 'Atascadero', 'Los Frailes', 'Rancho Los Labradores', 'Guadiana', 'Jardin Principal'],
          coordinates: { lat: 20.9144, lng: -100.7452 },
          popular: true
        },
        // Morelos
        {
          name: 'Cuernavaca',
          neighborhoods: ['Centro', 'Lomas de Cortes', 'Rancho Cortes', 'Vista Hermosa', 'Palmira', 'Acapantzingo'],
          coordinates: { lat: 18.9242, lng: -99.2216 },
        },
        // Chiapas
        {
          name: 'San Cristobal de las Casas',
          neighborhoods: ['Centro', 'Real del Monte', 'La Merced', 'Guadalupe', 'El Cerrillo'],
          coordinates: { lat: 16.7370, lng: -92.6376 },
        },
      ]
    },
    'Canada': {
      cities: [
        {
          name: 'Toronto',
          neighborhoods: ['Downtown', 'Yorkville', 'Queen West', 'Kensington Market', 'Distillery District', 'Liberty Village', 'King West', 'Entertainment District', 'Leslieville'],
          coordinates: { lat: 43.6532, lng: -79.3832 },
          popular: true
        },
        {
          name: 'Vancouver',
          neighborhoods: ['Downtown', 'Gastown', 'Yaletown', 'Kitsilano', 'West End', 'Coal Harbour', 'Mount Pleasant', 'Commercial Drive', 'Granville Island'],
          coordinates: { lat: 49.2827, lng: -123.1207 },
          popular: true
        },
        {
          name: 'Montreal',
          neighborhoods: ['Old Montreal', 'Plateau Mont-Royal', 'Mile End', 'Downtown', 'Griffintown', 'Outremont', 'Westmount', 'Little Italy'],
          coordinates: { lat: 45.5017, lng: -73.5673 },
          popular: true
        },
        {
          name: 'Whistler',
          neighborhoods: ['Whistler Village', 'Upper Village', 'Creekside', 'Blackcomb', 'Function Junction'],
          coordinates: { lat: 50.1163, lng: -122.9574 },
          popular: true
        },
        {
          name: 'Calgary',
          neighborhoods: ['Downtown', 'Kensington', 'Inglewood', 'Mission', '17th Avenue', 'Beltline', 'Bridgeland'],
          coordinates: { lat: 51.0447, lng: -114.0719 },
        },
        {
          name: 'Banff',
          neighborhoods: ['Downtown Banff', 'Banff Avenue', 'Tunnel Mountain', 'Lake Louise'],
          coordinates: { lat: 51.1784, lng: -115.5708 },
          popular: true
        },
      ]
    }
  },
  'Europe': {
    'Spain': {
      cities: [
        {
          name: 'Barcelona',
          neighborhoods: ['Gothic Quarter', 'El Born', 'Eixample', 'Gracia', 'Barceloneta', 'Raval', 'Poble Sec', 'Sant Antoni', 'Sarria', 'Les Corts', 'Poblenou'],
          coordinates: { lat: 41.3851, lng: 2.1734 },
          popular: true
        },
        {
          name: 'Madrid',
          neighborhoods: ['Sol', 'Malasana', 'Chueca', 'La Latina', 'Salamanca', 'Retiro', 'Lavapies', 'Chamberi', 'Arguelles', 'Huertas'],
          coordinates: { lat: 40.4168, lng: -3.7038 },
          popular: true
        },
        {
          name: 'Ibiza',
          neighborhoods: ['Ibiza Town', 'Playa d\'en Bossa', 'San Antonio', 'Santa Eulalia', 'Talamanca', 'Cala Jondal', 'Es Cubells', 'San Jose', 'Portinatx', 'Cala Conta', 'Cala Bassa', 'Es Vedra'],
          coordinates: { lat: 38.9067, lng: 1.4206 },
          popular: true
        },
        {
          name: 'Mallorca',
          neighborhoods: ['Palma', 'Port de Soller', 'Valldemossa', 'Deia', 'Alcudia', 'Puerto Pollensa', 'Santanyi', 'Cala d\'Or', 'Magaluf', 'Santa Ponsa'],
          coordinates: { lat: 39.5696, lng: 2.6502 },
          popular: true
        },
        {
          name: 'Marbella',
          neighborhoods: ['Old Town', 'Puerto Banus', 'Golden Mile', 'Nueva Andalucia', 'San Pedro', 'Los Monteros', 'Guadalmina', 'Elviria'],
          coordinates: { lat: 36.5099, lng: -4.8860 },
          popular: true
        },
        {
          name: 'Valencia',
          neighborhoods: ['El Carmen', 'Ruzafa', 'Eixample', 'El Cabanyal', 'Ciutat Vella', 'Benimaclet', 'La Malvarrosa'],
          coordinates: { lat: 39.4699, lng: -0.3763 },
          popular: true
        },
        {
          name: 'Seville',
          neighborhoods: ['Santa Cruz', 'Triana', 'Alameda', 'Nervion', 'El Arenal', 'La Macarena', 'Centro'],
          coordinates: { lat: 37.3891, lng: -5.9845 },
        },
        {
          name: 'San Sebastian',
          neighborhoods: ['Parte Vieja', 'Centro', 'Gros', 'Antiguo', 'Amara', 'Ondarreta'],
          coordinates: { lat: 43.3183, lng: -1.9812 },
          popular: true
        },
        {
          name: 'Granada',
          neighborhoods: ['Albaicin', 'Sacromonte', 'Centro', 'Realejo', 'Genil'],
          coordinates: { lat: 37.1773, lng: -3.5986 },
        },
        {
          name: 'Malaga',
          neighborhoods: ['Centro', 'La Malagueta', 'Pedregalejo', 'El Palo', 'Soho'],
          coordinates: { lat: 36.7213, lng: -4.4214 },
        },
        {
          name: 'Costa Brava',
          neighborhoods: ['Tossa de Mar', 'Lloret de Mar', 'Blanes', 'Roses', 'Cadaques', 'Empuriabrava', 'Begur'],
          coordinates: { lat: 41.7251, lng: 2.9311 },
        },
        {
          name: 'Canary Islands',
          neighborhoods: ['Tenerife South', 'Gran Canaria', 'Lanzarote', 'Fuerteventura', 'La Palma', 'Playa de las Americas', 'Costa Adeje'],
          coordinates: { lat: 28.2916, lng: -16.6291 },
          popular: true
        },
        {
          name: 'Formentera',
          neighborhoods: ['Sant Francesc', 'Es Pujols', 'La Savina', 'El Pilar', 'Cala Saona'],
          coordinates: { lat: 38.7069, lng: 1.4358 },
        },
      ]
    },
    'Italy': {
      cities: [
        {
          name: 'Rome',
          neighborhoods: ['Trastevere', 'Centro Storico', 'Testaccio', 'Monti', 'Prati', 'Vaticano', 'Campo de Fiori', 'Navona', 'San Giovanni', 'Parioli'],
          coordinates: { lat: 41.9028, lng: 12.4964 },
          popular: true
        },
        {
          name: 'Milan',
          neighborhoods: ['Centro', 'Brera', 'Navigli', 'Porta Romana', 'Isola', 'Porta Venezia', 'Garibaldi', 'Corso Como', 'Tortona'],
          coordinates: { lat: 45.4642, lng: 9.1900 },
          popular: true
        },
        {
          name: 'Florence',
          neighborhoods: ['Centro', 'Santa Croce', 'Oltrarno', 'San Marco', 'Santa Maria Novella', 'San Lorenzo', 'Santo Spirito'],
          coordinates: { lat: 43.7696, lng: 11.2558 },
          popular: true
        },
        {
          name: 'Venice',
          neighborhoods: ['San Marco', 'Dorsoduro', 'Cannaregio', 'Castello', 'San Polo', 'Giudecca', 'Murano', 'Burano', 'Lido'],
          coordinates: { lat: 45.4408, lng: 12.3155 },
          popular: true
        },
        {
          name: 'Amalfi Coast',
          neighborhoods: ['Positano', 'Amalfi', 'Ravello', 'Praiano', 'Maiori', 'Minori', 'Sorrento', 'Capri'],
          coordinates: { lat: 40.6340, lng: 14.6027 },
          popular: true
        },
        {
          name: 'Cinque Terre',
          neighborhoods: ['Monterosso', 'Vernazza', 'Corniglia', 'Manarola', 'Riomaggiore'],
          coordinates: { lat: 44.1461, lng: 9.6439 },
          popular: true
        },
        {
          name: 'Lake Como',
          neighborhoods: ['Como', 'Bellagio', 'Varenna', 'Menaggio', 'Cernobbio', 'Tremezzo', 'Lecco'],
          coordinates: { lat: 45.9937, lng: 9.2577 },
          popular: true
        },
        {
          name: 'Naples',
          neighborhoods: ['Centro Storico', 'Chiaia', 'Vomero', 'Posillipo', 'Santa Lucia', 'Spaccanapoli'],
          coordinates: { lat: 40.8518, lng: 14.2681 },
        },
        {
          name: 'Sicily',
          neighborhoods: ['Palermo', 'Taormina', 'Catania', 'Syracuse', 'Cefalu', 'Trapani', 'Ragusa', 'Noto'],
          coordinates: { lat: 37.5994, lng: 14.0154 },
          popular: true
        },
        {
          name: 'Sardinia',
          neighborhoods: ['Costa Smeralda', 'Porto Cervo', 'Cagliari', 'Alghero', 'Olbia', 'San Teodoro', 'Porto Rotondo'],
          coordinates: { lat: 40.1209, lng: 9.0129 },
          popular: true
        },
        {
          name: 'Tuscany',
          neighborhoods: ['Siena', 'San Gimignano', 'Lucca', 'Pisa', 'Chianti', 'Montepulciano', 'Cortona', 'Arezzo'],
          coordinates: { lat: 43.7711, lng: 11.2486 },
        },
      ]
    },
    'France': {
      cities: [
        {
          name: 'Paris',
          neighborhoods: ['Le Marais', 'Saint-Germain', 'Montmartre', 'Champs-Elysees', 'Latin Quarter', 'Bastille', 'Opera', 'Pigalle', 'Belleville', 'Republique', 'Oberkampf'],
          coordinates: { lat: 48.8566, lng: 2.3522 },
          popular: true
        },
        {
          name: 'Nice',
          neighborhoods: ['Promenade des Anglais', 'Vieux Nice', 'Port', 'Cimiez', 'Carre d\'Or', 'Liberation'],
          coordinates: { lat: 43.7102, lng: 7.2620 },
          popular: true
        },
        {
          name: 'Cannes',
          neighborhoods: ['La Croisette', 'Le Suquet', 'Palm Beach', 'La Californie', 'Mougins'],
          coordinates: { lat: 43.5528, lng: 7.0174 },
          popular: true
        },
        {
          name: 'Saint-Tropez',
          neighborhoods: ['Port', 'Vieille Ville', 'Pampelonne', 'Ramatuelle', 'Les Parcs'],
          coordinates: { lat: 43.2677, lng: 6.6407 },
          popular: true
        },
        {
          name: 'Monaco',
          neighborhoods: ['Monte Carlo', 'La Condamine', 'Monaco-Ville', 'Fontvieille', 'Larvotto'],
          coordinates: { lat: 43.7384, lng: 7.4246 },
          popular: true
        },
        {
          name: 'Lyon',
          neighborhoods: ['Vieux Lyon', 'Presqu\'ile', 'Croix-Rousse', 'Confluence', 'Part-Dieu', 'Brotteaux'],
          coordinates: { lat: 45.7640, lng: 4.8357 },
        },
        {
          name: 'Bordeaux',
          neighborhoods: ['Centre', 'Saint-Pierre', 'Chartrons', 'Bacalan', 'Saint-Michel', 'La Bastide'],
          coordinates: { lat: 44.8378, lng: -0.5792 },
        },
        {
          name: 'Marseille',
          neighborhoods: ['Vieux Port', 'Le Panier', 'Prado', 'Endoume', 'Les Goudes', 'Calanques'],
          coordinates: { lat: 43.2965, lng: 5.3698 },
        },
        {
          name: 'Provence',
          neighborhoods: ['Aix-en-Provence', 'Avignon', 'Arles', 'Saint-Remy', 'Gordes', 'Lourmarin', 'Roussillon'],
          coordinates: { lat: 43.9493, lng: 4.8055 },
          popular: true
        },
        {
          name: 'Chamonix',
          neighborhoods: ['Centre', 'Les Praz', 'Argentiere', 'Les Houches', 'Les Bossons'],
          coordinates: { lat: 45.9237, lng: 6.8694 },
        },
        {
          name: 'Corsica',
          neighborhoods: ['Ajaccio', 'Bastia', 'Bonifacio', 'Calvi', 'Porto-Vecchio', 'Saint-Florent'],
          coordinates: { lat: 42.0396, lng: 9.0129 },
        },
      ]
    },
    'Portugal': {
      cities: [
        {
          name: 'Lisbon',
          neighborhoods: ['Alfama', 'Bairro Alto', 'Chiado', 'Baixa', 'Principe Real', 'Belem', 'Estrela', 'Santos', 'Graca', 'Mouraria'],
          coordinates: { lat: 38.7223, lng: -9.1393 },
          popular: true
        },
        {
          name: 'Porto',
          neighborhoods: ['Ribeira', 'Baixa', 'Boavista', 'Foz', 'Cedofeita', 'Bonfim', 'Miragaia'],
          coordinates: { lat: 41.1579, lng: -8.6291 },
          popular: true
        },
        {
          name: 'Algarve',
          neighborhoods: ['Lagos', 'Faro', 'Albufeira', 'Vilamoura', 'Portimao', 'Tavira', 'Carvoeiro', 'Sagres', 'Praia da Rocha'],
          coordinates: { lat: 37.0179, lng: -7.9307 },
          popular: true
        },
        {
          name: 'Cascais',
          neighborhoods: ['Centro', 'Estoril', 'Guincho', 'Carcavelos', 'Monte Estoril'],
          coordinates: { lat: 38.6979, lng: -9.4215 },
        },
        {
          name: 'Sintra',
          neighborhoods: ['Centro', 'Sao Pedro', 'Colares', 'Praia das Macas'],
          coordinates: { lat: 38.8029, lng: -9.3817 },
        },
        {
          name: 'Madeira',
          neighborhoods: ['Funchal', 'Camara de Lobos', 'Machico', 'Santa Cruz', 'Ribeira Brava'],
          coordinates: { lat: 32.6669, lng: -16.9241 },
          popular: true
        },
        {
          name: 'Azores',
          neighborhoods: ['Ponta Delgada', 'Sao Miguel', 'Terceira', 'Faial', 'Pico', 'Furnas'],
          coordinates: { lat: 37.7412, lng: -25.6756 },
        },
      ]
    },
    'Greece': {
      cities: [
        {
          name: 'Athens',
          neighborhoods: ['Plaka', 'Monastiraki', 'Kolonaki', 'Psyrri', 'Koukaki', 'Exarchia', 'Glyfada', 'Kifissia'],
          coordinates: { lat: 37.9838, lng: 23.7275 },
          popular: true
        },
        {
          name: 'Santorini',
          neighborhoods: ['Oia', 'Fira', 'Imerovigli', 'Kamari', 'Perissa', 'Akrotiri', 'Firostefani'],
          coordinates: { lat: 36.3932, lng: 25.4615 },
          popular: true
        },
        {
          name: 'Mykonos',
          neighborhoods: ['Mykonos Town', 'Little Venice', 'Ornos', 'Platis Gialos', 'Paradise Beach', 'Super Paradise', 'Ano Mera'],
          coordinates: { lat: 37.4467, lng: 25.3289 },
          popular: true
        },
        {
          name: 'Crete',
          neighborhoods: ['Heraklion', 'Chania', 'Rethymno', 'Agios Nikolaos', 'Elounda', 'Matala', 'Spinalonga'],
          coordinates: { lat: 35.2401, lng: 24.8093 },
          popular: true
        },
        {
          name: 'Rhodes',
          neighborhoods: ['Rhodes Town', 'Lindos', 'Faliraki', 'Ixia', 'Kamiros'],
          coordinates: { lat: 36.4341, lng: 28.2176 },
        },
        {
          name: 'Corfu',
          neighborhoods: ['Corfu Town', 'Paleokastritsa', 'Sidari', 'Kassiopi', 'Benitses'],
          coordinates: { lat: 39.6243, lng: 19.9217 },
        },
        {
          name: 'Zakynthos',
          neighborhoods: ['Zakynthos Town', 'Laganas', 'Tsilivi', 'Kalamaki', 'Navagio Beach'],
          coordinates: { lat: 37.7879, lng: 20.8979 },
        },
        {
          name: 'Paros',
          neighborhoods: ['Parikia', 'Naoussa', 'Lefkes', 'Aliki', 'Piso Livadi'],
          coordinates: { lat: 37.0853, lng: 25.1520 },
        },
        {
          name: 'Naxos',
          neighborhoods: ['Naxos Town', 'Agios Prokopios', 'Agia Anna', 'Plaka', 'Apollonas'],
          coordinates: { lat: 37.1036, lng: 25.3769 },
        },
      ]
    },
    'United Kingdom': {
      cities: [
        {
          name: 'London',
          neighborhoods: ['Mayfair', 'Soho', 'Shoreditch', 'Notting Hill', 'Chelsea', 'Kensington', 'Camden', 'Westminster', 'Covent Garden', 'South Bank', 'Brixton', 'Hackney', 'Islington'],
          coordinates: { lat: 51.5074, lng: -0.1278 },
          popular: true
        },
        {
          name: 'Edinburgh',
          neighborhoods: ['Old Town', 'New Town', 'Leith', 'Stockbridge', 'Morningside', 'Dean Village', 'Grassmarket'],
          coordinates: { lat: 55.9533, lng: -3.1883 },
          popular: true
        },
        {
          name: 'Manchester',
          neighborhoods: ['Northern Quarter', 'Deansgate', 'Ancoats', 'Spinningfields', 'Castlefield', 'Didsbury'],
          coordinates: { lat: 53.4808, lng: -2.2426 },
        },
        {
          name: 'Brighton',
          neighborhoods: ['The Lanes', 'North Laine', 'Kemptown', 'Hove', 'Seven Dials'],
          coordinates: { lat: 50.8225, lng: -0.1372 },
        },
        {
          name: 'Bath',
          neighborhoods: ['City Centre', 'Royal Crescent', 'Lansdown', 'Widcombe', 'Bear Flat'],
          coordinates: { lat: 51.3758, lng: -2.3599 },
        },
        {
          name: 'Oxford',
          neighborhoods: ['City Centre', 'Jericho', 'Summertown', 'Cowley', 'Headington'],
          coordinates: { lat: 51.7520, lng: -1.2577 },
        },
        {
          name: 'Cambridge',
          neighborhoods: ['City Centre', 'King\'s Parade', 'Mill Road', 'Newnham', 'Castle Hill'],
          coordinates: { lat: 52.2053, lng: 0.1218 },
        },
        {
          name: 'Cornwall',
          neighborhoods: ['St Ives', 'Padstow', 'Newquay', 'Falmouth', 'Penzance', 'Rock', 'Port Isaac'],
          coordinates: { lat: 50.2660, lng: -5.0527 },
        },
        {
          name: 'Cotswolds',
          neighborhoods: ['Bourton-on-the-Water', 'Stow-on-the-Wold', 'Broadway', 'Bibury', 'Cirencester', 'Chipping Campden'],
          coordinates: { lat: 51.8330, lng: -1.8433 },
        },
      ]
    },
    'Netherlands': {
      cities: [
        {
          name: 'Amsterdam',
          neighborhoods: ['Centrum', 'Jordaan', 'De Pijp', 'Oud-West', 'Oost', 'Noord', 'Vondelpark', 'Nine Streets', 'Red Light District'],
          coordinates: { lat: 52.3676, lng: 4.9041 },
          popular: true
        },
        {
          name: 'Rotterdam',
          neighborhoods: ['Centrum', 'Kralingen', 'Delfshaven', 'Kop van Zuid', 'Cool District'],
          coordinates: { lat: 51.9244, lng: 4.4777 },
        },
        {
          name: 'The Hague',
          neighborhoods: ['Centrum', 'Scheveningen', 'Zeeheldenkwartier', 'Archipelbuurt'],
          coordinates: { lat: 52.0705, lng: 4.3007 },
        },
        {
          name: 'Utrecht',
          neighborhoods: ['Centrum', 'Oudegracht', 'Lombok', 'Wittevrouwen'],
          coordinates: { lat: 52.0907, lng: 5.1214 },
        },
      ]
    },
    'Germany': {
      cities: [
        {
          name: 'Berlin',
          neighborhoods: ['Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Friedrichshain', 'Charlottenburg', 'Neukolln', 'Schoneberg', 'Wedding'],
          coordinates: { lat: 52.5200, lng: 13.4050 },
          popular: true
        },
        {
          name: 'Munich',
          neighborhoods: ['Altstadt', 'Maxvorstadt', 'Schwabing', 'Glockenbachviertel', 'Haidhausen', 'Lehel', 'Bogenhausen'],
          coordinates: { lat: 48.1351, lng: 11.5820 },
          popular: true
        },
        {
          name: 'Hamburg',
          neighborhoods: ['St. Pauli', 'Altona', 'Eimsbuttel', 'Speicherstadt', 'HafenCity', 'Sternschanze'],
          coordinates: { lat: 53.5511, lng: 9.9937 },
        },
        {
          name: 'Frankfurt',
          neighborhoods: ['Innenstadt', 'Sachsenhausen', 'Nordend', 'Bornheim', 'Westend'],
          coordinates: { lat: 50.1109, lng: 8.6821 },
        },
        {
          name: 'Cologne',
          neighborhoods: ['Altstadt', 'Belgisches Viertel', 'Ehrenfeld', 'Sudstadt'],
          coordinates: { lat: 50.9375, lng: 6.9603 },
        },
      ]
    },
    'Switzerland': {
      cities: [
        {
          name: 'Zurich',
          neighborhoods: ['Altstadt', 'Niederdorf', 'Kreis 5', 'Seefeld', 'Enge', 'Oerlikon'],
          coordinates: { lat: 47.3769, lng: 8.5417 },
          popular: true
        },
        {
          name: 'Geneva',
          neighborhoods: ['Old Town', 'Eaux-Vives', 'Plainpalais', 'Carouge', 'Les Paquis'],
          coordinates: { lat: 46.2044, lng: 6.1432 },
          popular: true
        },
        {
          name: 'Zermatt',
          neighborhoods: ['Village Centre', 'Winkelmatten', 'Furi', 'Matterhorn Area'],
          coordinates: { lat: 46.0207, lng: 7.7491 },
          popular: true
        },
        {
          name: 'Interlaken',
          neighborhoods: ['Interlaken West', 'Interlaken Ost', 'Unterseen', 'Matten'],
          coordinates: { lat: 46.6863, lng: 7.8632 },
        },
        {
          name: 'Lucerne',
          neighborhoods: ['Altstadt', 'Neustadt', 'Littau', 'Tribschen'],
          coordinates: { lat: 47.0502, lng: 8.3093 },
        },
        {
          name: 'St. Moritz',
          neighborhoods: ['St. Moritz Dorf', 'St. Moritz Bad', 'Champfer', 'Silvaplana'],
          coordinates: { lat: 46.4908, lng: 9.8355 },
          popular: true
        },
      ]
    },
    'Austria': {
      cities: [
        {
          name: 'Vienna',
          neighborhoods: ['Innere Stadt', 'Leopoldstadt', 'Neubau', 'Josefstadt', 'Mariahilf', 'Wieden'],
          coordinates: { lat: 48.2082, lng: 16.3738 },
          popular: true
        },
        {
          name: 'Salzburg',
          neighborhoods: ['Altstadt', 'Neustadt', 'Nonntal', 'Maxglan', 'Parsch'],
          coordinates: { lat: 47.8095, lng: 13.0550 },
        },
        {
          name: 'Innsbruck',
          neighborhoods: ['Altstadt', 'St. Nikolaus', 'Wilten', 'Pradl'],
          coordinates: { lat: 47.2692, lng: 11.4041 },
        },
      ]
    },
    'Croatia': {
      cities: [
        {
          name: 'Dubrovnik',
          neighborhoods: ['Old Town', 'Ploce', 'Lapad', 'Gruz', 'Babin Kuk'],
          coordinates: { lat: 42.6507, lng: 18.0944 },
          popular: true
        },
        {
          name: 'Split',
          neighborhoods: ['Diocletian\'s Palace', 'Bacvice', 'Manus', 'Meje', 'Varos'],
          coordinates: { lat: 43.5081, lng: 16.4402 },
          popular: true
        },
        {
          name: 'Hvar',
          neighborhoods: ['Hvar Town', 'Stari Grad', 'Jelsa', 'Vrboska'],
          coordinates: { lat: 43.1729, lng: 16.4411 },
          popular: true
        },
        {
          name: 'Zagreb',
          neighborhoods: ['Upper Town', 'Lower Town', 'Tkalciceva', 'Maksimir', 'Tresnjevka'],
          coordinates: { lat: 45.8150, lng: 15.9819 },
        },
        {
          name: 'Rovinj',
          neighborhoods: ['Old Town', 'Lone Bay', 'Monsena', 'Valalta'],
          coordinates: { lat: 45.0811, lng: 13.6387 },
        },
        {
          name: 'Plitvice Lakes',
          neighborhoods: ['Entrance 1', 'Entrance 2', 'Korana Village', 'Jezerce'],
          coordinates: { lat: 44.8654, lng: 15.5820 },
        },
      ]
    },
    'Czech Republic': {
      cities: [
        {
          name: 'Prague',
          neighborhoods: ['Old Town', 'Mala Strana', 'Vinohrady', 'Zizkov', 'Holesovice', 'Karlin', 'Smichov', 'Josefov'],
          coordinates: { lat: 50.0755, lng: 14.4378 },
          popular: true
        },
        {
          name: 'Cesky Krumlov',
          neighborhoods: ['Old Town', 'Latran', 'Castle Area'],
          coordinates: { lat: 48.8127, lng: 14.3175 },
        },
      ]
    },
    'Hungary': {
      cities: [
        {
          name: 'Budapest',
          neighborhoods: ['District V', 'District VII', 'Buda Castle', 'Andrassy', 'Erzsebetvaros', 'Ujlipotvaros', 'Vizafogo'],
          coordinates: { lat: 47.4979, lng: 19.0402 },
          popular: true
        },
      ]
    },
    'Poland': {
      cities: [
        {
          name: 'Krakow',
          neighborhoods: ['Old Town', 'Kazimierz', 'Podgorze', 'Zwierzyniec', 'Nowa Huta'],
          coordinates: { lat: 50.0647, lng: 19.9450 },
          popular: true
        },
        {
          name: 'Warsaw',
          neighborhoods: ['Old Town', 'Praga', 'Mokotow', 'Srodmiescie', 'Wola', 'Zoliborz'],
          coordinates: { lat: 52.2297, lng: 21.0122 },
        },
        {
          name: 'Gdansk',
          neighborhoods: ['Old Town', 'Wrzeszcz', 'Sopot', 'Oliwa', 'Przymorze'],
          coordinates: { lat: 54.3520, lng: 18.6466 },
        },
      ]
    },
    'Ireland': {
      cities: [
        {
          name: 'Dublin',
          neighborhoods: ['Temple Bar', 'Grafton Street', 'St Stephen\'s Green', 'Portobello', 'Ranelagh', 'Smithfield', 'Ballsbridge'],
          coordinates: { lat: 53.3498, lng: -6.2603 },
          popular: true
        },
        {
          name: 'Galway',
          neighborhoods: ['Latin Quarter', 'Salthill', 'Claddagh', 'West End', 'Eyre Square'],
          coordinates: { lat: 53.2707, lng: -9.0568 },
        },
        {
          name: 'Cork',
          neighborhoods: ['City Centre', 'Douglas', 'Cobh', 'Kinsale', 'Blarney'],
          coordinates: { lat: 51.8969, lng: -8.4863 },
        },
      ]
    },
    'Belgium': {
      cities: [
        {
          name: 'Brussels',
          neighborhoods: ['Grand Place', 'Ixelles', 'Saint-Gilles', 'Schaerbeek', 'Sablon', 'European Quarter'],
          coordinates: { lat: 50.8503, lng: 4.3517 },
        },
        {
          name: 'Bruges',
          neighborhoods: ['Markt', 'Burg', 'Sint-Anna', 'Langestraat'],
          coordinates: { lat: 51.2093, lng: 3.2247 },
          popular: true
        },
        {
          name: 'Ghent',
          neighborhoods: ['Old Town', 'Patershol', 'Sint-Pietersnieuwstraat', 'Coupure'],
          coordinates: { lat: 51.0543, lng: 3.7174 },
        },
        {
          name: 'Antwerp',
          neighborhoods: ['Old Town', 'Het Zuid', 'Eilandje', 'Zurenborg'],
          coordinates: { lat: 51.2194, lng: 4.4025 },
        },
      ]
    },
    'Denmark': {
      cities: [
        {
          name: 'Copenhagen',
          neighborhoods: ['Nyhavn', 'Vesterbro', 'Norrebro', 'Frederiksberg', 'Christianshavn', 'Osterbro', 'Islands Brygge'],
          coordinates: { lat: 55.6761, lng: 12.5683 },
          popular: true
        },
      ]
    },
    'Sweden': {
      cities: [
        {
          name: 'Stockholm',
          neighborhoods: ['Gamla Stan', 'Sodermalm', 'Ostermalm', 'Vasastan', 'Kungsholmen', 'Djurgarden'],
          coordinates: { lat: 59.3293, lng: 18.0686 },
          popular: true
        },
        {
          name: 'Gothenburg',
          neighborhoods: ['Haga', 'Linne', 'Vasastan', 'Majorna', 'Masthuggstorget'],
          coordinates: { lat: 57.7089, lng: 11.9746 },
        },
      ]
    },
    'Norway': {
      cities: [
        {
          name: 'Oslo',
          neighborhoods: ['Sentrum', 'Grunerlokka', 'Majorstuen', 'Frogner', 'St. Hanshaugen', 'Aker Brygge'],
          coordinates: { lat: 59.9139, lng: 10.7522 },
        },
        {
          name: 'Bergen',
          neighborhoods: ['Bryggen', 'Sentrum', 'Nordnes', 'Floyen', 'Sandviken'],
          coordinates: { lat: 60.3913, lng: 5.3221 },
        },
        {
          name: 'Tromso',
          neighborhoods: ['Sentrum', 'Strandtorget', 'Fagereng', 'Tomasjord'],
          coordinates: { lat: 69.6492, lng: 18.9553 },
        },
      ]
    },
    'Finland': {
      cities: [
        {
          name: 'Helsinki',
          neighborhoods: ['Kamppi', 'Kallio', 'Punavuori', 'Ullanlinna', 'Kruununhaka', 'Toolo'],
          coordinates: { lat: 60.1699, lng: 24.9384 },
        },
        {
          name: 'Lapland',
          neighborhoods: ['Rovaniemi', 'Levi', 'Saariselka', 'Yllas', 'Luosto'],
          coordinates: { lat: 66.5039, lng: 25.7294 },
        },
      ]
    },
    'Iceland': {
      cities: [
        {
          name: 'Reykjavik',
          neighborhoods: ['Downtown', 'Old Harbour', 'Laugavegur', 'Grandi', 'Hlemmur', 'Vesturbær'],
          coordinates: { lat: 64.1466, lng: -21.9426 },
          popular: true
        },
        {
          name: 'Blue Lagoon Area',
          neighborhoods: ['Grindavik', 'Keflavik', 'Vogar'],
          coordinates: { lat: 63.8804, lng: -22.4495 },
        },
      ]
    },
    'Turkey': {
      cities: [
        {
          name: 'Istanbul',
          neighborhoods: ['Sultanahmet', 'Beyoglu', 'Kadikoy', 'Besiktas', 'Nisantasi', 'Galata', 'Karakoy', 'Taksim', 'Ortakoy'],
          coordinates: { lat: 41.0082, lng: 28.9784 },
          popular: true
        },
        {
          name: 'Cappadocia',
          neighborhoods: ['Goreme', 'Uchisar', 'Urgup', 'Avanos', 'Nevsehir'],
          coordinates: { lat: 38.6431, lng: 34.8289 },
          popular: true
        },
        {
          name: 'Bodrum',
          neighborhoods: ['Bodrum Centre', 'Yalikavak', 'Turkbuku', 'Gumusluk', 'Bitez'],
          coordinates: { lat: 37.0343, lng: 27.4305 },
          popular: true
        },
        {
          name: 'Antalya',
          neighborhoods: ['Kaleici', 'Konyaalti', 'Lara', 'Belek', 'Side', 'Kemer'],
          coordinates: { lat: 36.8969, lng: 30.7133 },
        },
        {
          name: 'Fethiye',
          neighborhoods: ['Old Town', 'Calis Beach', 'Oludeniz', 'Hisaronu', 'Kayakoy'],
          coordinates: { lat: 36.6520, lng: 29.1269 },
        },
      ]
    },
    'Montenegro': {
      cities: [
        {
          name: 'Kotor',
          neighborhoods: ['Old Town', 'Dobrota', 'Prcanj', 'Perast'],
          coordinates: { lat: 42.4247, lng: 18.7712 },
          popular: true
        },
        {
          name: 'Budva',
          neighborhoods: ['Old Town', 'Becici', 'Sveti Stefan', 'Rafailovici'],
          coordinates: { lat: 42.2911, lng: 18.8403 },
        },
      ]
    },
    'Slovenia': {
      cities: [
        {
          name: 'Ljubljana',
          neighborhoods: ['Old Town', 'Metelkova', 'Trnovo', 'Rozna Dolina'],
          coordinates: { lat: 46.0569, lng: 14.5058 },
        },
        {
          name: 'Lake Bled',
          neighborhoods: ['Bled Village', 'Mlino', 'Bohinjska Bela'],
          coordinates: { lat: 46.3684, lng: 14.1146 },
          popular: true
        },
      ]
    },
    'Cyprus': {
      cities: [
        {
          name: 'Paphos',
          neighborhoods: ['Kato Paphos', 'Peyia', 'Coral Bay', 'Tala', 'Aphrodite Hills'],
          coordinates: { lat: 34.7754, lng: 32.4245 },
        },
        {
          name: 'Limassol',
          neighborhoods: ['Old Town', 'Marina', 'Tourist Area', 'Potamos Germasogeia'],
          coordinates: { lat: 34.6841, lng: 33.0379 },
        },
        {
          name: 'Ayia Napa',
          neighborhoods: ['Centre', 'Nissi Beach', 'Protaras', 'Paralimni'],
          coordinates: { lat: 34.9885, lng: 34.0009 },
        },
      ]
    },
    'Malta': {
      cities: [
        {
          name: 'Valletta',
          neighborhoods: ['City Centre', 'Barrakka', 'Floriana', 'Sliema', 'St. Julian\'s', 'Paceville'],
          coordinates: { lat: 35.8989, lng: 14.5146 },
          popular: true
        },
        {
          name: 'Gozo',
          neighborhoods: ['Victoria', 'Xlendi', 'Marsalforn', 'San Lawrenz', 'Dwejra'],
          coordinates: { lat: 36.0440, lng: 14.2514 },
        },
      ]
    },
  },
  'Asia Pacific': {
    'Indonesia': {
      cities: [
        {
          name: 'Bali',
          neighborhoods: ['Seminyak', 'Canggu', 'Ubud', 'Kuta', 'Sanur', 'Uluwatu', 'Jimbaran', 'Nusa Dua', 'Legian', 'Denpasar', 'Amed', 'Lovina', 'Padang Padang', 'Bingin', 'Pererenan', 'Kerobokan', 'Echo Beach'],
          coordinates: { lat: -8.4095, lng: 115.1889 },
          popular: true
        },
        {
          name: 'Gili Islands',
          neighborhoods: ['Gili Trawangan', 'Gili Air', 'Gili Meno'],
          coordinates: { lat: -8.3508, lng: 116.0457 },
          popular: true
        },
        {
          name: 'Lombok',
          neighborhoods: ['Senggigi', 'Kuta Lombok', 'Mataram', 'Mandalika'],
          coordinates: { lat: -8.6500, lng: 116.3249 },
        },
        {
          name: 'Jakarta',
          neighborhoods: ['Menteng', 'Kemang', 'SCBD', 'Senopati', 'Kota Tua', 'Ancol', 'PIK'],
          coordinates: { lat: -6.2088, lng: 106.8456 },
        },
        {
          name: 'Nusa Penida',
          neighborhoods: ['Crystal Bay', 'Kelingking Beach', 'Angel\'s Billabong', 'Broken Beach'],
          coordinates: { lat: -8.7275, lng: 115.5440 },
        },
      ]
    },
    'Thailand': {
      cities: [
        {
          name: 'Bangkok',
          neighborhoods: ['Sukhumvit', 'Silom', 'Sathorn', 'Thonglor', 'Ekkamai', 'Khaosan', 'Chinatown', 'Riverside', 'Ari', 'Ratchada'],
          coordinates: { lat: 13.7563, lng: 100.5018 },
          popular: true
        },
        {
          name: 'Phuket',
          neighborhoods: ['Patong', 'Kata', 'Karon', 'Kamala', 'Surin', 'Bang Tao', 'Rawai', 'Chalong', 'Old Phuket Town', 'Mai Khao'],
          coordinates: { lat: 7.9519, lng: 98.3381 },
          popular: true
        },
        {
          name: 'Koh Samui',
          neighborhoods: ['Chaweng', 'Lamai', 'Bophut', 'Maenam', 'Choeng Mon', 'Fisherman\'s Village'],
          coordinates: { lat: 9.5120, lng: 100.0136 },
          popular: true
        },
        {
          name: 'Chiang Mai',
          neighborhoods: ['Old City', 'Nimman', 'Santitham', 'Night Bazaar', 'Riverside', 'Hang Dong'],
          coordinates: { lat: 18.7883, lng: 98.9853 },
          popular: true
        },
        {
          name: 'Krabi',
          neighborhoods: ['Ao Nang', 'Railay Beach', 'Krabi Town', 'Klong Muang', 'Tubkaek'],
          coordinates: { lat: 8.0863, lng: 98.9063 },
        },
        {
          name: 'Koh Phangan',
          neighborhoods: ['Haad Rin', 'Thong Sala', 'Srithanu', 'Baan Tai', 'Chaloklum'],
          coordinates: { lat: 9.7474, lng: 100.0279 },
        },
        {
          name: 'Koh Tao',
          neighborhoods: ['Sairee', 'Mae Haad', 'Chalok Baan Kao', 'Tanote Bay'],
          coordinates: { lat: 10.0956, lng: 99.8377 },
        },
        {
          name: 'Koh Lipe',
          neighborhoods: ['Walking Street', 'Sunrise Beach', 'Sunset Beach', 'Pattaya Beach'],
          coordinates: { lat: 6.4868, lng: 99.3027 },
        },
        {
          name: 'Pai',
          neighborhoods: ['Walking Street', 'Pai Canyon', 'Pai Hot Springs'],
          coordinates: { lat: 19.3597, lng: 98.4367 },
        },
      ]
    },
    'Vietnam': {
      cities: [
        {
          name: 'Ho Chi Minh City',
          neighborhoods: ['District 1', 'District 2', 'District 3', 'District 7', 'Binh Thanh', 'Phu Nhuan', 'Thu Duc'],
          coordinates: { lat: 10.8231, lng: 106.6297 },
          popular: true
        },
        {
          name: 'Hanoi',
          neighborhoods: ['Old Quarter', 'Hoan Kiem', 'Tay Ho', 'Ba Dinh', 'Dong Da', 'French Quarter'],
          coordinates: { lat: 21.0285, lng: 105.8542 },
          popular: true
        },
        {
          name: 'Da Nang',
          neighborhoods: ['My Khe Beach', 'An Thuong', 'Son Tra', 'Hai Chau', 'Marble Mountains'],
          coordinates: { lat: 16.0544, lng: 108.2022 },
          popular: true
        },
        {
          name: 'Hoi An',
          neighborhoods: ['Old Town', 'An Bang', 'Cua Dai', 'Cam Thanh'],
          coordinates: { lat: 15.8801, lng: 108.3380 },
          popular: true
        },
        {
          name: 'Nha Trang',
          neighborhoods: ['Beach Area', 'Old Town', 'Hon Chong', 'Vinh Hai'],
          coordinates: { lat: 12.2388, lng: 109.1967 },
        },
        {
          name: 'Phu Quoc',
          neighborhoods: ['Duong Dong', 'Long Beach', 'Ong Lang', 'Bai Sao', 'An Thoi'],
          coordinates: { lat: 10.2899, lng: 103.9840 },
        },
      ]
    },
    'Japan': {
      cities: [
        {
          name: 'Tokyo',
          neighborhoods: ['Shibuya', 'Shinjuku', 'Ginza', 'Roppongi', 'Harajuku', 'Asakusa', 'Akihabara', 'Meguro', 'Nakameguro', 'Daikanyama', 'Ebisu', 'Shimokitazawa'],
          coordinates: { lat: 35.6762, lng: 139.6503 },
          popular: true
        },
        {
          name: 'Kyoto',
          neighborhoods: ['Gion', 'Higashiyama', 'Arashiyama', 'Downtown', 'Fushimi', 'Kiyomizu', 'Nishiki Market'],
          coordinates: { lat: 35.0116, lng: 135.7681 },
          popular: true
        },
        {
          name: 'Osaka',
          neighborhoods: ['Namba', 'Shinsaibashi', 'Umeda', 'Dotonbori', 'Shinsekai', 'Amerika-mura', 'Tennoji'],
          coordinates: { lat: 34.6937, lng: 135.5023 },
          popular: true
        },
        {
          name: 'Okinawa',
          neighborhoods: ['Naha', 'Chatan', 'Onna', 'Nago', 'Ishigaki', 'Miyako', 'Kerama Islands'],
          coordinates: { lat: 26.2124, lng: 127.6809 },
          popular: true
        },
        {
          name: 'Hakone',
          neighborhoods: ['Gora', 'Sounzan', 'Yumoto', 'Ashi Lake'],
          coordinates: { lat: 35.2323, lng: 139.1070 },
        },
        {
          name: 'Niseko',
          neighborhoods: ['Hirafu', 'Niseko Village', 'Annupuri', 'Hanazono'],
          coordinates: { lat: 42.8048, lng: 140.6874 },
        },
      ]
    },
    'Philippines': {
      cities: [
        {
          name: 'Manila',
          neighborhoods: ['Makati', 'BGC', 'Poblacion', 'Intramuros', 'Malate', 'Ermita', 'Ortigas'],
          coordinates: { lat: 14.5995, lng: 120.9842 },
        },
        {
          name: 'Boracay',
          neighborhoods: ['Station 1', 'Station 2', 'Station 3', 'Bulabog', 'Diniwid'],
          coordinates: { lat: 11.9674, lng: 121.9248 },
          popular: true
        },
        {
          name: 'Palawan',
          neighborhoods: ['El Nido', 'Puerto Princesa', 'Coron', 'Port Barton', 'San Vicente'],
          coordinates: { lat: 9.8349, lng: 118.7384 },
          popular: true
        },
        {
          name: 'Cebu',
          neighborhoods: ['Cebu City', 'Mactan', 'Moalboal', 'Oslob', 'Malapascua'],
          coordinates: { lat: 10.3157, lng: 123.8854 },
        },
        {
          name: 'Siargao',
          neighborhoods: ['General Luna', 'Cloud 9', 'Pacifico', 'Del Carmen'],
          coordinates: { lat: 9.8482, lng: 126.0458 },
          popular: true
        },
      ]
    },
    'Singapore': {
      cities: [
        {
          name: 'Singapore',
          neighborhoods: ['Marina Bay', 'Orchard', 'Chinatown', 'Little India', 'Bugis', 'Clarke Quay', 'Tiong Bahru', 'Sentosa', 'Holland Village', 'Kampong Glam', 'East Coast'],
          coordinates: { lat: 1.3521, lng: 103.8198 },
          popular: true
        },
      ]
    },
    'Malaysia': {
      cities: [
        {
          name: 'Kuala Lumpur',
          neighborhoods: ['KLCC', 'Bukit Bintang', 'Bangsar', 'Mont Kiara', 'Petaling Street', 'Brickfields', 'Damansara'],
          coordinates: { lat: 3.1390, lng: 101.6869 },
          popular: true
        },
        {
          name: 'Langkawi',
          neighborhoods: ['Pantai Cenang', 'Kuah', 'Pantai Tengah', 'Datai Bay', 'Tanjung Rhu'],
          coordinates: { lat: 6.3500, lng: 99.8000 },
          popular: true
        },
        {
          name: 'Penang',
          neighborhoods: ['George Town', 'Batu Ferringhi', 'Gurney Drive', 'Tanjung Bungah', 'Pulau Tikus'],
          coordinates: { lat: 5.4164, lng: 100.3327 },
        },
      ]
    },
    'Sri Lanka': {
      cities: [
        {
          name: 'Colombo',
          neighborhoods: ['Fort', 'Pettah', 'Kollupitiya', 'Bambalapitiya', 'Mount Lavinia'],
          coordinates: { lat: 6.9271, lng: 79.8612 },
        },
        {
          name: 'Galle',
          neighborhoods: ['Galle Fort', 'Unawatuna', 'Ahangama', 'Koggala', 'Weligama'],
          coordinates: { lat: 6.0535, lng: 80.2210 },
          popular: true
        },
        {
          name: 'Mirissa',
          neighborhoods: ['Mirissa Beach', 'Secret Beach', 'Coconut Tree Hill'],
          coordinates: { lat: 5.9483, lng: 80.4716 },
        },
        {
          name: 'Ella',
          neighborhoods: ['Ella Town', 'Nine Arch Bridge', 'Little Adam\'s Peak'],
          coordinates: { lat: 6.8667, lng: 81.0466 },
        },
      ]
    },
    'Maldives': {
      cities: [
        {
          name: 'Male',
          neighborhoods: ['Male City', 'Hulhumale', 'Velana Airport Area'],
          coordinates: { lat: 4.1755, lng: 73.5093 },
          popular: true
        },
        {
          name: 'South Male Atoll',
          neighborhoods: ['Maafushi', 'Gulhi', 'Guraidhoo'],
          coordinates: { lat: 3.9000, lng: 73.5000 },
        },
        {
          name: 'North Male Atoll',
          neighborhoods: ['Thulusdhoo', 'Huraa', 'Himmafushi'],
          coordinates: { lat: 4.4000, lng: 73.5000 },
        },
        {
          name: 'Baa Atoll',
          neighborhoods: ['Dharavandhoo', 'Hanifaru Bay'],
          coordinates: { lat: 5.0000, lng: 72.9500 },
        },
      ]
    },
    'Australia': {
      cities: [
        {
          name: 'Sydney',
          neighborhoods: ['CBD', 'Bondi', 'Surry Hills', 'Darlinghurst', 'Newtown', 'Manly', 'Paddington', 'Potts Point', 'The Rocks', 'Coogee', 'Bronte'],
          coordinates: { lat: -33.8688, lng: 151.2093 },
          popular: true
        },
        {
          name: 'Melbourne',
          neighborhoods: ['CBD', 'Fitzroy', 'St Kilda', 'South Yarra', 'Richmond', 'Carlton', 'Brunswick', 'Collingwood', 'Prahran', 'Windsor'],
          coordinates: { lat: -37.8136, lng: 144.9631 },
          popular: true
        },
        {
          name: 'Gold Coast',
          neighborhoods: ['Surfers Paradise', 'Broadbeach', 'Burleigh Heads', 'Coolangatta', 'Main Beach', 'Southport'],
          coordinates: { lat: -28.0167, lng: 153.4000 },
          popular: true
        },
        {
          name: 'Byron Bay',
          neighborhoods: ['Town Centre', 'Wategos Beach', 'Suffolk Park', 'Bangalow', 'Brunswick Heads'],
          coordinates: { lat: -28.6474, lng: 153.6020 },
          popular: true
        },
        {
          name: 'Cairns',
          neighborhoods: ['CBD', 'Trinity Beach', 'Palm Cove', 'Port Douglas', 'Mission Beach'],
          coordinates: { lat: -16.9186, lng: 145.7781 },
        },
        {
          name: 'Brisbane',
          neighborhoods: ['CBD', 'South Bank', 'Fortitude Valley', 'West End', 'New Farm', 'Paddington'],
          coordinates: { lat: -27.4698, lng: 153.0251 },
        },
        {
          name: 'Perth',
          neighborhoods: ['CBD', 'Fremantle', 'Northbridge', 'Subiaco', 'Cottesloe', 'Leederville'],
          coordinates: { lat: -31.9505, lng: 115.8605 },
        },
      ]
    },
    'New Zealand': {
      cities: [
        {
          name: 'Auckland',
          neighborhoods: ['CBD', 'Ponsonby', 'Parnell', 'Newmarket', 'Devonport', 'Wynyard Quarter', 'Grey Lynn'],
          coordinates: { lat: -36.8485, lng: 174.7633 },
          popular: true
        },
        {
          name: 'Queenstown',
          neighborhoods: ['Town Centre', 'Frankton', 'Arrowtown', 'Fernhill', 'Kelvin Heights'],
          coordinates: { lat: -45.0312, lng: 168.6626 },
          popular: true
        },
        {
          name: 'Wellington',
          neighborhoods: ['CBD', 'Te Aro', 'Cuba Street', 'Mount Victoria', 'Thorndon'],
          coordinates: { lat: -41.2865, lng: 174.7762 },
        },
        {
          name: 'Rotorua',
          neighborhoods: ['City Centre', 'Ohinemutu', 'Whakarewarewa', 'Fairy Springs'],
          coordinates: { lat: -38.1368, lng: 176.2497 },
        },
      ]
    },
    'Fiji': {
      cities: [
        {
          name: 'Fiji Islands',
          neighborhoods: ['Nadi', 'Denarau', 'Coral Coast', 'Suva', 'Mamanuca Islands', 'Yasawa Islands', 'Taveuni'],
          coordinates: { lat: -17.7134, lng: 178.0650 },
          popular: true
        },
      ]
    },
  },
  'Caribbean': {
    'Bahamas': {
      cities: [
        {
          name: 'Nassau',
          neighborhoods: ['Paradise Island', 'Cable Beach', 'Downtown', 'Atlantis', 'Baha Mar'],
          coordinates: { lat: 25.0343, lng: -77.3963 },
          popular: true
        },
        {
          name: 'Exumas',
          neighborhoods: ['Great Exuma', 'Staniel Cay', 'Compass Cay', 'Big Major Cay'],
          coordinates: { lat: 23.5000, lng: -75.7667 },
          popular: true
        },
        {
          name: 'Harbour Island',
          neighborhoods: ['Dunmore Town', 'Pink Sands Beach', 'Briland'],
          coordinates: { lat: 25.5000, lng: -76.6333 },
        },
      ]
    },
    'Jamaica': {
      cities: [
        {
          name: 'Montego Bay',
          neighborhoods: ['Hip Strip', 'Rose Hall', 'Ironshore', 'Doctor\'s Cave'],
          coordinates: { lat: 18.4762, lng: -77.8939 },
          popular: true
        },
        {
          name: 'Negril',
          neighborhoods: ['Seven Mile Beach', 'West End', 'Bloody Bay'],
          coordinates: { lat: 18.2683, lng: -78.3496 },
          popular: true
        },
        {
          name: 'Ocho Rios',
          neighborhoods: ['Main Street', 'Turtle Beach', 'Dolphin Cove'],
          coordinates: { lat: 18.4074, lng: -77.1025 },
        },
      ]
    },
    'Dominican Republic': {
      cities: [
        {
          name: 'Punta Cana',
          neighborhoods: ['Bavaro', 'Cap Cana', 'Uvero Alto', 'Macao'],
          coordinates: { lat: 18.5601, lng: -68.3725 },
          popular: true
        },
        {
          name: 'Santo Domingo',
          neighborhoods: ['Zona Colonial', 'Piantini', 'Naco', 'Gazcue', 'Malecon'],
          coordinates: { lat: 18.4861, lng: -69.9312 },
        },
        {
          name: 'Puerto Plata',
          neighborhoods: ['Playa Dorada', 'Sosua', 'Cabarete'],
          coordinates: { lat: 19.7934, lng: -70.6884 },
        },
        {
          name: 'Las Terrenas',
          neighborhoods: ['Pueblo de los Pescadores', 'Playa Bonita', 'El Portillo'],
          coordinates: { lat: 19.3098, lng: -69.5429 },
        },
      ]
    },
    'Puerto Rico': {
      cities: [
        {
          name: 'San Juan',
          neighborhoods: ['Old San Juan', 'Condado', 'Santurce', 'Isla Verde', 'Ocean Park', 'Miramar'],
          coordinates: { lat: 18.4655, lng: -66.1057 },
          popular: true
        },
        {
          name: 'Vieques',
          neighborhoods: ['Esperanza', 'Isabel Segunda', 'Mosquito Bay'],
          coordinates: { lat: 18.1263, lng: -65.4400 },
        },
        {
          name: 'Culebra',
          neighborhoods: ['Dewey', 'Flamenco Beach', 'Tamarindo'],
          coordinates: { lat: 18.3108, lng: -65.3028 },
        },
        {
          name: 'Rincon',
          neighborhoods: ['Puntas', 'Barrio Pueblo', 'Almirante', 'Ensenada'],
          coordinates: { lat: 18.3401, lng: -67.2500 },
        },
      ]
    },
    'US Virgin Islands': {
      cities: [
        {
          name: 'St. Thomas',
          neighborhoods: ['Charlotte Amalie', 'Red Hook', 'Magens Bay', 'Havensight'],
          coordinates: { lat: 18.3358, lng: -64.8963 },
          popular: true
        },
        {
          name: 'St. John',
          neighborhoods: ['Cruz Bay', 'Coral Bay', 'Trunk Bay', 'Cinnamon Bay'],
          coordinates: { lat: 18.3358, lng: -64.7281 },
        },
        {
          name: 'St. Croix',
          neighborhoods: ['Christiansted', 'Frederiksted', 'Cane Bay', 'Buccaneer'],
          coordinates: { lat: 17.7290, lng: -64.7345 },
        },
      ]
    },
    'British Virgin Islands': {
      cities: [
        {
          name: 'Tortola',
          neighborhoods: ['Road Town', 'Cane Garden Bay', 'West End', 'East End'],
          coordinates: { lat: 18.4207, lng: -64.6400 },
        },
        {
          name: 'Virgin Gorda',
          neighborhoods: ['Spanish Town', 'The Baths', 'North Sound'],
          coordinates: { lat: 18.4816, lng: -64.3950 },
        },
      ]
    },
    'Turks and Caicos': {
      cities: [
        {
          name: 'Providenciales',
          neighborhoods: ['Grace Bay', 'Turtle Cove', 'Long Bay', 'Chalk Sound', 'Leeward'],
          coordinates: { lat: 21.7969, lng: -72.1665 },
          popular: true
        },
      ]
    },
    'Aruba': {
      cities: [
        {
          name: 'Aruba',
          neighborhoods: ['Palm Beach', 'Eagle Beach', 'Oranjestad', 'Noord', 'San Nicolas'],
          coordinates: { lat: 12.5211, lng: -69.9683 },
          popular: true
        },
      ]
    },
    'Cayman Islands': {
      cities: [
        {
          name: 'Grand Cayman',
          neighborhoods: ['George Town', 'Seven Mile Beach', 'West Bay', 'Rum Point', 'East End'],
          coordinates: { lat: 19.3133, lng: -81.2546 },
          popular: true
        },
      ]
    },
    'Barbados': {
      cities: [
        {
          name: 'Barbados',
          neighborhoods: ['Bridgetown', 'St. Lawrence Gap', 'Holetown', 'Speightstown', 'Oistins', 'Bathsheba'],
          coordinates: { lat: 13.1939, lng: -59.5432 },
          popular: true
        },
      ]
    },
    'St. Lucia': {
      cities: [
        {
          name: 'St. Lucia',
          neighborhoods: ['Castries', 'Rodney Bay', 'Soufriere', 'Marigot Bay', 'Gros Islet'],
          coordinates: { lat: 13.9094, lng: -60.9789 },
          popular: true
        },
      ]
    },
    'Antigua': {
      cities: [
        {
          name: 'Antigua',
          neighborhoods: ['St. John\'s', 'English Harbour', 'Jolly Harbour', 'Dickenson Bay', 'Falmouth'],
          coordinates: { lat: 17.0608, lng: -61.7964 },
        },
      ]
    },
    'St. Barts': {
      cities: [
        {
          name: 'St. Barthelemy',
          neighborhoods: ['Gustavia', 'St. Jean', 'Flamands', 'Lorient', 'Grand Cul-de-Sac', 'Colombier'],
          coordinates: { lat: 17.9000, lng: -62.8333 },
          popular: true
        },
      ]
    },
    'Curacao': {
      cities: [
        {
          name: 'Curacao',
          neighborhoods: ['Willemstad', 'Punda', 'Otrobanda', 'Pietermaai', 'Jan Thiel', 'Westpunt'],
          coordinates: { lat: 12.1696, lng: -68.9900 },
        },
      ]
    },
  },
  'Central & South America': {
    'Costa Rica': {
      cities: [
        {
          name: 'San Jose',
          neighborhoods: ['Escazu', 'Santa Ana', 'Rohrmoser', 'La Sabana', 'Barrio Amon'],
          coordinates: { lat: 9.9281, lng: -84.0907 },
        },
        {
          name: 'Guanacaste',
          neighborhoods: ['Tamarindo', 'Playa Flamingo', 'Papagayo', 'Nosara', 'Samara', 'Playa Conchal'],
          coordinates: { lat: 10.6272, lng: -85.4437 },
          popular: true
        },
        {
          name: 'Manuel Antonio',
          neighborhoods: ['Quepos', 'Manuel Antonio Beach', 'Dominical'],
          coordinates: { lat: 9.3924, lng: -84.1365 },
          popular: true
        },
        {
          name: 'Arenal',
          neighborhoods: ['La Fortuna', 'Arenal Volcano', 'Lake Arenal'],
          coordinates: { lat: 10.4626, lng: -84.7033 },
        },
        {
          name: 'Puerto Viejo',
          neighborhoods: ['Playa Cocles', 'Punta Uva', 'Manzanillo', 'Cahuita'],
          coordinates: { lat: 9.6549, lng: -82.7539 },
        },
        {
          name: 'Santa Teresa',
          neighborhoods: ['Mal Pais', 'Carmen', 'Playa Hermosa', 'Montezuma'],
          coordinates: { lat: 9.6474, lng: -85.1685 },
          popular: true
        },
      ]
    },
    'Panama': {
      cities: [
        {
          name: 'Panama City',
          neighborhoods: ['Casco Viejo', 'Punta Pacifica', 'Obarrio', 'Costa del Este', 'San Francisco', 'El Cangrejo'],
          coordinates: { lat: 8.9824, lng: -79.5199 },
          popular: true
        },
        {
          name: 'Bocas del Toro',
          neighborhoods: ['Bocas Town', 'Red Frog Beach', 'Bastimentos', 'Zapatilla', 'Starfish Beach'],
          coordinates: { lat: 9.3404, lng: -82.2419 },
          popular: true
        },
        {
          name: 'San Blas Islands',
          neighborhoods: ['Guna Yala', 'El Porvenir', 'Chichime', 'Isla Perro'],
          coordinates: { lat: 9.5600, lng: -78.8300 },
        },
      ]
    },
    'Colombia': {
      cities: [
        {
          name: 'Cartagena',
          neighborhoods: ['Old Town', 'Getsemani', 'Bocagrande', 'Castillogrande', 'Manga', 'San Diego'],
          coordinates: { lat: 10.3910, lng: -75.4794 },
          popular: true
        },
        {
          name: 'Medellin',
          neighborhoods: ['El Poblado', 'Laureles', 'Envigado', 'La Candelaria', 'Belen', 'Sabaneta'],
          coordinates: { lat: 6.2442, lng: -75.5812 },
          popular: true
        },
        {
          name: 'Bogota',
          neighborhoods: ['La Candelaria', 'Chapinero', 'Zona Rosa', 'Usaquen', 'Teusaquillo', 'Parque 93'],
          coordinates: { lat: 4.7110, lng: -74.0721 },
        },
        {
          name: 'Santa Marta',
          neighborhoods: ['Centro Historico', 'Rodadero', 'Taganga', 'Bonda', 'Minca'],
          coordinates: { lat: 11.2408, lng: -74.1990 },
        },
      ]
    },
    'Brazil': {
      cities: [
        {
          name: 'Rio de Janeiro',
          neighborhoods: ['Copacabana', 'Ipanema', 'Leblon', 'Botafogo', 'Lapa', 'Santa Teresa', 'Urca', 'Barra da Tijuca', 'Flamengo'],
          coordinates: { lat: -22.9068, lng: -43.1729 },
          popular: true
        },
        {
          name: 'Sao Paulo',
          neighborhoods: ['Jardins', 'Vila Madalena', 'Pinheiros', 'Itaim Bibi', 'Moema', 'Higienopolis', 'Liberdade'],
          coordinates: { lat: -23.5505, lng: -46.6333 },
        },
        {
          name: 'Florianopolis',
          neighborhoods: ['Lagoa da Conceicao', 'Jurere', 'Campeche', 'Barra da Lagoa', 'Centro'],
          coordinates: { lat: -27.5954, lng: -48.5480 },
          popular: true
        },
        {
          name: 'Salvador',
          neighborhoods: ['Pelourinho', 'Barra', 'Rio Vermelho', 'Itapua', 'Ondina'],
          coordinates: { lat: -12.9714, lng: -38.5014 },
        },
        {
          name: 'Fernando de Noronha',
          neighborhoods: ['Vila dos Remedios', 'Boldro', 'Sancho Bay', 'Praia do Leao'],
          coordinates: { lat: -3.8576, lng: -32.4297 },
          popular: true
        },
      ]
    },
    'Argentina': {
      cities: [
        {
          name: 'Buenos Aires',
          neighborhoods: ['Palermo', 'San Telmo', 'Recoleta', 'La Boca', 'Puerto Madero', 'Belgrano', 'Microcentro', 'Villa Crespo', 'Nunez'],
          coordinates: { lat: -34.6037, lng: -58.3816 },
          popular: true
        },
        {
          name: 'Mendoza',
          neighborhoods: ['Centro', 'Chacras de Coria', 'Maipu', 'Lujan de Cuyo', 'Uco Valley'],
          coordinates: { lat: -32.8895, lng: -68.8458 },
        },
        {
          name: 'Bariloche',
          neighborhoods: ['Centro Civico', 'Llao Llao', 'Km', 'Cerro Catedral', 'Circuito Chico'],
          coordinates: { lat: -41.1335, lng: -71.3103 },
        },
      ]
    },
    'Peru': {
      cities: [
        {
          name: 'Lima',
          neighborhoods: ['Miraflores', 'Barranco', 'San Isidro', 'Centro Historico', 'La Molina', 'Surco'],
          coordinates: { lat: -12.0464, lng: -77.0428 },
          popular: true
        },
        {
          name: 'Cusco',
          neighborhoods: ['Centro Historico', 'San Blas', 'Plaza de Armas', 'San Cristobal', 'Sacred Valley'],
          coordinates: { lat: -13.5319, lng: -71.9675 },
          popular: true
        },
      ]
    },
    'Chile': {
      cities: [
        {
          name: 'Santiago',
          neighborhoods: ['Providencia', 'Las Condes', 'Bellavista', 'Lastarria', 'Vitacura', 'Nunoa'],
          coordinates: { lat: -33.4489, lng: -70.6693 },
        },
        {
          name: 'Valparaiso',
          neighborhoods: ['Cerro Alegre', 'Cerro Concepcion', 'El Plan', 'Cerro Polanco'],
          coordinates: { lat: -33.0472, lng: -71.6127 },
        },
      ]
    },
    'Ecuador': {
      cities: [
        {
          name: 'Galapagos Islands',
          neighborhoods: ['Santa Cruz', 'San Cristobal', 'Isabela', 'Puerto Ayora', 'Puerto Baquerizo'],
          coordinates: { lat: -0.9538, lng: -90.9656 },
          popular: true
        },
        {
          name: 'Quito',
          neighborhoods: ['La Mariscal', 'Centro Historico', 'La Floresta', 'Guapulo', 'Cumbaya'],
          coordinates: { lat: -0.1807, lng: -78.4678 },
        },
      ]
    },
    'Belize': {
      cities: [
        {
          name: 'Ambergris Caye',
          neighborhoods: ['San Pedro', 'Secret Beach', 'Boca del Rio', 'North Ambergris'],
          coordinates: { lat: 17.9226, lng: -87.9679 },
          popular: true
        },
        {
          name: 'Caye Caulker',
          neighborhoods: ['The Split', 'Front Street', 'Back Street'],
          coordinates: { lat: 17.7346, lng: -88.0252 },
        },
        {
          name: 'Placencia',
          neighborhoods: ['Placencia Village', 'Maya Beach', 'Seine Bight'],
          coordinates: { lat: 16.5142, lng: -88.3683 },
        },
      ]
    },
  },
  'Middle East & Africa': {
    'United Arab Emirates': {
      cities: [
        {
          name: 'Dubai',
          neighborhoods: ['Downtown', 'Dubai Marina', 'Palm Jumeirah', 'JBR', 'DIFC', 'Business Bay', 'Jumeirah', 'Deira', 'Al Barsha', 'City Walk'],
          coordinates: { lat: 25.2048, lng: 55.2708 },
          popular: true
        },
        {
          name: 'Abu Dhabi',
          neighborhoods: ['Corniche', 'Saadiyat Island', 'Yas Island', 'Al Maryah', 'Al Reem', 'Al Bateen'],
          coordinates: { lat: 24.4539, lng: 54.3773 },
          popular: true
        },
      ]
    },
    'Israel': {
      cities: [
        {
          name: 'Tel Aviv',
          neighborhoods: ['Neve Tzedek', 'Florentin', 'Rothschild', 'Old Jaffa', 'Dizengoff', 'Sarona', 'Ramat Aviv'],
          coordinates: { lat: 32.0853, lng: 34.7818 },
          popular: true
        },
        {
          name: 'Jerusalem',
          neighborhoods: ['Old City', 'German Colony', 'Mamilla', 'Rehavia', 'Ein Kerem', 'Nachlaot'],
          coordinates: { lat: 31.7683, lng: 35.2137 },
        },
        {
          name: 'Eilat',
          neighborhoods: ['North Beach', 'Coral Beach', 'Marina', 'City Centre'],
          coordinates: { lat: 29.5577, lng: 34.9519 },
        },
      ]
    },
    'Morocco': {
      cities: [
        {
          name: 'Marrakech',
          neighborhoods: ['Medina', 'Gueliz', 'Hivernage', 'Palmeraie', 'Mellah', 'Kasbah'],
          coordinates: { lat: 31.6295, lng: -7.9811 },
          popular: true
        },
        {
          name: 'Casablanca',
          neighborhoods: ['Corniche', 'Maarif', 'Gauthier', 'Anfa', 'Ain Diab'],
          coordinates: { lat: 33.5731, lng: -7.5898 },
        },
        {
          name: 'Essaouira',
          neighborhoods: ['Medina', 'Kasbah', 'Beach Area', 'Mellah'],
          coordinates: { lat: 31.5085, lng: -9.7595 },
        },
        {
          name: 'Chefchaouen',
          neighborhoods: ['Medina', 'Ras el-Ma', 'Plaza Uta el-Hammam'],
          coordinates: { lat: 35.1688, lng: -5.2636 },
        },
        {
          name: 'Fes',
          neighborhoods: ['Fes el-Bali', 'Fes el-Jdid', 'Ville Nouvelle'],
          coordinates: { lat: 34.0181, lng: -5.0078 },
        },
      ]
    },
    'South Africa': {
      cities: [
        {
          name: 'Cape Town',
          neighborhoods: ['Camps Bay', 'Clifton', 'Waterfront', 'Bo-Kaap', 'Green Point', 'Sea Point', 'Gardens', 'Constantia', 'Hout Bay'],
          coordinates: { lat: -33.9249, lng: 18.4241 },
          popular: true
        },
        {
          name: 'Johannesburg',
          neighborhoods: ['Sandton', 'Rosebank', 'Maboneng', 'Melville', 'Braamfontein', 'Parkhurst'],
          coordinates: { lat: -26.2041, lng: 28.0473 },
        },
        {
          name: 'Franschhoek',
          neighborhoods: ['Main Road', 'Wine Valley', 'La Motte'],
          coordinates: { lat: -33.9107, lng: 19.1204 },
        },
        {
          name: 'Stellenbosch',
          neighborhoods: ['Historic Centre', 'De Zalze', 'Paradyskloof', 'Die Boord'],
          coordinates: { lat: -33.9368, lng: 18.8602 },
        },
      ]
    },
    'Egypt': {
      cities: [
        {
          name: 'Cairo',
          neighborhoods: ['Zamalek', 'Garden City', 'Maadi', 'Heliopolis', 'Downtown', 'New Cairo', 'Giza'],
          coordinates: { lat: 30.0444, lng: 31.2357 },
        },
        {
          name: 'Sharm El Sheikh',
          neighborhoods: ['Naama Bay', 'Sharks Bay', 'Hadaba', 'Nabq', 'Old Market'],
          coordinates: { lat: 27.9158, lng: 34.3300 },
        },
        {
          name: 'Hurghada',
          neighborhoods: ['El Dahar', 'Sekalla', 'El Mamsha', 'El Gouna', 'Sahl Hasheesh'],
          coordinates: { lat: 27.2579, lng: 33.8116 },
        },
        {
          name: 'Luxor',
          neighborhoods: ['East Bank', 'West Bank', 'Karnak', 'Valley of the Kings'],
          coordinates: { lat: 25.6872, lng: 32.6396 },
        },
      ]
    },
    'Tanzania': {
      cities: [
        {
          name: 'Zanzibar',
          neighborhoods: ['Stone Town', 'Nungwi', 'Paje', 'Jambiani', 'Kendwa', 'Matemwe'],
          coordinates: { lat: -6.1659, lng: 39.2026 },
          popular: true
        },
      ]
    },
    'Mauritius': {
      cities: [
        {
          name: 'Mauritius',
          neighborhoods: ['Grand Baie', 'Flic en Flac', 'Port Louis', 'Tamarin', 'Blue Bay', 'Belle Mare', 'Le Morne'],
          coordinates: { lat: -20.3484, lng: 57.5522 },
          popular: true
        },
      ]
    },
    'Seychelles': {
      cities: [
        {
          name: 'Seychelles',
          neighborhoods: ['Mahe', 'Praslin', 'La Digue', 'Victoria', 'Beau Vallon', 'Anse Source d\'Argent'],
          coordinates: { lat: -4.6796, lng: 55.4920 },
          popular: true
        },
      ]
    },
    'Kenya': {
      cities: [
        {
          name: 'Nairobi',
          neighborhoods: ['Westlands', 'Karen', 'Kilimani', 'Lavington', 'Gigiri', 'CBD'],
          coordinates: { lat: -1.2921, lng: 36.8219 },
        },
        {
          name: 'Diani Beach',
          neighborhoods: ['Diani', 'Ukunda', 'Tiwi', 'Galu'],
          coordinates: { lat: -4.2773, lng: 39.5883 },
        },
      ]
    },
    'Qatar': {
      cities: [
        {
          name: 'Doha',
          neighborhoods: ['The Pearl', 'West Bay', 'Souq Waqif', 'Katara', 'Lusail', 'Al Waab'],
          coordinates: { lat: 25.2854, lng: 51.5310 },
        },
      ]
    },
    'Oman': {
      cities: [
        {
          name: 'Muscat',
          neighborhoods: ['Mutrah', 'Al Qurum', 'Al Mouj', 'Shatti Al Qurum', 'Old Muscat'],
          coordinates: { lat: 23.5880, lng: 58.3829 },
        },
      ]
    },
    'Jordan': {
      cities: [
        {
          name: 'Amman',
          neighborhoods: ['Abdoun', 'Rainbow Street', 'Jabal Amman', 'Sweifieh', 'Downtown'],
          coordinates: { lat: 31.9454, lng: 35.9284 },
        },
        {
          name: 'Dead Sea',
          neighborhoods: ['Sweimeh', 'Main Hot Springs', 'Movenpick Area'],
          coordinates: { lat: 31.5000, lng: 35.5000 },
        },
        {
          name: 'Petra',
          neighborhoods: ['Wadi Musa', 'Little Petra'],
          coordinates: { lat: 30.3285, lng: 35.4444 },
        },
      ]
    },
  },
};

// Helper functions

// Get all regions
export function getRegions(): string[] {
  return Object.keys(WORLD_LOCATIONS).sort();
}

// Get all countries in a region
export function getCountriesInRegion(region: string): string[] {
  const regionData = WORLD_LOCATIONS[region];
  if (!regionData) return [];
  return Object.keys(regionData).sort();
}

// Get all cities in a country
export function getCitiesInCountry(region: string, country: string): CityLocation[] {
  const regionData = WORLD_LOCATIONS[region];
  if (!regionData) return [];
  const countryData = regionData[country];
  if (!countryData) return [];
  return countryData.cities;
}

// Get popular cities globally
export function getPopularCities(): { region: string; country: string; city: CityLocation }[] {
  const popularCities: { region: string; country: string; city: CityLocation }[] = [];

  for (const [region, countries] of Object.entries(WORLD_LOCATIONS)) {
    for (const [country, countryData] of Object.entries(countries)) {
      for (const city of countryData.cities) {
        if (city.popular) {
          popularCities.push({ region, country, city });
        }
      }
    }
  }

  return popularCities;
}

// Get all cities (flat list)
export function getAllCities(): { region: string; country: string; city: CityLocation }[] {
  const allCities: { region: string; country: string; city: CityLocation }[] = [];

  for (const [region, countries] of Object.entries(WORLD_LOCATIONS)) {
    for (const [country, countryData] of Object.entries(countries)) {
      for (const city of countryData.cities) {
        allCities.push({ region, country, city });
      }
    }
  }

  return allCities;
}

// Search cities by name
export function searchCities(query: string): { region: string; country: string; city: CityLocation }[] {
  const queryLower = query.toLowerCase();
  const results: { region: string; country: string; city: CityLocation }[] = [];

  for (const [region, countries] of Object.entries(WORLD_LOCATIONS)) {
    for (const [country, countryData] of Object.entries(countries)) {
      for (const city of countryData.cities) {
        if (
          city.name.toLowerCase().includes(queryLower) ||
          city.neighborhoods.some(n => n.toLowerCase().includes(queryLower)) ||
          country.toLowerCase().includes(queryLower)
        ) {
          results.push({ region, country, city });
        }
      }
    }
  }

  return results;
}

// Get city by name
export function getCityByName(cityName: string): { region: string; country: string; city: CityLocation } | null {
  const cityNameLower = cityName.toLowerCase();

  for (const [region, countries] of Object.entries(WORLD_LOCATIONS)) {
    for (const [country, countryData] of Object.entries(countries)) {
      for (const city of countryData.cities) {
        if (city.name.toLowerCase() === cityNameLower) {
          return { region, country, city };
        }
      }
    }
  }

  return null;
}

// Get neighborhoods for a city
export function getNeighborhoodsForCity(cityName: string): string[] {
  const cityData = getCityByName(cityName);
  if (!cityData) return [];
  return cityData.city.neighborhoods;
}

// Group cities by region for display
export function getCitiesGroupedByRegion(): Record<string, { country: string; city: CityLocation }[]> {
  const grouped: Record<string, { country: string; city: CityLocation }[]> = {};

  for (const [region, countries] of Object.entries(WORLD_LOCATIONS)) {
    grouped[region] = [];
    for (const [country, countryData] of Object.entries(countries)) {
      for (const city of countryData.cities) {
        grouped[region].push({ country, city });
      }
    }
  }

  return grouped;
}

// Get featured destinations (popular cities organized nicely)
export function getFeaturedDestinations(): {
  usa: CityLocation[];
  mexico: CityLocation[];
  caribbean: CityLocation[];
  europe: CityLocation[];
  asiaPacific: CityLocation[];
  middleEastAfrica: CityLocation[];
} {
  const usaCities = WORLD_LOCATIONS['North America']?.['United States']?.cities.filter(c => c.popular) || [];
  const mexicoCities = WORLD_LOCATIONS['North America']?.['Mexico']?.cities.filter(c => c.popular) || [];

  const caribbeanCities: CityLocation[] = [];
  for (const countryData of Object.values(WORLD_LOCATIONS['Caribbean'] || {})) {
    caribbeanCities.push(...countryData.cities.filter(c => c.popular));
  }

  const europeCities: CityLocation[] = [];
  for (const countryData of Object.values(WORLD_LOCATIONS['Europe'] || {})) {
    europeCities.push(...countryData.cities.filter(c => c.popular));
  }

  const asiaPacificCities: CityLocation[] = [];
  for (const countryData of Object.values(WORLD_LOCATIONS['Asia Pacific'] || {})) {
    asiaPacificCities.push(...countryData.cities.filter(c => c.popular));
  }

  const middleEastAfricaCities: CityLocation[] = [];
  for (const countryData of Object.values(WORLD_LOCATIONS['Middle East & Africa'] || {})) {
    middleEastAfricaCities.push(...countryData.cities.filter(c => c.popular));
  }

  // Also include Central & South America in a combined list
  const centralSouthAmericaCities: CityLocation[] = [];
  for (const countryData of Object.values(WORLD_LOCATIONS['Central & South America'] || {})) {
    centralSouthAmericaCities.push(...countryData.cities.filter(c => c.popular));
  }

  return {
    usa: usaCities,
    mexico: mexicoCities,
    caribbean: caribbeanCities,
    europe: europeCities,
    asiaPacific: [...asiaPacificCities, ...centralSouthAmericaCities],
    middleEastAfrica: middleEastAfricaCities,
  };
}
