/**
 * KRONO — Servicio de Catálogo de 500 Videojuegos Verificados (Fase 3, 6 y 7)
 * Carga progresiva, búsqueda con autocompletado/historial, filtros combinados y similares.
 */

import { GAMES as FALLBACK_GAMES } from '../data.js';

const SEARCH_HISTORY_KEY = 'krono_search_history_v1';

export const CATALOG_PLATFORMS = [
  'PlayStation 5',
  'PlayStation 4',
  'PlayStation 3',
  'Xbox Series X/S',
  'Xbox One',
  'Xbox 360',
  'Nintendo Switch 2',
  'Nintendo Switch',
  'PC',
  'Steam',
  'Epic Games Store',
  'Retro'
];

export const CATALOG_GENRES = [
  'Acción',
  'Aventura',
  'RPG',
  'Mundo Abierto',
  'Indie',
  'Estrategia',
  'Simulación',
  'Terror',
  'Deportes y Carreras',
  'Lucha',
  'Puzzle'
];

let cachedCatalog = null;

/**
 * Carga el catálogo completo de 500 videojuegos verificados desde data/catalog-500.json
 * con respaldo automático al conjunto local si ocurre un error de red.
 */
export async function loadCatalog() {
  if (cachedCatalog) return cachedCatalog;
  try {
    const resp = await fetch('data/catalog-500.json', { cache: 'default' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!Array.isArray(data.games) || data.games.length === 0) {
      throw new Error('Catálogo vacío');
    }
    cachedCatalog = {
      meta: data.meta || { total: data.games.length, lastUpdated: '2026-11-24', sources: [] },
      games: data.games.map(normalizeGame)
    };
    return cachedCatalog;
  } catch (err) {
    console.warn('Usando catálogo local de respaldo:', err);
    cachedCatalog = {
      meta: {
        total: FALLBACK_GAMES.length,
        lastUpdated: '2026-11-24',
        sources: ['Respaldo local']
      },
      games: FALLBACK_GAMES.map(normalizeGame)
    };
    return cachedCatalog;
  }
}

function normalizeGame(g, idx) {
  return {
    ...g,
    slug: g.slug || g.id,
    developer: g.developer || g.studio || 'Estudio verificado',
    studio: g.studio || g.developer || 'Estudio verificado',
    publisher: g.publisher || g.developer || g.studio || 'Editor verificado',
    franchise: g.franchise || g.title,
    releaseDate: g.releaseDate || String(g.year || ''),
    description: g.description || g.synopsis || '',
    synopsis: g.synopsis || g.description || '',
    format: g.format || 'Físico y Digital',
    availabilityStatus: g.availabilityStatus || 'Catálogo informativo · Consultar stock',
    ratingSource: g.ratingSource || 'Fuente pública verificada',
    editions: Array.isArray(g.editions) && g.editions.length ? g.editions : [g.edition || 'Edición Estándar'],
    gameModes: Array.isArray(g.gameModes) && g.gameModes.length ? g.gameModes : ['Un jugador'],
    sources: Array.isArray(g.sources) ? g.sources : [],
    trailerId: g.trailerId ?? g.youtubeId ?? null,
    youtubeId: g.youtubeId ?? g.trailerId ?? null,
    popularityRank: g.popularityRank || idx + 1,
    lastUpdated: g.lastUpdated || '2026-11-24'
  };
}

/**
 * Filtra y ordena el catálogo de 500 videojuegos aplicando todos los filtros de forma conjunta.
 */
export function filterAndSortCatalog(games, filters, scorerFn) {
  let list = games.map((game) => ({
    game,
    ...scorerFn(game)
  }));

  // 1. Sección principal
  switch (filters.section) {
    case 'lanzamiento':
      list = list.filter(({ game }) => game.era === 'lanzamiento' || game.year >= 2025);
      break;
    case 'moderno':
      list = list.filter(({ game }) => game.era === 'moderno');
      break;
    case 'clasico':
      list = list.filter(({ game }) => game.era === 'clasico');
      break;
    case 'ofertas':
      list = list.filter(({ game }) => game.discount > 0);
      break;
    case 'fisico':
      list = list.filter(({ game }) => game.format.toLowerCase().includes('físico'));
      break;
    case 'digital':
      list = list.filter(({ game }) => game.format.toLowerCase().includes('digital'));
      break;
    case 'gratis':
      list = list.filter(({ game }) => game.priceUSD === 0);
      break;
    case 'parati':
      list = list.sort((a, b) => b.affinity - a.affinity).slice(0, 36);
      break;
    default:
      break;
  }

  // 2. Plataforma exacta o familia
  if (filters.platform && filters.platform !== 'all') {
    list = list.filter(({ game }) => game.platforms.includes(filters.platform));
  }

  // 3. Género
  if (filters.genre && filters.genre !== 'all') {
    list = list.filter(({ game }) => game.genres.includes(filters.genre));
  }

  // 4. Rango de precio (en USD base)
  if (filters.priceRange && filters.priceRange !== 'all') {
    if (filters.priceRange === 'free') {
      list = list.filter(({ game }) => game.priceUSD === 0);
    } else if (filters.priceRange === 'under20') {
      list = list.filter(({ game }) => game.priceUSD > 0 && game.priceUSD <= 20);
    } else if (filters.priceRange === '20to50') {
      list = list.filter(({ game }) => game.priceUSD > 20 && game.priceUSD <= 50);
    } else if (filters.priceRange === 'over50') {
      list = list.filter(({ game }) => game.priceUSD > 50);
    }
  }

  // 5. Año / periodo
  if (filters.yearRange && filters.yearRange !== 'all') {
    if (filters.yearRange === '2025-2026') list = list.filter(({ game }) => game.year >= 2025);
    else if (filters.yearRange === '2020-2024') list = list.filter(({ game }) => game.year >= 2020 && game.year <= 2024);
    else if (filters.yearRange === '2015-2019') list = list.filter(({ game }) => game.year >= 2015 && game.year <= 2019);
    else if (filters.yearRange === '2010-2014') list = list.filter(({ game }) => game.year >= 2010 && game.year <= 2014);
    else if (filters.yearRange === 'pre2010') list = list.filter(({ game }) => game.year < 2010);
  }

  // 6. Calificación mínima
  if (filters.minScore && filters.minScore !== 'all') {
    const min = Number(filters.minScore);
    list = list.filter(({ game }) => game.score >= min);
  }

  // 7. Clasificación por edades (ESRB)
  if (filters.esrb && filters.esrb !== 'all') {
    list = list.filter(({ game }) => game.esrb === filters.esrb);
  }

  // 8. Formato (Físico y Digital / Solo Digital)
  if (filters.format && filters.format !== 'all') {
    if (filters.format === 'fisico') {
      list = list.filter(({ game }) => game.format.toLowerCase().includes('físico'));
    } else if (filters.format === 'solo-digital') {
      list = list.filter(({ game }) => game.format === 'Digital');
    }
  }

  // 9. Búsqueda textual multi-campo (nombre, franquicia, dev, editor, plataforma, género, año, ESRB, precio)
  if (filters.search && filters.search.trim()) {
    const tokens = filters.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    list = list.filter(({ game }) => {
      const priceStr = game.priceUSD === 0 ? 'gratis free' : `${game.priceUSD}`;
      const hay = `${game.title} ${game.franchise} ${game.developer} ${game.publisher} ${game.platforms.join(' ')} ${game.genres.join(' ')} ${game.year} ${game.esrb} ${game.esrbText} ${game.format} ${priceStr}`.toLowerCase();
      return tokens.every((t) => hay.includes(t));
    });
  }

  // 10. Ordenamiento
  switch (filters.sort) {
    case 'popular':
      list.sort((a, b) => a.game.popularityRank - b.game.popularityRank);
      break;
    case 'score':
      list.sort((a, b) => b.game.score - a.game.score || a.game.popularityRank - b.game.popularityRank);
      break;
    case 'newest':
      list.sort((a, b) => b.game.year - a.game.year || b.game.score - a.game.score);
      break;
    case 'oldest':
      list.sort((a, b) => a.game.year - b.game.year || b.game.score - a.game.score);
      break;
    case 'price-asc':
      list.sort((a, b) => a.game.priceUSD - b.game.priceUSD || b.game.score - a.game.score);
      break;
    case 'price-desc':
      list.sort((a, b) => b.game.priceUSD - a.game.priceUSD || b.game.score - a.game.score);
      break;
    default:
      list.sort((a, b) => b.affinity - a.affinity || a.game.popularityRank - b.game.popularityRank);
      break;
  }

  return list;
}

/**
 * Genera sugerencias de autocompletado en vivo (juegos, franquicias y estudios).
 */
export function getSearchSuggestions(games, query, limit = 7) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return [];

  const results = [];
  const seen = new Set();

  // Coincidencias por título exacto/inicio primero
  const titleMatches = games
    .filter((g) => g.title.toLowerCase().includes(q))
    .sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(q) ? 0 : 1;
      const bStarts = b.title.toLowerCase().startsWith(q) ? 0 : 1;
      return aStarts - bStarts || a.popularityRank - b.popularityRank;
    })
    .slice(0, 5);

  for (const g of titleMatches) {
    results.push({
      type: 'game',
      id: g.id,
      label: g.title,
      meta: `${g.year} · ${g.platforms.slice(0, 2).join(', ')} · Nota ${g.score}`
    });
    seen.add(g.title.toLowerCase());
  }

  // Coincidencias de franquicia o estudio
  for (const g of games) {
    if (results.length >= limit) break;
    if (g.franchise.toLowerCase().includes(q) && !seen.has(`f:${g.franchise.toLowerCase()}`)) {
      seen.add(`f:${g.franchise.toLowerCase()}`);
      results.push({ type: 'query', query: g.franchise, label: g.franchise, meta: 'Franquicia' });
    } else if (g.developer.toLowerCase().includes(q) && !seen.has(`d:${g.developer.toLowerCase()}`)) {
      seen.add(`d:${g.developer.toLowerCase()}`);
      results.push({ type: 'query', query: g.developer, label: g.developer, meta: 'Desarrollador' });
    }
  }

  return results.slice(0, limit);
}

export function getSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushSearchHistory(term) {
  const clean = String(term || '').trim();
  if (clean.length < 2) return getSearchHistory();
  const prev = getSearchHistory().filter((t) => t.toLowerCase() !== clean.toLowerCase());
  const next = [clean, ...prev].slice(0, 6);
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {
    // ignore
  }
}

/**
 * Obtiene juegos similares y de la misma franquicia para la ficha individual.
 */
export function getRelatedGames(games, targetGame, limit = 4) {
  return games
    .filter((g) => g.id !== targetGame.id)
    .map((g) => {
      let score = 0;
      if (g.franchise && g.franchise === targetGame.franchise) score += 45;
      if (g.developer && g.developer === targetGame.developer) score += 20;
      const sharedGenres = g.genres.filter((gn) => targetGame.genres.includes(gn)).length;
      score += sharedGenres * 12;
      const sharedPlatforms = g.platforms.filter((p) => targetGame.platforms.includes(p)).length;
      score += Math.min(8, sharedPlatforms * 2);
      return { game: g, relScore: score };
    })
    .sort((a, b) => b.relScore - a.relScore || b.game.score - a.game.score)
    .slice(0, limit)
    .map((x) => x.game);
}
