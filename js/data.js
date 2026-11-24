/**
 * KRONO — Catálogo curado de videojuegos (1995–2026)
 * Incluye nuevos lanzamientos, obras modernas esenciales y clásicos atemporales.
 */

export const USD_TO_COP = 4100;

export const ERAS = {
  lanzamiento: {
    id: 'lanzamiento',
    label: 'Nuevo lanzamiento',
    shortLabel: 'Lanzamiento',
    range: '2025 – 2026',
    description: 'Estrenos recientes y preventas destacadas que marcan la conversación actual.'
  },
  moderno: {
    id: 'moderno',
    label: 'Moderno esencial',
    shortLabel: 'Moderno',
    range: '2018 – 2024',
    description: 'Obras contemporáneas imprescindibles que redefinieron sus géneros.'
  },
  clasico: {
    id: 'clasico',
    label: 'Clásico atemporal',
    shortLabel: 'Clásico',
    range: '1995 – 2011',
    description: 'Juegos antiguos que siguen siendo tan brillantes hoy como el día de su estreno.'
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
    label: 'Fan de los clásicos',
    summary: 'Historias inolvidables y diseño atemporal',
    eras: ['clasico', 'moderno'],
    genres: ['RPG', 'Aventura', 'Puzzle'],
    platforms: ['PC', 'Retro', 'PlayStation'],
    budget: 'all'
  },
  {
    id: 'novedades',
    label: 'Estrenos 2025–2026',
    summary: 'Lo último en acción, mundos nuevos y preventas',
    eras: ['lanzamiento'],
    genres: ['Acción', 'RPG', 'Indie'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    budget: 'all'
  },
  {
    id: 'rpg',
    label: 'Amante del RPG',
    summary: 'Sistemas profundos, decisiones y grandes mundos',
    eras: ['lanzamiento', 'moderno', 'clasico'],
    genres: ['RPG', 'Estrategia', 'Mundo Abierto'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    budget: 'all'
  },
  {
    id: 'indie',
    label: 'Joyas indie y autor',
    summary: 'Propuestas creativas, dirección artística y puzles',
    eras: ['lanzamiento', 'moderno', 'clasico'],
    genres: ['Indie', 'Puzzle', 'Aventura'],
    platforms: ['PC', 'Nintendo'],
    budget: 'ofertas'
  }
];

export const GAMES = [
  {
    id: 'expedition-33',
    title: 'Clair Obscur: Expedition 33',
    studio: 'Sandfall Interactive',
    year: 2025,
    era: 'lanzamiento',
    genres: ['RPG', 'Estrategia', 'Aventura'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 94,
    priceUSD: 49.99,
    originalPriceUSD: 59.99,
    discount: 17,
    playtime: '38 h',
    edition: 'Edición Estándar Digital',
    cover: 'assets/images/cover_expedition.webp',
    youtubeId: 'ejgW-upPMgk',
    featured: true,
    whyWorthIt:
      'Combina el combate por turnos clásico con reacciones en tiempo real y una dirección artística inspirada en la Belle Époque francesa. Uno de los debuts más memorables de la década.',
    synopsis:
      'Una vez al año, la Pintora despierta y traza un número maldito en su monolito. Lidera la Expedición 33 en una travesía poética y táctica para romper el ciclo antes de que el tiempo se agote.',
    specs: 'Windows 10/11 · 16 GB RAM · 55 GB SSD · Compatible con mando',
    tags: ['Combate reactivo', 'Narrativa cinematográfica', 'Banda sonora orquestal']
  },
  {
    id: 'silksong',
    title: 'Hollow Knight: Silksong',
    studio: 'Team Cherry',
    year: 2025,
    era: 'lanzamiento',
    genres: ['Indie', 'Acción', 'Aventura'],
    platforms: ['PC', 'Nintendo', 'PlayStation', 'Xbox'],
    score: 95,
    priceUSD: 24.99,
    originalPriceUSD: null,
    discount: 0,
    playtime: '32 h',
    edition: 'Edición Digital + Banda Sonora',
    cover: 'assets/images/cover_silksong.webp',
    youtubeId: 'pFAknD_9U7c',
    featured: true,
    whyWorthIt:
      'Precisión milimétrica en plataformas, arte dibujado a mano cuadro por cuadro y un reino vertical lleno de secretos. Demuestra que el diseño artesanal supera cualquier presupuesto.',
    synopsis:
      'Encarna a Hornet, princesa protectora de Hallownest, y asciende hasta la cima de un reino desconocido gobernado por la seda y el canto, enfrentando más de 150 enemigos nuevos.',
    specs: 'Windows / macOS / Linux · 8 GB RAM · 9 GB almacenamiento · 120 FPS',
    tags: ['Metroidvania', 'Arte 2D artesanal', 'Jefes memorables']
  },
  {
    id: 'hades-2',
    title: 'Hades II',
    studio: 'Supergiant Games',
    year: 2025,
    era: 'lanzamiento',
    genres: ['Acción', 'Indie', 'RPG'],
    platforms: ['PC', 'Nintendo'],
    score: 94,
    priceUSD: 29.99,
    originalPriceUSD: 34.99,
    discount: 14,
    playtime: '45 h',
    edition: 'Edición Completa v1.0',
    cover: 'assets/images/cover_hades2.webp',
    youtubeId: 'l-iHDj3EwdI',
    featured: false,
    whyWorthIt:
      'Refina la fórmula roguelike perfecta con hechicería táctica, dos rutas completas de exploración y miles de líneas de diálogo reactivo que hacen que cada intento valga la pena.',
    synopsis:
      'Como Melinoë, princesa inmortal del Inframundo, domina las artes arcanas y recibe la bendición de los dioses del Olimpo para enfrentar a Cronos, el Titán del Tiempo.',
    specs: 'Windows 10/11 / Steam Deck verificado · 8 GB RAM · 10 GB SSD',
    tags: ['Roguelike', 'Rejugabilidad infinita', 'Mitología griega']
  },
  {
    id: 'monster-hunter-wilds',
    title: 'Monster Hunter Wilds',
    studio: 'Capcom',
    year: 2025,
    era: 'lanzamiento',
    genres: ['Acción', 'Mundo Abierto', 'Aventura'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 90,
    priceUSD: 59.99,
    originalPriceUSD: 69.99,
    discount: 14,
    playtime: '70 h',
    edition: 'Edición Lanzamiento',
    cover: 'assets/images/cover_mhwilds.webp',
    youtubeId: 'zyoBA0aCRNk',
    featured: false,
    whyWorthIt:
      'Ecosistemas vivos cuyo clima transforma el mapa en tiempo real, cooperativo multiplataforma fluido y un sistema de armas con una profundidad táctica sin rival.',
    synopsis:
      'Adéntrate en las Tierras Prohibidas como parte de la Comisión de Investigación, rastrea criaturas colosales y adapta tu estrategia mientras el desierto cambia entre tormenta y abundancia.',
    specs: 'Cross-play PC / PS5 / Xbox · 16 GB RAM · Cooperativo 1–4 jugadores',
    tags: ['Cooperativo online', 'Ecosistema dinámico', 'Cacería táctica']
  },
  {
    id: 'elden-ring',
    title: 'Elden Ring: Shadow of the Erdtree Edition',
    studio: 'FromSoftware',
    year: 2024,
    era: 'moderno',
    genres: ['RPG', 'Mundo Abierto', 'Acción'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 96,
    priceUSD: 54.99,
    originalPriceUSD: 79.99,
    discount: 31,
    playtime: '95 h',
    edition: 'Juego Base + Expansión',
    cover: 'assets/images/cover_eldenring.webp',
    youtubeId: 'qLZenOn7WUo',
    featured: true,
    whyWorthIt:
      'El estándar moderno de la exploración libre: sin marcadores intrusivos, recompensa la curiosidad pura con escenarios majestuosos y combates inolvidables.',
    synopsis:
      'Recorre las Tierras Intermedias y el Reino de las Sombras para restaurar el Círculo de Elden. Construye tu estilo de combate libremente entre espadas colosales, magia y sigilo.',
    specs: 'Windows 10/11 · 16 GB RAM · 80 GB SSD · Multijugador cooperativo',
    tags: ['Exploración orgánica', 'Obra maestra moderna', 'Incluye DLC']
  },
  {
    id: 'baldurs-gate-3',
    title: "Baldur's Gate 3",
    studio: 'Larian Studios',
    year: 2023,
    era: 'moderno',
    genres: ['RPG', 'Estrategia', 'Aventura'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 96,
    priceUSD: 47.99,
    originalPriceUSD: 59.99,
    discount: 20,
    playtime: '110 h',
    edition: 'Edición Definitiva Digital',
    cover: 'assets/images/cover_bg3.webp',
    youtubeId: '1T22wNvoNiU',
    featured: false,
    whyWorthIt:
      'Libertad narrativa absoluta: cada conversación, hechizo o decisión improvisada tiene consecuencias reales. Un hito irrepetible del rol por turnos moderno.',
    synopsis:
      'Reúne a tu grupo y regresa a los Reinos Olvidados en una epopeya de camaradería, traición y sacrificio basada en las reglas de Dungeons & Dragons.',
    specs: 'Windows / macOS · Cooperativo local y online · 150 GB SSD',
    tags: ['Decisiones con impacto', 'Cooperativo 4 jugadores', 'Juego del Año']
  },
  {
    id: 'red-dead-2',
    title: 'Red Dead Redemption 2',
    studio: 'Rockstar Games',
    year: 2018,
    era: 'moderno',
    genres: ['Mundo Abierto', 'Aventura', 'Acción'],
    platforms: ['PC', 'PlayStation', 'Xbox'],
    score: 97,
    priceUSD: 19.79,
    originalPriceUSD: 59.99,
    discount: 67,
    playtime: '65 h',
    edition: 'Edición Historia + Online',
    cover: 'assets/images/cover_rdr2.webp',
    youtubeId: 'gmA6MrX81z4',
    featured: false,
    whyWorthIt:
      'El mundo abierto más humano y detallado jamás construido. Su narrativa sobre el fin de una era y la redención de Arthur Morgan permanece grabada durante años.',
    synopsis:
      'Estados Unidos, 1899. Tras un atraco fallido, Arthur Morgan y la banda de Van der Linde deben huir a través del corazón salvaje del país mientras luchan por sobrevivir.',
    specs: 'Windows 10/11 · 12 GB RAM · 150 GB almacenamiento · Modo foto',
    tags: ['Historia inolvidable', 'Realismo visual', 'Gran oferta']
  },
  {
    id: 'outer-wilds',
    title: 'Outer Wilds: Archaeologist Edition',
    studio: 'Mobius Digital',
    year: 2019,
    era: 'moderno',
    genres: ['Indie', 'Aventura', 'Puzzle'],
    platforms: ['PC', 'PlayStation', 'Xbox', 'Nintendo'],
    score: 92,
    priceUSD: 18.99,
    originalPriceUSD: 37.99,
    discount: 50,
    playtime: '22 h',
    edition: 'Juego Base + Echoes of the Eye',
    cover: 'assets/images/cover_outerwilds.webp',
    youtubeId: 'd6LGnVFTpoI',
    featured: false,
    whyWorthIt:
      'Tu única progresión es tu propio conocimiento. Un sistema solar en miniatura atrapado en un bucle de 22 minutos que solo puede jugarse una primera vez en la vida.',
    synopsis:
      'Explora planetas que se transforman ante tus ojos, descifra ruinas de una civilización desaparecida y descubre qué ocurre en el corazón de tu sistema solar antes de la supernova.',
    specs: 'Windows / Switch / Consolas · 8 GB RAM · 8 GB almacenamiento',
    tags: ['Misterio espacial', 'Diseño irrepetible', 'Banda sonora acústica']
  },
  {
    id: 'chrono-trigger',
    title: 'Chrono Trigger',
    studio: 'Square',
    year: 1995,
    era: 'clasico',
    genres: ['RPG', 'Aventura'],
    platforms: ['PC', 'Retro'],
    score: 96,
    priceUSD: 7.49,
    originalPriceUSD: 14.99,
    discount: 50,
    playtime: '25 h',
    edition: 'Edición Restaurada (1995)',
    cover: 'assets/images/cover_chrono.webp',
    youtubeId: 'vqRxWAOy2fg',
    featured: false,
    whyWorthIt:
      'Ritmo perfecto sin relleno, 13 finales distintos, viajes entre épocas y una de las mejores bandas sonoras de la historia. Treinta años después sigue dando cátedra de diseño RPG.',
    synopsis:
      'Un accidente en la Feria del Milenio abre un portal temporal. Viaja desde la prehistoria hasta un futuro apocalíptico junto a un grupo inolvidable para salvar el destino del planeta.',
    specs: 'Funciona en cualquier PC moderno · 2 GB RAM · Soporta guardado rápido',
    tags: ['Obra cumbre 16-bit', 'Viajes en el tiempo', '13 finales']
  },
  {
    id: 'shadow-colossus',
    title: 'Shadow of the Colossus',
    studio: 'Team Ico / Bluepoint',
    year: 2005,
    era: 'clasico',
    genres: ['Aventura', 'Acción', 'Puzzle'],
    platforms: ['PlayStation', 'Retro'],
    score: 93,
    priceUSD: 14.99,
    originalPriceUSD: 29.99,
    discount: 50,
    playtime: '12 h',
    edition: 'Edición Remasterizada + Clásica',
    cover: 'assets/images/cover_colossus.webp',
    youtubeId: 'pdZQ98mWeto',
    featured: true,
    whyWorthIt:
      'La máxima expresión del minimalismo en videojuegos: sin enemigos comunes ni misiones secundarias, solo tú, tu caballo Agro y dieciséis colosos monumentales en tierras prohibidas.',
    synopsis:
      'Recorre un vasto territorio silencioso guiado por la luz de tu espada para derrotar a dieciséis gigantes ancestrales y devolver la vida a una joven.',
    specs: 'PlayStation 4 / PS5 (60 FPS) · Modo Cinemático y Rendimiento',
    tags: ['Minimalismo puro', 'Clásico de culto', 'Dirección artística']
  },
  {
    id: 'silent-hill-2',
    title: 'Silent Hill 2',
    studio: 'Team Silent / Bloober',
    year: 2001,
    era: 'clasico',
    genres: ['Terror', 'Aventura', 'Puzzle'],
    platforms: ['PC', 'PlayStation', 'Retro'],
    score: 94,
    priceUSD: 34.99,
    originalPriceUSD: 69.99,
    discount: 50,
    playtime: '16 h',
    edition: 'Pack Clásico + Edición Renovada',
    cover: 'assets/images/cover_silenthill2.webp',
    youtubeId: 'pyC_qiW_4ZY',
    featured: false,
    whyWorthIt:
      'Redefinió el terror psicológico en el medio interactivo. Su simbolismo, diseño sonoro de Akira Yamaoka y madurez emocional siguen siendo insuperables.',
    synopsis:
      'Al recibir una carta de su esposa fallecida, James Sunderland viaja al pueblo envuelto en niebla de Silent Hill, donde la culpa y la memoria cobran forma física.',
    specs: 'PC / PS5 · Audio espacial 3D · Subtítulos completos en español',
    tags: ['Terror psicológico', 'Historia adulta', 'Diseño sonoro icónico']
  },
  {
    id: 'portal-2',
    title: 'Portal 2',
    studio: 'Valve',
    year: 2011,
    era: 'clasico',
    genres: ['Puzzle', 'Aventura'],
    platforms: ['PC', 'Nintendo', 'Xbox'],
    score: 95,
    priceUSD: 4.99,
    originalPriceUSD: 9.99,
    discount: 50,
    playtime: '14 h',
    edition: 'Edición Campaña + Cooperativo',
    cover: 'assets/images/cover_portal2.svg',
    youtubeId: 'tax4e4hBBZc',
    featured: false,
    whyWorthIt:
      'Ingeniería de puzles brillante combinada con uno de los guiones más agudos e inteligentes jamás escritos en un videojuego. Perfecto tanto en solitario como en dúo.',
    synopsis:
      'Despierta siglos después en los laboratorios derruidos de Aperture Science, domina la física de portales, geles y haces de luz, y escapa del ingenio implacable de GLaDOS.',
    specs: 'Corre fluido en PC de gama baja · Cooperativo pantalla dividida y online',
    tags: ['Ingenioso y divertido', 'Cooperativo 2 jugadores', 'Imprescindible']
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
