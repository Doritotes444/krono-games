/**
 * KRONO — Catálogo oficial de videojuegos (1995–2026) + Noticias y Novedades
 * Portadas oficiales reales, fondos Aurora, capturas reales para contraportada y metadatos físicos.
 */

export const USD_TO_COP = 4100;

const steamCover = (id) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/library_600x900_2x.jpg`;
const steamHero = (id) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/library_hero.jpg`;
const steamHeader = (id) =>
  `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${id}/header.jpg`;

export const ERAS = {
  lanzamiento: {
    id: 'lanzamiento',
    label: 'Nuevo lanzamiento',
    shortLabel: 'Lanzamiento',
    range: '2025 – 2026',
    description: 'Estrenos recientes y ediciones destacadas que dominan la escena actual.'
  },
  moderno: {
    id: 'moderno',
    label: 'Moderno esencial',
    shortLabel: 'Moderno',
    range: '2018 – 2024',
    description: 'Obras contemporáneas imprescindibles que marcaron la generación.'
  },
  clasico: {
    id: 'clasico',
    label: 'Clásico atemporal',
    shortLabel: 'Clásico',
    range: '1995 – 2011',
    description: 'Joyas históricas y clásicos de culto que siguen siendo brillantes hoy.'
  }
};

export const CASE_THEMES = {
  xbox: {
    id: 'xbox',
    label: 'XBOX SERIES · ONE',
    short: 'XBOX',
    discFormat: 'XBOX OPTICAL DISC · 4K UHD',
    headerBg: '#107C10',
    headerText: '#FFFFFF',
    accent: '#22C55E'
  },
  xbox360: {
    id: 'xbox360',
    label: 'XBOX 360 · CLASSICS',
    short: 'XBOX 360',
    discFormat: 'XBOX 360 DVD-ROM · HD',
    headerBg: '#15803D',
    headerText: '#F0FDF4',
    accent: '#84CC16'
  },
  ps5: {
    id: 'ps5',
    label: 'PLAYSTATION 5',
    short: 'PS5',
    discFormat: 'ULTRA HD BLU-RAY · PS5',
    headerBg: '#00439C',
    headerText: '#FFFFFF',
    accent: '#3B82F6'
  },
  switch: {
    id: 'switch',
    label: 'NINTENDO SWITCH',
    short: 'SWITCH',
    discFormat: 'GAME CARD · EDICIÓN COLECCIÓN',
    headerBg: '#D91A22',
    headerText: '#FFFFFF',
    accent: '#EF4444'
  },
  pc: {
    id: 'pc',
    label: 'PC · EDICIÓN FÍSICA & DIGITAL',
    short: 'PC DVD',
    discFormat: 'PC BLU-RAY · STEAM KEY',
    headerBg: '#1E2530',
    headerText: '#F3F4F6',
    accent: '#94A3B8'
  },
  retro: {
    id: 'retro',
    label: 'ARCHIVO CLÁSICO · COLLECTOR',
    short: 'CLASSIC',
    discFormat: 'CD-ROM MASTER · RESTAURADO',
    headerBg: '#8A6A24',
    headerText: '#FFFBEB',
    accent: '#EAB308'
  }
};

export const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Retro'];

export const GENRES = [
  'RPG',
  'Acción',
  'Aventura',
  'Indie',
  'Estrategia',
  'Terror',
  'Puzzle',
  'Mundo Abierto'
];

export const TASTE_PRESETS = [
  {
    id: 'clasicos',
    label: 'Clásicos y Xbox 360',
    summary: 'Joyas históricas y clásicos restaurados',
    eras: ['clasico', 'moderno'],
    genres: ['Acción', 'RPG', 'Puzzle'],
    platforms: ['Xbox', 'PC', 'Retro'],
    budget: 'all'
  },
  {
    id: 'novedades',
    label: 'Estrenos 2025–2026',
    summary: 'Lo más nuevo en RPG, acción e indie',
    eras: ['lanzamiento'],
    genres: ['Acción', 'RPG', 'Indie'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    budget: 'all'
  },
  {
    id: 'rpg',
    label: 'Amante del RPG',
    summary: 'Grandes mundos, táctica y narrativa',
    eras: ['lanzamiento', 'moderno', 'clasico'],
    genres: ['RPG', 'Estrategia', 'Mundo Abierto'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    budget: 'all'
  },
  {
    id: 'indie',
    label: 'Joyas indie y autor',
    summary: 'Diseño artesanal, misterio y puzles',
    eras: ['lanzamiento', 'moderno', 'clasico'],
    genres: ['Indie', 'Puzzle', 'Aventura'],
    platforms: ['PC', 'Nintendo'],
    budget: 'ofertas'
  }
];

export const GAMES = [
  {
    id: 'expedition-33',
    steamId: 1903340,
    title: 'Clair Obscur: Expedition 33',
    studio: 'Sandfall Interactive',
    publisher: 'Kepler Interactive',
    year: 2025,
    era: 'lanzamiento',
    caseTheme: 'ps5',
    genres: ['RPG', 'Estrategia', 'Aventura'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 94,
    priceUSD: 49.99,
    originalPriceUSD: 59.99,
    discount: 17,
    playtime: '38 h',
    edition: 'Edición Física & Digital',
    cover: steamCover(1903340),
    heroBg: steamHero(1903340),
    headerImg: steamHeader(1903340),
    fallbackCover: 'assets/images/cover_expedition.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1903340/ss_483a27df5072beb3a4650634a764bda750fbcb82.600x338.jpg?t=1794930905',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1903340/ss_e49800e906e8a0f00707458c836567c933603bac.600x338.jpg?t=1794930905'
    ],
    youtubeId: 'ejgW-upPMgk',
    featured: true,
    esrb: 'M',
    esrbText: 'Maduro 17+',
    players: '1 Jugador',
    resolution: '4K HDR · 60 FPS',
    storage: '55 GB SSD',
    languages: 'Voces EN/FR · Textos ES',
    serial: 'KRN-PS5-1903340',
    barcode: '8 40291 33025 7',
    backTagline: 'MAÑANA LLEGA. ROMPE EL CICLO.',
    whyWorthIt:
      'Combina el RPG por turnos clásico con esquivas y contraataques en tiempo real bajo una dirección artística Belle Époque deslumbrante.',
    synopsis:
      'Una vez al año, la Pintora despierta y traza un número maldito en su monolito. Lidera la Expedición 33 en una travesía poética y táctica para detenerla antes de que el tiempo se agote.',
    specs: 'Windows 10/11 · PS5 · Xbox Series X|S · 16 GB RAM · 55 GB SSD',
    tags: ['Combate reactivo', 'Narrativa cinematográfica', 'Banda sonora orquestal']
  },
  {
    id: 'silksong',
    steamId: 1030300,
    title: 'Hollow Knight: Silksong',
    studio: 'Team Cherry',
    publisher: 'Team Cherry',
    year: 2025,
    era: 'lanzamiento',
    caseTheme: 'switch',
    genres: ['Indie', 'Acción', 'Aventura'],
    platforms: ['PC', 'Nintendo', 'PlayStation', 'Xbox'],
    score: 95,
    priceUSD: 19.99,
    originalPriceUSD: null,
    discount: 0,
    playtime: '32 h',
    edition: 'Edición Estándar + OST',
    cover: steamCover(1030300),
    heroBg: steamHero(1030300),
    headerImg: steamHeader(1030300),
    fallbackCover: 'assets/images/cover_silksong.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1030300/26950369fe4b03c2268620eb9815c8a246aa0b06/ss_26950369fe4b03c2268620eb9815c8a246aa0b06.600x338.jpg?t=1776125736',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1030300/09ccaa6c16f158f9df8298feb5d196098506a028/ss_09ccaa6c16f158f9df8298feb5d196098506a028.600x338.jpg?t=1776125736'
    ],
    youtubeId: 'pFAknD_9U7c',
    featured: true,
    esrb: 'E10+',
    esrbText: 'Todos +10',
    players: '1 Jugador',
    resolution: '4K · 120 FPS',
    storage: '9 GB',
    languages: 'Textos ES / EN / JP',
    serial: 'KRN-NSW-1030300',
    barcode: '0 45496 88321 4',
    backTagline: 'ASCIENDE POR UN REINO DE SEDA Y CANTO.',
    whyWorthIt:
      'Precisión milimétrica en combate acrobático, arte dibujado a mano cuadro por cuadro y un mundo interconectado lleno de secretos.',
    synopsis:
      'Encarna a Hornet, princesa protectora de Hallownest, y asciende hasta la cima de un reino desconocido gobernado por la seda y el canto enfrentando más de 150 enemigos nuevos.',
    specs: 'Switch · PC · Consolas · 8 GB RAM · Verificado en portátiles',
    tags: ['Metroidvania', 'Arte 2D artesanal', 'Jefes memorables']
  },
  {
    id: 'hades-2',
    steamId: 1145350,
    title: 'Hades II',
    studio: 'Supergiant Games',
    publisher: 'Supergiant Games',
    year: 2025,
    era: 'lanzamiento',
    caseTheme: 'pc',
    genres: ['Acción', 'Indie', 'RPG'],
    platforms: ['PC', 'Nintendo'],
    score: 94,
    priceUSD: 29.99,
    originalPriceUSD: 34.99,
    discount: 14,
    playtime: '45 h',
    edition: 'Edición Completa v1.0',
    cover: steamCover(1145350),
    heroBg: steamHero(1145350),
    headerImg: steamHeader(1145350),
    fallbackCover: 'assets/images/cover_hades2.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/ss_ef0f63061d0a0a9a7e46f3b84f125d25330e8f19.600x338.jpg?t=1779901265',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1145350/ss_f28befd916e59b8bf0a8a801b8a498b8adaa01eb.600x338.jpg?t=1779901265'
    ],
    youtubeId: 'l-iHDj3EwdI',
    featured: false,
    esrb: 'T',
    esrbText: 'Adolescentes',
    players: '1 Jugador',
    resolution: '4K · 120 FPS',
    storage: '10 GB SSD',
    languages: 'Voces EN · Textos ES',
    serial: 'KRN-PC-1145350',
    barcode: '8 19338 02044 2',
    backTagline: 'LA MUERTE A CRONOS. DOMINA LAS ARTES ARCANAS.',
    whyWorthIt:
      'Refina la fórmula roguelike perfecta con hechicería táctica, dos rutas completas y miles de diálogos reactivos que premian cada partida.',
    synopsis:
      'Como Melinoë, princesa inmortal del Inframundo, domina las artes oscuras y recibe las bendiciones del Olimpo para derrotar al Titán del Tiempo.',
    specs: 'PC / Steam Deck / Switch · 8 GB RAM · 10 GB almacenamiento',
    tags: ['Roguelike', 'Rejugabilidad infinita', 'Mitología griega']
  },
  {
    id: 'monster-hunter-wilds',
    steamId: 2246340,
    title: 'Monster Hunter Wilds',
    studio: 'Capcom',
    publisher: 'Capcom',
    year: 2025,
    era: 'lanzamiento',
    caseTheme: 'xbox',
    genres: ['Acción', 'Mundo Abierto', 'Aventura'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 90,
    priceUSD: 59.99,
    originalPriceUSD: 69.99,
    discount: 14,
    playtime: '70 h',
    edition: 'Edición Lanzamiento',
    cover: steamCover(2246340),
    heroBg: steamHero(2246340),
    headerImg: steamHeader(2246340),
    fallbackCover: 'assets/images/cover_mhwilds.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2246340/ss_31b5597fecf2d9a2904bc9bbf8011aacb18143db.600x338.jpg?t=1787549555',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2246340/ss_9245c1ede8c3fc2cd65e4890a74a01ef50b726da.600x338.jpg?t=1787549555'
    ],
    youtubeId: 'zyoBA0aCRNk',
    featured: false,
    esrb: 'T',
    esrbText: 'Adolescentes',
    players: '1–4 Co-op Cross-Play',
    resolution: '4K HDR · 60 FPS',
    storage: '75 GB SSD',
    languages: 'Voces y Textos ES',
    serial: 'KRN-XBX-2246340',
    barcode: '0 13388 56091 8',
    backTagline: 'LA CACERÍA EVOLUCIONA CON EL CLIMA.',
    whyWorthIt:
      'Ecosistemas vivos cuyo clima transforma el entorno en tiempo real, cooperativo multiplataforma y 14 tipos de armas con profundidad táctica.',
    synopsis:
      'Adéntrate en las Tierras Prohibidas con la Comisión de Investigación, rastrea monstruos colosales y adapta tu equipo entre tormentas eléctricas y períodos de abundancia.',
    specs: 'Cross-play PC / Xbox / PS5 · 16 GB RAM · Cooperativo 1–4 jugadores',
    tags: ['Cooperativo online', 'Ecosistema dinámico', 'Cacería táctica']
  },
  {
    id: 'elden-ring',
    steamId: 1245620,
    title: 'Elden Ring: Shadow of the Erdtree',
    studio: 'FromSoftware',
    publisher: 'Bandai Namco',
    year: 2024,
    era: 'moderno',
    caseTheme: 'ps5',
    genres: ['RPG', 'Mundo Abierto', 'Acción'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 96,
    priceUSD: 54.99,
    originalPriceUSD: 79.99,
    discount: 31,
    playtime: '95 h',
    edition: 'Juego Base + Expansión',
    cover: steamCover(1245620),
    heroBg: steamHero(1245620),
    headerImg: steamHeader(1245620),
    fallbackCover: 'assets/images/cover_eldenring.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/ss_943bf6fe62352757d9070c1d33e50b92fe8539f1.600x338.jpg?t=1790290043',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1245620/ss_dcdac9e4b26ac0ee5248bfd2967d764fd00cdb42.600x338.jpg?t=1790290043'
    ],
    youtubeId: 'qLZenOn7WUo',
    featured: true,
    esrb: 'M',
    esrbText: 'Maduro 17+',
    players: '1–4 Online',
    resolution: '4K HDR · Ray Tracing',
    storage: '80 GB SSD',
    languages: 'Voces EN · Textos ES',
    serial: 'KRN-PS5-1245620',
    barcode: '7 22674 12214 6',
    backTagline: 'ÁLZATE, SINLUZ. FORJA TU PROPIO DESTINO.',
    whyWorthIt:
      'El estándar moderno de la exploración libre: sin marcadores intrusivos, recompensa la curiosidad pura con escenarios majestuosos y combates memorables.',
    synopsis:
      'Recorre las Tierras Intermedias y el Reino de las Sombras para restaurar el Círculo de Elden. Construye tu personaje libremente entre armas colosales, magia y sigilo.',
    specs: 'PC / PS5 / Xbox · 16 GB RAM · 80 GB SSD · Multijugador cooperativo',
    tags: ['Exploración orgánica', 'Obra maestra moderna', 'Incluye DLC']
  },
  {
    id: 'baldurs-gate-3',
    steamId: 1086940,
    title: "Baldur's Gate 3",
    studio: 'Larian Studios',
    publisher: 'Larian Studios',
    year: 2023,
    era: 'moderno',
    caseTheme: 'pc',
    genres: ['RPG', 'Estrategia', 'Aventura'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 96,
    priceUSD: 47.99,
    originalPriceUSD: 59.99,
    discount: 20,
    playtime: '110 h',
    edition: 'Edición Deluxe Física & Digital',
    cover: steamCover(1086940),
    heroBg: steamHero(1086940),
    headerImg: steamHeader(1086940),
    fallbackCover: 'assets/images/cover_bg3.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/ss_c73bc54415178c07fef85f54ee26621728c77504.600x338.jpg?t=1777363040',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1086940/ss_73d93bea842b93914d966622104dcb8c0f42972b.600x338.jpg?t=1777363040'
    ],
    youtubeId: '1T22wNvoNiU',
    featured: false,
    esrb: 'M',
    esrbText: 'Maduro 17+',
    players: '1–4 Local y Online',
    resolution: '4K HDR · 60 FPS',
    storage: '150 GB SSD',
    languages: 'Voces EN · Textos ES',
    serial: 'KRN-PC-1086940',
    barcode: '5 40700 84901 3',
    backTagline: 'REÚNE A TU GRUPO. CADA DADO CAMBIA LA HISTORIA.',
    whyWorthIt:
      'Libertad narrativa absoluta: cada diálogo, hechizo o decisión improvisada altera el mundo real del juego. Un hito histórico del RPG.',
    synopsis:
      'Regresa a los Reinos Olvidados en una epopeya de camaradería, traición y sacrificio construida sobre las reglas de Dungeons & Dragons.',
    specs: 'PC / PS5 / Xbox · Pantalla dividida y online · 150 GB SSD',
    tags: ['Decisiones con impacto', 'Cooperativo 4 jugadores', 'Juego del Año']
  },
  {
    id: 'red-dead-2',
    steamId: 1174180,
    title: 'Red Dead Redemption 2',
    studio: 'Rockstar Games',
    publisher: 'Rockstar Games',
    year: 2018,
    era: 'moderno',
    caseTheme: 'xbox',
    genres: ['Mundo Abierto', 'Aventura', 'Acción'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 97,
    priceUSD: 19.79,
    originalPriceUSD: 59.99,
    discount: 67,
    playtime: '65 h',
    edition: 'Edición 2 Discos + Online',
    cover: steamCover(1174180),
    heroBg: steamHero(1174180),
    headerImg: steamHeader(1174180),
    fallbackCover: 'assets/images/cover_rdr2.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/ss_66b553f4c209476d3e4ce25fa4714002cc914c4f.600x338.jpg?t=1759502961',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1174180/ss_bac60bacbf5da8945103648c08d27d5e202444ca.600x338.jpg?t=1759502961'
    ],
    youtubeId: 'gmA6MrX81z4',
    featured: true,
    esrb: 'M',
    esrbText: 'Maduro 17+',
    players: '1 Jugador · 32 Online',
    resolution: '4K HDR · Dolby Atmos',
    storage: '150 GB',
    languages: 'Voces EN · Textos ES',
    serial: 'KRN-XBX-1174180',
    barcode: '7 10425 57219 7',
    backTagline: 'FORAJIDOS DE POR VIDA EN EL OCASO DEL OESTE.',
    whyWorthIt:
      'El mundo abierto más vivo y humano jamás creado. La historia de Arthur Morgan y la banda de Van der Linde es cine interactivo en estado puro.',
    synopsis:
      'Estados Unidos, 1899. Tras un atraco fallido, Arthur Morgan y su banda deben huir a través del corazón salvaje del país mientras los agentes federales estrechan el cerco.',
    specs: 'PC / Xbox / PlayStation · 12 GB RAM · 150 GB almacenamiento',
    tags: ['Historia inolvidable', 'Realismo visual', 'Gran oferta -67%']
  },
  {
    id: 'outer-wilds',
    steamId: 753640,
    title: 'Outer Wilds: Archaeologist Edition',
    studio: 'Mobius Digital',
    publisher: 'Annapurna Interactive',
    year: 2019,
    era: 'moderno',
    caseTheme: 'switch',
    genres: ['Indie', 'Aventura', 'Puzzle'],
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    score: 92,
    priceUSD: 18.99,
    originalPriceUSD: 37.99,
    discount: 50,
    playtime: '22 h',
    edition: 'Juego Base + Echoes of the Eye',
    cover: steamCover(753640),
    heroBg: steamHero(753640),
    headerImg: steamHeader(753640),
    fallbackCover: 'assets/images/cover_outerwilds.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/753640/ss_ec95a283483f0438be40d033f08b9d956e748d54.600x338.jpg?t=1785424341',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/753640/ss_09f0fa8d9b8d7da1408cf4e03303d896cbd9be18.600x338.jpg?t=1785424341'
    ],
    youtubeId: 'd6LGnVFTpoI',
    featured: false,
    esrb: 'E10+',
    esrbText: 'Todos +10',
    players: '1 Jugador',
    resolution: '4K · 60 FPS',
    storage: '8 GB',
    languages: 'Textos ES / EN',
    serial: 'KRN-NSW-0753640',
    barcode: '8 11949 03612 5',
    backTagline: '22 MINUTOS PARA DESCIFRAR EL UNIVERSO.',
    whyWorthIt:
      'Tu única herramienta de progreso es tu propio conocimiento. Un sistema solar vivo atrapado en un bucle temporal que solo se vive una primera vez.',
    synopsis:
      'Explora planetas que cambian minuto a minuto, traduce ruinas de una antigua especie espacial y descubre qué sucede antes de la supernova.',
    specs: 'PC / Switch / PS5 / Xbox · 8 GB RAM · 8 GB almacenamiento',
    tags: ['Misterio espacial', 'Diseño irrepetible', 'Banda sonora acústica']
  },
  {
    id: 'halo-mcc',
    steamId: 976730,
    title: 'Halo: The Master Chief Collection',
    studio: 'Bungie / 343 Industries',
    publisher: 'Xbox Game Studios',
    year: 2007,
    era: 'clasico',
    caseTheme: 'xbox360',
    genres: ['Acción', 'Aventura'],
    platforms: ['Xbox', 'PC', 'Retro'],
    score: 95,
    priceUSD: 9.99,
    originalPriceUSD: 39.99,
    discount: 75,
    playtime: '55 h',
    edition: '6 Clásicos de Xbox & Xbox 360',
    cover: steamCover(976730),
    heroBg: steamHero(976730),
    headerImg: steamHeader(976730),
    fallbackCover: 'assets/images/cover_colossus.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/976730/ss_ce40a85f9f7f3fa0f620a87f8919f3212ab8e46e.600x338.jpg?t=1791569963',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/976730/ss_62bbd86f4735893ef6cd53206cf8c93f87eb86ec.600x338.jpg?t=1791569963'
    ],
    youtubeId: 'a0T5e0x3t24',
    featured: true,
    esrb: 'M',
    esrbText: 'Maduro 17+',
    players: '1–4 Co-op · 16 Online',
    resolution: '4K · 120 FPS + Modo Clásico',
    storage: '43 GB (modular)',
    languages: 'Voces y Textos ES',
    serial: 'KRN-360-0976730',
    barcode: '8 85370 80621 2',
    backTagline: 'LA SAGA QUE DEFINIÓ LA ERA XBOX 360.',
    whyWorthIt:
      'Incluye Halo CE, Halo 2, Halo 3, ODST, Reach y Halo 4 en un solo paquete con cambio instantáneo entre gráficos clásicos y remasterizados.',
    synopsis:
      'Revive la campaña legendaria del Jefe Maestro desde la caída de Reach hasta el Arca, con modo cooperativo, Forge y multijugador clásico intacto.',
    specs: 'Xbox / PC · 8 GB RAM · Permite instalar cada campaña por separado',
    tags: ['Clásico Xbox 360', '6 juegos completos', 'Cooperativo legendario']
  },
  {
    id: 'chrono-trigger',
    steamId: 613830,
    title: 'Chrono Trigger',
    studio: 'Square',
    publisher: 'Square Enix',
    year: 1995,
    era: 'clasico',
    caseTheme: 'retro',
    genres: ['RPG', 'Aventura'],
    platforms: ['PC', 'Retro'],
    score: 96,
    priceUSD: 7.49,
    originalPriceUSD: 14.99,
    discount: 50,
    playtime: '25 h',
    edition: 'Edición Restaurada (1995)',
    cover: steamCover(613830),
    heroBg: steamHero(613830),
    headerImg: steamHeader(613830),
    fallbackCover: 'assets/images/cover_chrono.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/613830/ss_b92c46019720da5518bf69492c1f646f9c67dc29.600x338.jpg?t=1785246249',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/613830/ss_fe62096054041c5faf8f8d28b685bcc9bc5cdd77.600x338.jpg?t=1785246249'
    ],
    youtubeId: 'vqRxWAOy2fg',
    featured: false,
    esrb: 'E10+',
    esrbText: 'Todos +10',
    players: '1 Jugador',
    resolution: 'Pixel Art Original HD',
    storage: '2 GB',
    languages: 'Textos ES / EN / JP',
    serial: 'KRN-RET-0613830',
    barcode: '6 62248 90814 4',
    backTagline: 'EL TIEMPO ES TU MEJOR ARMA. 13 FINALES.',
    whyWorthIt:
      'Ritmo perfecto sin relleno, 13 finales distintos, arte de Akira Toriyama y una de las bandas sonoras más queridas en la historia del videojuego.',
    synopsis:
      'Un accidente en la Feria del Milenio abre un portal temporal. Viaja desde la prehistoria hasta un futuro apocalíptico para cambiar el destino del planeta.',
    specs: 'Funciona en cualquier PC actual · 2 GB RAM · Guardado rápido y mando',
    tags: ['Obra cumbre 16-bit', 'Viajes en el tiempo', '13 finales']
  },
  {
    id: 'silent-hill-2',
    steamId: 2124490,
    title: 'Silent Hill 2',
    studio: 'Team Silent / Bloober',
    publisher: 'Konami',
    year: 2001,
    era: 'clasico',
    caseTheme: 'ps5',
    genres: ['Terror', 'Aventura', 'Puzzle'],
    platforms: ['PC', 'PlayStation', 'Retro'],
    score: 94,
    priceUSD: 34.99,
    originalPriceUSD: 69.99,
    discount: 50,
    playtime: '16 h',
    edition: 'Clásico 2001 + Remake HD',
    cover: steamCover(2124490),
    heroBg: steamHero(2124490),
    headerImg: steamHeader(2124490),
    fallbackCover: 'assets/images/cover_silenthill2.webp',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2124490/ss_1fdda21610fa23d0ce20b5c44fab8aebd509c5cb.600x338.jpg?t=1744248682',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2124490/ss_b20363454a190d737e5ff8e6410d66f0034bd807.600x338.jpg?t=1744248682'
    ],
    youtubeId: 'pyC_qiW_4ZY',
    featured: false,
    esrb: 'M',
    esrbText: 'Maduro 17+',
    players: '1 Jugador',
    resolution: '4K HDR · Audio 3D',
    storage: '50 GB SSD',
    languages: 'Voces EN/JP · Textos ES',
    serial: 'KRN-PS5-2124490',
    barcode: '0 83717 20365 0',
    backTagline: 'EN MIS SUEÑOS INQUIETOS, VEO ESE PUEBLO.',
    whyWorthIt:
      'Redefinió el terror psicológico en el medio interactivo. Su simbolismo, niebla atmosférica y música de Akira Yamaoka siguen siendo insuperables.',
    synopsis:
      'Tras recibir una carta de su esposa fallecida, James Sunderland regresa al pueblo envuelto en niebla de Silent Hill, donde la memoria cobra forma física.',
    specs: 'PC / PS5 · Audio espacial 3D · Subtítulos completos en español',
    tags: ['Terror psicológico', 'Historia adulta', 'Clásico de culto']
  },
  {
    id: 'portal-2',
    steamId: 620,
    title: 'Portal 2',
    studio: 'Valve',
    publisher: 'Valve',
    year: 2011,
    era: 'clasico',
    caseTheme: 'xbox360',
    genres: ['Puzzle', 'Aventura'],
    platforms: ['PC', 'Nintendo', 'Xbox'],
    score: 95,
    priceUSD: 4.99,
    originalPriceUSD: 9.99,
    discount: 50,
    playtime: '14 h',
    edition: 'Edición Campaña + Cooperativo',
    cover: steamCover(620),
    heroBg: steamHero(620),
    headerImg: steamHeader(620),
    fallbackCover: 'assets/images/cover_portal2.svg',
    screenshots: [
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/ss_f3f6787d74739d3b2ec8a484b5c994b3d31ef325.600x338.jpg?t=1790187113',
      'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/620/ss_6a4f5afdaa98402de9cf0b59fed27bab3256a6f4.600x338.jpg?t=1790187113'
    ],
    youtubeId: 'tax4e4hBBZc',
    featured: false,
    esrb: 'E10+',
    esrbText: 'Todos +10',
    players: '1–2 Cooperativo',
    resolution: '4K · 60–144 FPS',
    storage: '8 GB',
    languages: 'Voces y Textos ES',
    serial: 'KRN-360-0000620',
    barcode: '0 14633 19532 3',
    backTagline: 'PIENSA CON PORTALES. LA CIENCIA CONTINÚA.',
    whyWorthIt:
      'Ingeniería de puzles brillante combinada con uno de los guiones más agudos y memorables de la era Xbox 360 y PC. Imprescindible en solitario o cooperativo.',
    synopsis:
      'Despierta siglos después en los laboratorios derruidos de Aperture Science, domina geles, puentes de luz y física de portales frente al ingenio de GLaDOS.',
    specs: 'PC / Xbox / Switch · Corre en cualquier equipo · Co-op pantalla dividida',
    tags: ['Clásico Xbox 360', 'Cooperativo 2 jugadores', 'Imprescindible']
  }
];

export const NEWS_ITEMS = [
  {
    id: 'news-expedition-patch',
    category: 'Novedades',
    date: '22 nov 2026',
    readTime: '3 min',
    title: 'Clair Obscur: Expedition 33 lanza el parche v1.5.5 con modo foto y mejoras de rendimiento',
    excerpt:
      'Sandfall Interactive suma nuevas opciones de cámara libre, balance en combates opcionales de final de juego y certificación total en portátiles.',
    image: steamHeader(1903340),
    relatedGameId: 'expedition-33',
    body: [
      'La actualización v1.5.5 de Clair Obscur: Expedition 33 ya se encuentra disponible para PC, PlayStation 5 y Xbox Series X|S, consolidando el excelente soporte postlanzamiento del estudio francés.',
      'Entre las novedades más celebradas por la comunidad se encuentra un modo foto minimalista con filtros pictóricos inspirados en la Belle Époque, ajustes de latencia en el bloqueo perfecto a 60 FPS y optimizaciones de memoria para consolas portátiles.',
      'En Krono el título se mantiene con un 17% de descuento esta semana y además es compatible con nuestro cupón comunitario SENA2026.'
    ]
  },
  {
    id: 'news-silksong-record',
    category: 'Lanzamientos',
    date: '20 nov 2026',
    readTime: '4 min',
    title: 'Hollow Knight: Silksong lidera los más jugados en portátiles y nominaciones del año',
    excerpt:
      'Team Cherry confirma que Pharloom sigue sumando récords de jugadores simultáneos gracias a su fluidez a 120 FPS y precio accesible.',
    image: steamHeader(1030300),
    relatedGameId: 'silksong',
    body: [
      'Hollow Knight: Silksong continúa encabezando las listas de títulos más jugados en Steam Deck, Nintendo Switch y PC, destacándose como uno de los lanzamientos independientes mejor valorados de la historia reciente.',
      'Los jugadores resaltan especialmente el ritmo acrobático de Hornet, la verticalidad de sus escenarios y la calidad de la banda sonora orquestal de Christopher Larkin.',
      'Su edición digital con banda sonora se mantiene disponible desde $19.99 USD sin microtransacciones ni pases de temporada.'
    ]
  },
  {
    id: 'news-mhwilds-ascendance',
    category: 'Novedades',
    date: '18 nov 2026',
    readTime: '3 min',
    title: 'Capcom adelanta Monster Hunter Wilds: Ascendance y celebra rebajas en el juego base',
    excerpt:
      'La futura expansión prevista para 2027 promete una nueva región glacial y monstruos ancianos; mientras tanto, el juego base recibe mejoras de clima dinámico.',
    image: steamHeader(2246340),
    relatedGameId: 'monster-hunter-wilds',
    body: [
      'Capcom reveló los primeros detalles oficiales de Monster Hunter Wilds: Ascendance, la gran expansión de rango maestro que ampliará la frontera de las Tierras Prohibidas en 2027.',
      'Antes de su llegada, el equipo continúa liberando eventos cooperativos multiplataforma gratuitos cada mes, permitiendo que cazadores de PC, Xbox y PlayStation formen escuadrones sin barreras.',
      'Si aún no inicias tu cacería, la edición de lanzamiento cuenta con descuento activo en nuestro catálogo.'
    ]
  },
  {
    id: 'news-retro-preservation',
    category: 'Retro',
    date: '14 nov 2026',
    readTime: '5 min',
    title: 'Por qué los clásicos de Xbox 360 y 16-bit vuelven a conquistar a nuevos jugadores',
    excerpt:
      'De Chrono Trigger (1995) a Halo 3 y Portal 2: el auge de las bibliotecas curadas con cajas físicas, manuales digitales y partidas sin relleno.',
    image: steamHeader(976730),
    relatedGameId: 'halo-mcc',
    body: [
      'Frente a catálogos saturados con miles de lanzamientos semanales, cada vez más jugadores regresan a obras clásicas que demostraron que un gran diseño de niveles envejece mejor que cualquier moda gráfica.',
      'Interfaces históricas como Aurora en Xbox 360 marcaron a una generación al tratar cada videojuego como una pieza coleccionable: con su carátula frontal, contraportada informativa, disco físico y sinopsis inmediata.',
      'En Krono rescatamos ese espíritu: puedes inspeccionar cada caja en 3D, voltear su reverso y extraer el disco antes de añadirlo a tu colección.'
    ]
  },
  {
    id: 'news-november-deals',
    category: 'Ofertas',
    date: '11 nov 2026',
    readTime: '2 min',
    title: 'Especial de cierre de año: descuentos hasta del 75% en clásicos y modernos esenciales',
    excerpt:
      'Halo: The Master Chief Collection (-75%), Red Dead Redemption 2 (-67%) y Outer Wilds (-50%) encabezan la selección de ofertas verificadas.',
    image: steamHeader(1174180),
    relatedGameId: 'red-dead-2',
    body: [
      'Durante todo noviembre activamos nuestra selección de ofertas curadas con rebajas reales sobre títulos con calificación superior a 90/100.',
      'Además de los descuentos directos en portada, puedes aplicar los cupones SENA2026 (-20% adicional) o KRONO15 (-15%) directamente dentro del carrito antes de generar tus claves digitales.',
      'Todos los pedidos incluyen respaldo en tu biblioteca de cuenta y garantía de satisfacción de 14 días.'
    ]
  },
  {
    id: 'news-hades2-postlaunch',
    category: 'Lanzamientos',
    date: '08 nov 2026',
    readTime: '3 min',
    title: 'Hades II amplía su contenido postlanzamiento con nuevas pruebas olímpicas y ajustes',
    excerpt:
      'Supergiant Games incorpora retos de alta dificultad, nuevas bendiciones duales y mejoras de accesibilidad en español latinoamericano.',
    image: steamHeader(1145350),
    relatedGameId: 'hades-2',
    body: [
      'Tras el aclamado estreno de su versión 1.0, Supergiant Games publicó una actualización centrada en equilibrar armas nocturnas y expandir las interacciones en la Encrucijada.',
      'El parche también pule la legibilidad tipográfica en pantallas móviles y portátiles, reafirmando a Hades II como una referencia absoluta del género roguelike.'
    ]
  }
];

export const PROMO_CODES = {
  KRONO15: { percent: 15, label: '15% de descuento de bienvenida' },
  SENA2026: { percent: 20, label: '20% de descuento comunidad académica' },
  RETRO10: { percent: 10, label: '10% en tu colección curada' }
};

export const DEMO_SOCIAL_ACCOUNTS = {
  google: {
    provider: 'Google',
    color: '#4285F4',
    defaultName: 'Camila Mendoza',
    defaultHandle: 'camila.mendoza@gmail.com',
    avatarInitials: 'CM'
  },
  facebook: {
    provider: 'Facebook',
    color: '#1877F2',
    defaultName: 'Mateo Rojas',
    defaultHandle: 'mateo.rojas.play@facebook.com',
    avatarInitials: 'MR'
  },
  discord: {
    provider: 'Discord',
    color: '#5865F2',
    defaultName: 'Valeria_GG',
    defaultHandle: '@valeria_gg#2026',
    avatarInitials: 'VG'
  }
};
