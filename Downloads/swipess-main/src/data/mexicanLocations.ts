// Mexican States, Cities, and Neighborhoods data
// Structure: State -> Cities -> Neighborhoods

export interface MexicanLocation {
  states: {
    [stateName: string]: {
      cities: {
        [cityName: string]: string[]; // neighborhoods
      };
    };
  };
}

export const MEXICAN_LOCATIONS: MexicanLocation = {
  states: {
    'Quintana Roo': {
      cities: {
        'Cancun': [
          'Zona Hotelera',
          'Centro',
          'Puerto Juarez',
          'El Table',
          'Supermanzana 500',
          'Region 15',
          'Region 94',
          'Region 98',
          'Punta Cancun',
          'Punta Nizuc'
        ],
        'Playa del Carmen': [
          'Centro',
          'Playacar',
          'Gonzalo Guerrero',
          'Ejidal',
          'Colosio',
          'Luis Donaldo Colosio',
          'Zazil-Ha',
          'Juarez'
        ],
        'Tulum': [
          'Centro',
          'Aldea Zama',
          'La Veleta',
          'Region 15',
          'Holistika',
          'Zona Hotelera',
          'Boca Paila',
          'Sian Kaan'
        ],
        'Cozumel': [
          'Centro',
          'Zona Hotelera Norte',
          'Zona Hotelera Sur',
          'San Miguel'
        ],
        'Bacalar': [
          'Centro',
          'Costera',
          'Xul-Ha'
        ],
        'Chetumal': [
          'Centro',
          'Bahia',
          'Las Americas',
          'Solidaridad'
        ],
        'Puerto Morelos': [
          'Centro',
          'Zona Hotelera',
          'Leona Vicario'
        ],
        'Isla Mujeres': [
          'Centro',
          'Punta Sur',
          'Salina Grande'
        ]
      }
    },
    'Ciudad de Mexico': {
      cities: {
        'Ciudad de Mexico': [
          'Polanco',
          'Condesa',
          'Roma Norte',
          'Roma Sur',
          'Juarez',
          'Cuauhtemoc',
          'Santa Fe',
          'Del Valle',
          'Narvarte',
          'Napoles',
          'Coyoacan',
          'San Angel',
          'Pedregal',
          'Tlalpan',
          'Xochimilco',
          'Iztapalapa',
          'Benito Juarez',
          'Miguel Hidalgo'
        ]
      }
    },
    'Jalisco': {
      cities: {
        'Guadalajara': [
          'Centro',
          'Chapultepec',
          'Providencia',
          'Americana',
          'Ladrón de Guevara',
          'Tlaquepaque',
          'Zapopan Centro',
          'Andares',
          'Puerta de Hierro',
          'Colinas de San Javier'
        ],
        'Puerto Vallarta': [
          'Zona Romantica',
          'Centro',
          'Marina Vallarta',
          'Nuevo Vallarta',
          'Zona Hotelera',
          'Conchas Chinas',
          'Amapas',
          'Los Muertos'
        ],
        'Zapopan': [
          'Centro',
          'Santa Margarita',
          'Bugambilias',
          'Jardines del Valle'
        ]
      }
    },
    'Nuevo Leon': {
      cities: {
        'Monterrey': [
          'Centro',
          'San Pedro Garza Garcia',
          'Valle Oriente',
          'Del Valle',
          'Cumbres',
          'Contry',
          'Mitras Centro',
          'Obispado',
          'Chipinque',
          'Residencial'
        ],
        'San Pedro Garza Garcia': [
          'Valle',
          'Del Valle',
          'Fuentes del Valle',
          'Colonial',
          'Los Pinos'
        ]
      }
    },
    'Baja California Sur': {
      cities: {
        'Los Cabos': [
          'Cabo San Lucas Centro',
          'Medano',
          'Pedregal',
          'El Tezal',
          'Palmilla',
          'San Jose del Cabo Centro',
          'Zona Hotelera',
          'Puerto Los Cabos'
        ],
        'La Paz': [
          'Centro',
          'Malecon',
          'El Centenario',
          'La Ventana',
          'Todos Santos'
        ]
      }
    },
    'Yucatan': {
      cities: {
        'Merida': [
          'Centro Historico',
          'Paseo de Montejo',
          'Garcia Gineres',
          'Campestre',
          'Altabrisa',
          'Montes de Ame',
          'Gran Santa Fe',
          'Cholul',
          'Temozon Norte'
        ],
        'Valladolid': [
          'Centro',
          'Sisal'
        ],
        'Progreso': [
          'Centro',
          'Malecon',
          'Chicxulub Puerto'
        ]
      }
    },
    'Nayarit': {
      cities: {
        'Riviera Nayarit': [
          'Punta Mita',
          'Sayulita',
          'San Pancho',
          'Bucerias',
          'La Cruz de Huanacaxtle',
          'Nuevo Vallarta',
          'Flamingos'
        ],
        'Tepic': [
          'Centro',
          'Ciudad del Valle'
        ]
      }
    },
    'Oaxaca': {
      cities: {
        'Oaxaca de Juarez': [
          'Centro Historico',
          'Reforma',
          'Jalatlaco',
          'Xochimilco',
          'La Cascada'
        ],
        'Puerto Escondido': [
          'Zicatela',
          'La Punta',
          'Rinconada',
          'Centro',
          'Carrizalillo'
        ],
        'Huatulco': [
          'La Crucecita',
          'Santa Cruz',
          'Tangolunda',
          'Chahue'
        ]
      }
    },
    'Guerrero': {
      cities: {
        'Acapulco': [
          'Zona Dorada',
          'Diamante',
          'Centro',
          'Costera',
          'Punta Diamante',
          'Las Brisas'
        ],
        'Zihuatanejo': [
          'Centro',
          'Playa La Ropa',
          'Ixtapa Zona Hotelera'
        ]
      }
    },
    'Estado de Mexico': {
      cities: {
        'Toluca': [
          'Centro',
          'Metepec',
          'Santa Fe',
          'Zinacantepec'
        ],
        'Metepec': [
          'Centro',
          'Izcalli Cuauhtemoc',
          'San Salvador Tizatlalli'
        ]
      }
    },
    'Queretaro': {
      cities: {
        'Queretaro': [
          'Centro Historico',
          'Juriquilla',
          'El Refugio',
          'Milenio III',
          'Zibata',
          'Lomas de Juriquilla'
        ],
        'San Miguel de Allende': [
          'Centro',
          'Atascadero',
          'Los Frailes',
          'Rancho Los Labradores'
        ]
      }
    },
    'Guanajuato': {
      cities: {
        'Leon': [
          'Centro',
          'Campestre',
          'El Moral',
          'Jardines del Moral'
        ],
        'Guanajuato': [
          'Centro Historico',
          'Marfil',
          'Valenciana'
        ],
        'San Miguel de Allende': [
          'Centro',
          'Atascadero',
          'Los Frailes'
        ]
      }
    },
    'Puebla': {
      cities: {
        'Puebla': [
          'Centro Historico',
          'Angelopolis',
          'La Paz',
          'Zavaleta',
          'Lomas de Angelopolis'
        ],
        'Cholula': [
          'Centro',
          'San Andres',
          'San Pedro'
        ]
      }
    },
    'Veracruz': {
      cities: {
        'Veracruz': [
          'Centro',
          'Boca del Rio',
          'Costa de Oro',
          'Mocambo'
        ],
        'Xalapa': [
          'Centro',
          'Animas',
          'Las Fuentes'
        ]
      }
    },
    'Chiapas': {
      cities: {
        'San Cristobal de las Casas': [
          'Centro',
          'Real del Monte',
          'La Merced'
        ],
        'Tuxtla Gutierrez': [
          'Centro',
          'Terán',
          'Las Palmas'
        ],
        'Palenque': [
          'Centro',
          'La Canada'
        ]
      }
    },
    'Morelos': {
      cities: {
        'Cuernavaca': [
          'Centro',
          'Lomas de Cortes',
          'Rancho Cortes',
          'Vista Hermosa',
          'Palmira'
        ],
        'Tepoztlan': [
          'Centro',
          'Amatlán'
        ]
      }
    },
    'Sinaloa': {
      cities: {
        'Mazatlan': [
          'Zona Dorada',
          'Centro',
          'Marina Mazatlan',
          'Cerritos',
          'Sabalo Country'
        ],
        'Culiacan': [
          'Centro',
          'Las Quintas',
          'Desarrollo Urbano Tres Rios'
        ]
      }
    },
    'Sonora': {
      cities: {
        'Hermosillo': [
          'Centro',
          'Pitic',
          'Villa Satelite',
          'Las Lomas'
        ],
        'Puerto Penasco': [
          'Centro',
          'Sandy Beach',
          'Las Conchas'
        ]
      }
    },
    'Tamaulipas': {
      cities: {
        'Tampico': [
          'Centro',
          'Altavista',
          'Lomas del Naranjal'
        ],
        'Ciudad Victoria': [
          'Centro',
          'Sierra Madre'
        ]
      }
    },
    'Aguascalientes': {
      cities: {
        'Aguascalientes': [
          'Centro',
          'Pulgas Pandas',
          'Jardines de la Cruz',
          'Bosques del Prado'
        ]
      }
    },
    'San Luis Potosi': {
      cities: {
        'San Luis Potosi': [
          'Centro Historico',
          'Lomas',
          'Tangamanga',
          'Industrial Aviacion'
        ]
      }
    },
    'Coahuila': {
      cities: {
        'Saltillo': [
          'Centro',
          'Lourdes',
          'Los Pinos'
        ],
        'Torreon': [
          'Centro',
          'Campestre La Rosita',
          'Las Villas'
        ]
      }
    },
    'Durango': {
      cities: {
        'Durango': [
          'Centro',
          'Jardines',
          'La Forestal'
        ]
      }
    },
    'Michoacan': {
      cities: {
        'Morelia': [
          'Centro Historico',
          'Chapultepec',
          'Tres Marias',
          'Altozano'
        ],
        'Patzcuaro': [
          'Centro',
          'Tzurumutaro'
        ]
      }
    },
    'Hidalgo': {
      cities: {
        'Pachuca': [
          'Centro',
          'Real del Monte',
          'La Concepcion'
        ]
      }
    },
    'Tlaxcala': {
      cities: {
        'Tlaxcala': [
          'Centro',
          'Ocotlan'
        ]
      }
    },
    'Zacatecas': {
      cities: {
        'Zacatecas': [
          'Centro Historico',
          'Guadalupe'
        ]
      }
    },
    'Colima': {
      cities: {
        'Colima': [
          'Centro',
          'La Estancia'
        ],
        'Manzanillo': [
          'Centro',
          'Santiago',
          'Las Brisas'
        ]
      }
    },
    'Tabasco': {
      cities: {
        'Villahermosa': [
          'Centro',
          'Tabasco 2000',
          'Galaxias'
        ]
      }
    },
    'Campeche': {
      cities: {
        'Campeche': [
          'Centro Historico',
          'San Roman'
        ]
      }
    },
    'Baja California': {
      cities: {
        'Tijuana': [
          'Zona Rio',
          'Playas de Tijuana',
          'Centro',
          'Hipódromo',
          'Chapultepec'
        ],
        'Ensenada': [
          'Centro',
          'Valle de Guadalupe',
          'El Sauzal'
        ],
        'Rosarito': [
          'Centro',
          'Popotla'
        ],
        'Mexicali': [
          'Centro',
          'Nueva Mexicali',
          'Valle del Sol'
        ]
      }
    }
  }
};

// Helper function to get all states
export function getStates(): string[] {
  return Object.keys(MEXICAN_LOCATIONS.states).sort();
}

// Helper function to get cities for a state
export function getCitiesForState(state: string): string[] {
  const stateData = MEXICAN_LOCATIONS.states[state];
  if (!stateData) return [];
  return Object.keys(stateData.cities).sort();
}

// Helper function to get neighborhoods for a city
export function getNeighborhoodsForCity(state: string, city: string): string[] {
  const stateData = MEXICAN_LOCATIONS.states[state];
  if (!stateData) return [];
  const neighborhoods = stateData.cities[city];
  if (!neighborhoods) return [];
  return [...neighborhoods].sort();
}
