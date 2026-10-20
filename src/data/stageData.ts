import { StageDefinition } from '../types/fighter';

export const STAGES: StageDefinition[] = [
  {
    id: 'stage_1_urban_alley',
    name: 'Callejón Urbano / Parque Nocturno',
    dressCodeLevel: 'Casual',
    location: 'Sector 4 - Distrito Subterráneo',
    description: 'Bajo luces de neón vibrantes y grafitis, la juventud callejera vitorea cada impacto entre vapores de alcantarilla y vallas metálicas.',
    imageKey: '/src/assets/images/stage_urban_alley_1792533695858.jpg',
    bgGradient: 'from-purple-950 via-slate-900 to-neutral-950',
    groundColor: '#1e1b2e',
    musicStyle: 'rock',
    crowdCheerPitch: 1.0,
    ambientParticles: 'steam'
  },
  {
    id: 'stage_2_tech_cafe',
    name: 'Cafetería Modernista / Distrito Tech',
    dressCodeLevel: 'Smart Casual',
    location: 'Silicon Boulevard - Nivel 8',
    description: 'Fachadas de cristal templado, pantallas holográficas y mesas minimalistas donde desarrolladores y ejecutivos toman espresso y miran los duelos.',
    bgGradient: 'from-cyan-950 via-slate-900 to-neutral-950',
    groundColor: '#16222f',
    musicStyle: 'synthwave',
    crowdCheerPitch: 1.1,
    ambientParticles: 'sparks'
  },
  {
    id: 'stage_3_art_gallery',
    name: 'Galería de Arte Contemporáneo',
    dressCodeLevel: 'Semi Formal',
    location: 'Pabellón Metropolitano de Bellas Artes',
    description: 'Pisos de mármol pulido y pedestales con esculturas geométricas de vanguardia. Críticos de arte y coleccionistas contemplan la simetría marcial.',
    bgGradient: 'from-amber-950 via-neutral-900 to-stone-950',
    groundColor: '#26221f',
    musicStyle: 'jazz',
    crowdCheerPitch: 0.9,
    ambientParticles: 'dust'
  },
  {
    id: 'stage_4_executive_lounge',
    name: 'Salón de Negocios / Lobby Ejecutivo',
    dressCodeLevel: 'Formal',
    location: 'Torre Apex - Piso 72 Penthouse',
    description: 'Ventanales panorámicos hacia un rascacielos nocturno iluminado. Sillones de cuero italiano y magnates en trajes a medida siguiendo las cotizaciones.',
    bgGradient: 'from-blue-950 via-slate-900 to-neutral-950',
    groundColor: '#131b28',
    musicStyle: 'funk',
    crowdCheerPitch: 0.85,
    ambientParticles: 'steam'
  },
  {
    id: 'stage_5_opera_redcarpet',
    name: 'Salón de Ópera / Alfombra Roja',
    dressCodeLevel: 'Black Tie',
    location: 'Gran Teatro Real Garnier',
    description: 'Candelabros de cristal de Bohemia, terciopelo carmesí y una lluvia constante de flashes de paparazzi ante la alta alcurnia en esmoquin.',
    imageKey: '/src/assets/images/stage_opera_redcarpet_1792533696862.jpg',
    bgGradient: 'from-red-950 via-neutral-950 to-amber-950',
    groundColor: '#380e15',
    musicStyle: 'orchestral',
    crowdCheerPitch: 1.05,
    ambientParticles: 'flashes'
  },
  {
    id: 'stage_6_imperial_palace',
    name: 'Palacio Presidencial / Salón Imperial',
    dressCodeLevel: 'White Tie',
    location: 'Palacio de la Corona Soberana',
    description: 'Columnas jónicas bañadas en pan de oro, estandartes heráldicos y dignatarios de frac y tiaras que aplauden con contenida elegancia aristocrática.',
    bgGradient: 'from-yellow-950 via-neutral-900 to-stone-950',
    groundColor: '#2b2313',
    musicStyle: 'anthem',
    crowdCheerPitch: 0.95,
    ambientParticles: 'petals'
  },
  {
    id: 'stage_7_fashion_colosseum',
    name: 'El Coliseo de la Moda (Final Stage)',
    dressCodeLevel: 'White Tie',
    location: 'Santuario Monumental Haute Couture',
    description: 'El clímax definitivo: pasarela luminiscente suspendida sobre decenas de miles de fanáticos enardecidos, rayos láser y ovaciones colosales.',
    imageKey: '/src/assets/images/stage_fashion_colosseum_1792533698427.jpg',
    bgGradient: 'from-fuchsia-950 via-purple-950 to-neutral-950',
    groundColor: '#220d2a',
    musicStyle: 'hyperpop',
    crowdCheerPitch: 1.25,
    ambientParticles: 'confetti'
  }
];
