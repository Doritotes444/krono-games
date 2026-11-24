import {
  CASE_THEMES,
  DEMO_SOCIAL_ACCOUNTS,
  ERAS,
  GAMES as FALLBACK_GAMES,
  NEWS_ITEMS as FALLBACK_NEWS,
  PROMO_CODES,
  TASTE_PRESETS
} from './data.js';
import {
  renderAuroraCase,
  setAuroraCaseState,
  toggleAuroraDisc
} from './components/aurora-case.js';
import { KRONO_CONFIG } from './config.js';
import {
  CATALOG_GENRES,
  CATALOG_PLATFORMS,
  clearSearchHistory,
  filterAndSortCatalog,
  getRelatedGames,
  getSearchHistory,
  getSearchSuggestions,
  loadCatalog,
  pushSearchHistory
} from './services/catalog-service.js';
import { loadVerifiedFxRate } from './services/fx-service.js';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  requestPasswordReset,
  sendPhoneOtp,
  signInWithEmailPassword,
  signInWithOAuthProvider,
  signUpWithEmailPassword,
  verifyPhoneOtp
} from './services/supabase-client.js';

const STORAGE_KEY = 'krono_store_state_v2';
const BASE_TITLE = 'KRONO — Tienda Especializada de Videojuegos, Cajas 3D y Noticias';

const defaultState = {
  theme: 'dark',
  currency: 'COP',
  user: null,
  prefs: {
    presetId: null,
    eras: [],
    genres: [],
    platforms: [],
    budget: 'all'
  },
  wishlist: [],
  cart: [],
  promoCode: null,
  library: [],
  orders: [],
  recentlyViewed: []
};

let state = loadState();
let catalogGames = FALLBACK_GAMES;
let catalogMeta = { total: FALLBACK_GAMES.length, lastUpdated: '2026-11-24', sources: [] };
let featuredGames = FALLBACK_GAMES.slice(0, 12);

let fxInfo = {
  rate: KRONO_CONFIG.currency.fallbackUsdToCop,
  source: KRONO_CONFIG.currency.rateSource,
  updatedAt: KRONO_CONFIG.currency.rateUpdatedAt,
  verifiedLive: false
};

let verifiedNewsData = {
  meta: { verifiedDate: '2026-11-24', totalArticles: 0, feeds: [], cachedFallback: false },
  gameOfTheMonth: null,
  articles: []
};

const defaultFilters = {
  section: 'todos',
  search: '',
  platform: 'all',
  genre: 'all',
  priceRange: 'all',
  yearRange: 'all',
  minScore: 'all',
  esrb: 'all',
  format: 'all',
  sort: 'popular'
};

let filterState = { ...defaultFilters };
let visibleCount = KRONO_CONFIG.catalog.pageSize;

let newsCategory = 'all';
let coverflowIndex = 0;
let coverflowCaseState = 'front'; // Reposo normal: 'front' | 'back' | 'open'
let coverflowDiscOut = false;

let authMode = 'login';
let pendingSocialProvider = null;
let generatedOtp = null;
let pendingPhoneFormatted = '';
let resumeCheckoutAfterAuth = false;
let draftPrefs = clonePrefs(state.prefs);

/* ==========================================================================
   Utilidades de estado, formato y personalización
   ========================================================================== */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(defaultState),
      ...parsed,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      prefs: { ...structuredClone(defaultState.prefs), ...(parsed.prefs || {}) }
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignorar en modo privado estricto
  }
}

function clonePrefs(p) {
  return {
    presetId: p.presetId || null,
    eras: [...(p.eras || [])],
    genres: [...(p.genres || [])],
    platforms: [...(p.platforms || [])],
    budget: p.budget || 'all'
  };
}

function hasCustomPrefs() {
  const { eras, genres, platforms, budget } = state.prefs;
  return eras.length > 0 || genres.length > 0 || platforms.length > 0 || budget !== 'all';
}

function findGameById(id) {
  return catalogGames.find((g) => g.id === id || g.slug === id);
}

function toCopAmount(usdAmount) {
  return Math.round((Number(usdAmount) * fxInfo.rate) / 100) * 100;
}

function formatCopExact(usdAmount) {
  if (Number(usdAmount) === 0) return '$0 COP';
  return `$${toCopAmount(usdAmount).toLocaleString('es-CO')} COP`;
}

function formatPrice(usdAmount) {
  if (Number(usdAmount) === 0) return 'Gratis';
  if (state.currency === 'USD') {
    return `$${Number(usdAmount).toFixed(2)} USD`;
  }
  return formatCopExact(usdAmount);
}

function getInitials(name) {
  const parts = String(name || 'U').trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

function generateKey(gameId) {
  const prefix = gameId.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  const block = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `KRN-${prefix}-${block()}-${block()}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    setTimeout(() => toast.remove(), 260);
  }, 3400);
}

function scoreGameForUser(game) {
  let points = (game.score || 80) * 0.45;
  const reasons = [];

  if (state.prefs.eras.includes(game.era)) {
    points += 24;
    reasons.push(ERAS[game.era]?.shortLabel || game.era);
  }

  const matchedGenres = (game.genres || []).filter((g) => state.prefs.genres.includes(g));
  if (matchedGenres.length > 0) {
    points += Math.min(28, matchedGenres.length * 16);
    reasons.push(matchedGenres[0]);
  }

  const matchedPlatforms = (game.platforms || []).filter((p) =>
    state.prefs.platforms.some((prefP) => p.toLowerCase().includes(prefP.toLowerCase()))
  );
  if (matchedPlatforms.length > 0) {
    points += 14;
    if (reasons.length < 2) reasons.push(`en ${matchedPlatforms[0]}`);
  }

  if (state.prefs.budget === 'ofertas' && (game.discount >= 20 || game.priceUSD <= 20)) {
    points += 14;
    reasons.push('Gran precio');
  }

  if (state.wishlist.includes(game.id)) points += 8;
  if (state.recentlyViewed.includes(game.id)) points += 4;

  const affinity = Math.min(99, Math.max(70, Math.round(points)));
  const reasonText =
    reasons.length > 0
      ? `Ideal para ti · ${reasons.slice(0, 2).join(' + ')}`
      : game.featured
        ? 'Selección editorial Krono'
        : '';

  return { affinity, reasonText, matched: reasons.length > 0 };
}

/* ==========================================================================
   Vitrina Aurora 3D CoverFlow (Portada normal -> Hover contraportada -> Clic abrir + disco)
   ========================================================================== */
function getCoverflowOffset(index, activeIndex, total) {
  let diff = index - activeIndex;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  if (diff < -2 || diff > 2) return 'hidden';
  return String(diff);
}

function renderAuroraCoverflow() {
  const track = document.getElementById('coverflowTrack');
  if (!featuredGames.length) return;
  if (coverflowIndex >= featuredGames.length) coverflowIndex = 0;

  track.innerHTML = featuredGames
    .map((game, index) => {
      const offset = getCoverflowOffset(index, coverflowIndex, featuredGames.length);
      const isActive = index === coverflowIndex;
      return `
        <div class="cf-slot" data-cf-index="${index}" data-offset="${offset}">
          ${renderAuroraCase(game, {
            idAttr: isActive ? 'auroraActiveCase' : '',
            initialState: isActive ? coverflowCaseState : 'front',
            discExtracted: isActive && coverflowDiscOut,
            lazy: Math.abs(Number(offset) || 0) > 1
          })}
        </div>
      `;
    })
    .join('');

  updateAuroraHud();
}

function updateAuroraPositions() {
  const slots = document.querySelectorAll('#coverflowTrack .cf-slot');
  slots.forEach((slot) => {
    const idx = Number(slot.dataset.cfIndex);
    const offset = getCoverflowOffset(idx, coverflowIndex, featuredGames.length);
    slot.dataset.offset = offset;
    const caseEl = slot.querySelector('.aurora-case');
    if (!caseEl) return;
    if (idx === coverflowIndex) {
      caseEl.id = 'auroraActiveCase';
      setAuroraCaseState(caseEl, coverflowCaseState);
      if (coverflowCaseState === 'open') {
        toggleAuroraDisc(caseEl, coverflowDiscOut);
      }
    } else {
      caseEl.removeAttribute('id');
      setAuroraCaseState(caseEl, 'front');
    }
  });
  updateAuroraHud();
}

function updateAuroraHud() {
  const game = featuredGames[coverflowIndex];
  if (!game) return;
  const theme = CASE_THEMES[game.caseTheme] || CASE_THEMES.pc;
  const bgImg = document.getElementById('auroraBgImg');
  bgImg.src = game.heroBg || game.headerImg || game.cover;
  bgImg.onerror = () => {
    bgImg.onerror = null;
    bgImg.src = game.fallbackCover;
  };

  document.getElementById('hudKicker').innerHTML = `
    <span>${escapeHtml(theme.short)}</span>
    <span>·</span>
    <span>${escapeHtml(ERAS[game.era]?.label || game.era)} (${escapeHtml(game.releaseDate)})</span>
    <span>·</span>
    <span>Nota ${game.score}/100</span>
    <span>·</span>
    <span>${coverflowIndex + 1} / ${featuredGames.length}</span>
  `;
  document.getElementById('hudTitle').textContent = game.title;
  document.getElementById('hudSub').textContent = `${game.developer} · ${game.platforms.slice(0, 3).join(', ')} · ${formatPrice(game.priceUSD)}${game.discount ? ` (-${game.discount}%)` : ''}`;

  document.getElementById('btnHudFlip').textContent =
    coverflowCaseState === 'back' ? '↺ Ver portada' : '↺ Contraportada';
  document.getElementById('btnHudOpen').textContent =
    coverflowCaseState === 'open' ? 'Cerrar caja' : 'Abrir caja 3D';
  document.getElementById('btnHudDisc').textContent =
    coverflowDiscOut ? '◉ Insertar disco' : '◉ Extraer disco';

  const inCart = state.cart.some((c) => c.id === game.id);
  const cartBtn = document.getElementById('btnHudCart');
  cartBtn.textContent = inCart ? 'En carrito ✓' : `Añadir · ${formatPrice(game.priceUSD)}`;
}

function stepCoverflow(delta) {
  coverflowIndex = (coverflowIndex + delta + featuredGames.length) % featuredGames.length;
  coverflowCaseState = 'front';
  coverflowDiscOut = false;
  updateAuroraPositions();
}

/* ==========================================================================
   Header, Personalización y Contadores del Catálogo de 500 Juegos
   ========================================================================== */
function setElHidden(el, isHidden) {
  if (!el) return;
  if (isHidden) el.setAttribute('hidden', '');
  else el.removeAttribute('hidden');
}

function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const sun = document.getElementById('iconSun');
  const moon = document.getElementById('iconMoon');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (state.theme === 'dark') {
    setElHidden(sun, false);
    setElHidden(moon, true);
    metaTheme?.setAttribute('content', '#0B0D11');
  } else {
    setElHidden(sun, true);
    setElHidden(moon, false);
    metaTheme?.setAttribute('content', '#F5F4F0');
  }
}

function syncCurrencyButtons() {
  document.querySelectorAll('[data-currency]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.currency === state.currency);
  });
}

function updateHeaderUI() {
  const totalCartItems = state.cart.reduce((sum, item) => sum + item.qty, 0);
  const cartBadge = document.getElementById('cartBadge');
  cartBadge.textContent = String(totalCartItems);
  cartBadge.dataset.count = String(totalCartItems);

  const wishBadge = document.getElementById('wishlistBadge');
  wishBadge.textContent = String(state.wishlist.length);
  wishBadge.dataset.count = String(state.wishlist.length);

  const avatar = document.getElementById('headerAvatar');
  const userIcon = document.getElementById('headerUserIcon');
  const label = document.getElementById('headerAccountLabel');
  const mobileAuthBtn = document.getElementById('btnMobileAuth');

  if (state.user) {
    avatar.textContent = state.user.initials;
    setElHidden(avatar, false);
    setElHidden(userIcon, true);
    label.textContent = state.user.name.split(' ')[0];
    mobileAuthBtn.textContent = `Mi cuenta (${state.user.name.split(' ')[0]})`;
  } else {
    setElHidden(avatar, true);
    setElHidden(userIcon, false);
    label.textContent = 'Iniciar sesión';
    mobileAuthBtn.textContent = 'Iniciar sesión o registrarme';
  }
}

function renderPersonalizeRibbon() {
  const heading = document.getElementById('personalizeHeading');
  const summary = document.getElementById('personalizeSummary');
  const chipsContainer = document.getElementById('presetChips');

  if (state.user) {
    const first = state.user.name.split(' ')[0];
    heading.textContent = hasCustomPrefs()
      ? `Experiencia personalizada para ${first}`
      : `Hola, ${first} — ajusta tu catálogo`;
  } else {
    heading.textContent = hasCustomPrefs()
      ? 'Tu perfil de gustos está activo'
      : 'Adapta Krono a tu forma de jugar';
  }

  if (hasCustomPrefs()) {
    const parts = [];
    if (state.prefs.eras.length) {
      parts.push(`Épocas: ${state.prefs.eras.map((e) => ERAS[e]?.shortLabel || e).join(', ')}`);
    }
    if (state.prefs.genres.length) {
      parts.push(`Géneros: ${state.prefs.genres.slice(0, 3).join(', ')}`);
    }
    if (state.prefs.platforms.length) {
      parts.push(`Plataformas: ${state.prefs.platforms.slice(0, 3).join(', ')}`);
    }
    if (state.prefs.budget === 'ofertas') parts.push('Prioridad: Ofertas');
    summary.textContent = parts.join(' · ');
  } else {
    summary.textContent =
      'Elige un perfil rápido o configura tus épocas, géneros y consolas favoritas para reordenar los 500 videojuegos a tu medida.';
  }

  chipsContainer.innerHTML = TASTE_PRESETS.map(
    (preset) => `
      <button
        type="button"
        class="chip ${state.prefs.presetId === preset.id ? 'active' : ''}"
        data-preset="${preset.id}"
      >
        ${escapeHtml(preset.label)}
      </button>
    `
  ).join('');
}

function updateTabCounts() {
  const setTxt = (id, n) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(n);
  };
  setTxt('countTodos', catalogGames.length);
  setTxt('countParati', Math.min(36, catalogGames.length));
  setTxt('countLanzamiento', catalogGames.filter((g) => g.era === 'lanzamiento' || g.year >= 2025).length);
  setTxt('countModerno', catalogGames.filter((g) => g.era === 'moderno').length);
  setTxt('countClasico', catalogGames.filter((g) => g.era === 'clasico').length);
  setTxt('countOfertas', catalogGames.filter((g) => g.discount > 0).length);
  setTxt('countFisico', catalogGames.filter((g) => g.format.toLowerCase().includes('físico')).length);
  setTxt('countGratis', catalogGames.filter((g) => g.priceUSD === 0).length);

  const metaEl = document.getElementById('catalogMetaInfo');
  if (metaEl) {
    metaEl.textContent = `${catalogGames.length} videojuegos verificados · Actualizado ${catalogMeta.lastUpdated}`;
  }
}

/* ==========================================================================
   Buscador con Autocompletado, Historial y Chips Removibles (Fase 6)
   ========================================================================== */
function renderSearchDropdown() {
  const dropdown = document.getElementById('searchDropdown');
  const input = document.getElementById('searchInput');
  const q = input.value.trim();

  if (q.length >= 2) {
    const suggestions = getSearchSuggestions(catalogGames, q, 7);
    if (suggestions.length === 0) {
      dropdown.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    dropdown.innerHTML = `
      <div class="search-dropdown__header">
        <span>Sugerencias instantáneas</span>
        <span>${suggestions.length} coincidencias</span>
      </div>
      ${suggestions
        .map((s) =>
          s.type === 'game'
            ? `<button type="button" class="search-dropdown__item" data-suggest-game="${escapeHtml(s.id)}">
                 <strong>${escapeHtml(s.label)}</strong>
                 <span class="search-dropdown__meta">${escapeHtml(s.meta)}</span>
               </button>`
            : `<button type="button" class="search-dropdown__item" data-suggest-query="${escapeHtml(s.query)}">
                 <span>${escapeHtml(s.label)}</span>
                 <span class="search-dropdown__meta">${escapeHtml(s.meta)}</span>
               </button>`
        )
        .join('')}
    `;
    dropdown.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    return;
  }

  const history = getSearchHistory();
  if (history.length === 0) {
    dropdown.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    return;
  }

  dropdown.innerHTML = `
    <div class="search-dropdown__header">
      <span>Búsquedas recientes</span>
      <button type="button" id="btnClearHistory" class="link-btn" style="font-size: 11px">Borrar</button>
    </div>
    ${history
      .map(
        (term) => `
      <button type="button" class="search-dropdown__item" data-suggest-query="${escapeHtml(term)}">
        <span>↺ ${escapeHtml(term)}</span>
        <span class="search-dropdown__meta">Reciente</span>
      </button>
    `
      )
      .join('')}
  `;
  dropdown.hidden = false;
  input.setAttribute('aria-expanded', 'true');
}

function hideSearchDropdown() {
  const dropdown = document.getElementById('searchDropdown');
  const input = document.getElementById('searchInput');
  if (dropdown) dropdown.hidden = true;
  if (input) input.setAttribute('aria-expanded', 'false');
}

function renderActiveFilterChips() {
  const container = document.getElementById('activeFilterChips');
  const chips = [];

  if (filterState.section !== 'todos') {
    const labels = {
      parati: 'Para ti',
      lanzamiento: 'Lanzamientos',
      moderno: 'Modernos',
      clasico: 'Clásicos',
      ofertas: 'Ofertas',
      fisico: 'Físicos y Digitales',
      gratis: 'Gratuitos'
    };
    chips.push({ key: 'section', label: `Sección: ${labels[filterState.section] || filterState.section}` });
  }
  if (filterState.search.trim()) chips.push({ key: 'search', label: `Búsqueda: "${filterState.search.trim()}"` });
  if (filterState.platform !== 'all') chips.push({ key: 'platform', label: `Plataforma: ${filterState.platform}` });
  if (filterState.genre !== 'all') chips.push({ key: 'genre', label: `Género: ${filterState.genre}` });
  if (filterState.priceRange !== 'all') {
    const map = { free: 'Gratis', under20: 'Hasta $20 USD', '20to50': '$20–$50 USD', over50: 'Más de $50 USD' };
    chips.push({ key: 'priceRange', label: `Precio: ${map[filterState.priceRange]}` });
  }
  if (filterState.yearRange !== 'all') chips.push({ key: 'yearRange', label: `Año: ${filterState.yearRange}` });
  if (filterState.minScore !== 'all') chips.push({ key: 'minScore', label: `Nota: ${filterState.minScore}+` });
  if (filterState.esrb !== 'all') chips.push({ key: 'esrb', label: `ESRB: ${filterState.esrb}` });
  if (filterState.format !== 'all') {
    chips.push({
      key: 'format',
      label: filterState.format === 'fisico' ? 'Formato: Con edición física' : 'Formato: Solo digital'
    });
  }

  container.innerHTML = chips
    .map(
      (c) => `
      <span class="filter-chip">
        <span>${escapeHtml(c.label)}</span>
        <button type="button" data-remove-filter="${c.key}" aria-label="Quitar filtro ${escapeHtml(c.label)}">×</button>
      </span>
    `
    )
    .join('');

  return chips.length > 0;
}

function removeSingleFilter(key) {
  if (key === 'section') {
    setActiveSection('todos');
    return;
  }
  filterState[key] = defaultFilters[key];
  const elMap = {
    search: 'searchInput',
    platform: 'platformFilter',
    genre: 'genreFilter',
    priceRange: 'priceFilter',
    yearRange: 'yearFilter',
    minScore: 'scoreFilter',
    esrb: 'esrbFilter',
    format: 'formatFilter'
  };
  const el = document.getElementById(elMap[key]);
  if (el) el.value = filterState[key];
  visibleCount = KRONO_CONFIG.catalog.pageSize;
  renderCatalog();
}

/* ==========================================================================
   Renderizado Paginado del Catálogo (24 por bloque para rendimiento óptimo)
   ========================================================================== */
function renderCatalog() {
  const grid = document.getElementById('gamesGrid');
  const resultsCount = document.getElementById('resultsCount');
  const resetBtn = document.getElementById('btnResetFilters');
  const paginationEl = document.getElementById('catalogPagination');

  const items = filterAndSortCatalog(catalogGames, filterState, scoreGameForUser);
  const hasActiveFilters = renderActiveFilterChips();
  resetBtn.hidden = !hasActiveFilters;

  const totalMatches = items.length;
  const shownItems = items.slice(0, visibleCount);

  resultsCount.textContent =
    totalMatches === 0
      ? '0 coincidencias encontradas'
      : `Mostrando ${shownItems.length} de ${totalMatches} videojuegos${hasActiveFilters ? ' filtrados' : ''}`;

  if (totalMatches === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No encontramos videojuegos con esta combinación de filtros</h3>
        <p style="color: var(--ink-secondary); margin: 0 0 18px">
          Elimina alguno de los filtros activos o prueba buscar por franquicia (GTA, Zelda, Halo, Mario, Elden Ring).
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="btnEmptyReset">Ver los ${catalogGames.length} videojuegos</button>
      </div>
    `;
    paginationEl.hidden = true;
    document.getElementById('btnEmptyReset')?.addEventListener('click', resetFilters);
    return;
  }

  const showAffinity = hasCustomPrefs() || filterState.section === 'parati';

  grid.innerHTML = shownItems
    .map(({ game, affinity, reasonText }) => {
      const isWishlisted = state.wishlist.includes(game.id);
      const inCart = state.cart.some((c) => c.id === game.id);

      return `
        <article class="game-card" data-game-card="${escapeHtml(game.id)}">
          <div class="card-case-box">
            <div class="cover-top-actions">
              <div style="display: flex; gap: 5px; align-items: center">
                ${game.discount > 0 ? `<span class="discount-tag">-${game.discount}%</span>` : ''}
                ${showAffinity ? `<span class="affinity-tag">${affinity}%</span>` : ''}
              </div>
              <button
                type="button"
                class="wishlist-btn ${isWishlisted ? 'saved' : ''}"
                data-toggle-wishlist="${escapeHtml(game.id)}"
                aria-label="${isWishlisted ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
                aria-pressed="${isWishlisted}"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            <div data-card-case-trigger="${escapeHtml(game.id)}">
              ${renderAuroraCase(game, { initialState: 'front', compact: true, lazy: true })}
            </div>

            <div class="card-case-controls">
              <button type="button" class="mini-pill-btn" data-flip-card="${escapeHtml(game.id)}" title="Ver contraportada">
                ↺ Reverso
              </button>
              <button type="button" class="mini-pill-btn" data-open-case-card="${escapeHtml(game.id)}" title="Abrir caja 3D y ver el disco">
                ◉ Abrir caja
              </button>
            </div>
          </div>

          <div class="game-body">
            <div class="game-meta-top">
              <span>${escapeHtml(game.developer)} · ${game.year}</span>
              <span class="game-score" title="${escapeHtml(game.ratingSource)}">${game.score}</span>
            </div>

            <h3 class="game-title" data-open-detail="${escapeHtml(game.id)}">${escapeHtml(game.title)}</h3>

            ${showAffinity && reasonText ? `<p class="game-reason">${escapeHtml(reasonText)}</p>` : ''}

            <div class="game-platforms">
              ${escapeHtml(game.genres.slice(0, 2).join(' · '))} — ${escapeHtml(game.platforms.slice(0, 3).join(', '))}
            </div>

            <div class="game-footer">
              <div class="price-block">
                <span class="price-current">${formatPrice(game.priceUSD)}</span>
                ${game.originalPriceUSD ? `<span class="price-old">${formatPrice(game.originalPriceUSD)}</span>` : ''}
              </div>

              <div class="card-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  data-open-detail="${escapeHtml(game.id)}"
                  aria-label="Abrir ficha completa de ${escapeHtml(game.title)}"
                >
                  <span class="btn-detail-label">Ficha</span>
                  <span aria-hidden="true">→</span>
                </button>
                <button
                  type="button"
                  class="btn ${inCart ? 'btn-accent' : 'btn-primary'} btn-sm"
                  data-add-cart="${escapeHtml(game.id)}"
                >
                  ${inCart ? 'En carrito ✓' : 'Añadir'}
                </button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  // Paginación progresiva
  const remaining = totalMatches - shownItems.length;
  if (remaining > 0) {
    paginationEl.hidden = false;
    paginationEl.innerHTML = `
      <span class="catalog-pagination__status">
        Mostrando ${shownItems.length} de ${totalMatches} videojuegos · Restan ${remaining}
      </span>
      <div class="catalog-pagination__actions">
        <button type="button" id="btnLoadMore" class="btn btn-primary btn-sm">
          Cargar ${Math.min(KRONO_CONFIG.catalog.pageSize, remaining)} videojuegos más
        </button>
        ${
          remaining <= 72
            ? `<button type="button" id="btnLoadAll" class="btn btn-secondary btn-sm">Mostrar los ${totalMatches}</button>`
            : ''
        }
      </div>
    `;
    document.getElementById('btnLoadMore')?.addEventListener('click', () => {
      visibleCount += KRONO_CONFIG.catalog.pageSize;
      renderCatalog();
    });
    document.getElementById('btnLoadAll')?.addEventListener('click', () => {
      visibleCount = totalMatches;
      renderCatalog();
    });
  } else {
    paginationEl.hidden = totalMatches <= KRONO_CONFIG.catalog.pageSize;
    if (!paginationEl.hidden) {
      paginationEl.innerHTML = `
        <span class="catalog-pagination__status">
          Has visto todos los ${totalMatches} videojuegos de esta selección.
        </span>
      `;
    }
  }
}

/* ==========================================================================
   Noticias Verificadas (RSS Oficiales) + Banner Juego del Mes (GTA VI)
   ========================================================================== */
async function loadVerifiedNews() {
  try {
    const resp = await fetch('data/news-verified.json', { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (!Array.isArray(data?.articles) || data.articles.length === 0) {
      throw new Error('Sin artículos en feed');
    }
    verifiedNewsData = {
      meta: { ...data.meta, cachedFallback: false },
      gameOfTheMonth: data.gameOfTheMonth || null,
      articles: data.articles
    };
    try {
      localStorage.setItem('krono_news_cache_v1', JSON.stringify(verifiedNewsData));
    } catch {
      // ignore
    }
  } catch {
    let cached = null;
    try {
      const raw = localStorage.getItem('krono_news_cache_v1');
      if (raw) cached = JSON.parse(raw);
    } catch {
      // ignore
    }
    if (cached?.articles?.length) {
      verifiedNewsData = {
        ...cached,
        meta: { ...(cached.meta || {}), cachedFallback: true }
      };
    } else {
      verifiedNewsData = {
        meta: { verifiedDate: '2026-11-24', totalArticles: FALLBACK_NEWS.length, feeds: [], cachedFallback: true },
        gameOfTheMonth: null,
        articles: FALLBACK_NEWS.map((n) => ({
          id: n.id,
          title: n.title,
          summary: n.excerpt,
          image: n.image,
          publishedAt: n.date,
          verifiedAt: '2026-11-24',
          sourceName: 'Archivo editorial KRONO (respaldo local)',
          sourceUrl: 'https://doritotes444.github.io/krono-games/#noticias',
          category: n.category,
          verificationType: 'Medio especializado'
        }))
      };
    }
  }

  renderGameOfTheMonthBanner();
  renderNews();
}

function renderGameOfTheMonthBanner() {
  const gotm = verifiedNewsData.gameOfTheMonth;
  if (gotm) {
    const setText = (id, txt) => {
      const el = document.getElementById(id);
      if (el && txt) el.textContent = txt;
    };
    setText('gotmBadge', gotm.badge);
    setText('gotmVerifiedMeta', `${gotm.verificationType} · Verificado ${gotm.verifiedAt}`);
    setText('gotmTitle', gotm.title);
    setText('gotmSummary', gotm.summary);
    setText('gotmMediaCaption', `Arte oficial · ${gotm.sourceName}`);

    const img = document.getElementById('gotmImage');
    if (img && gotm.image) img.src = gotm.image;

    const srcLink = document.getElementById('gotmSourceLink');
    if (srcLink && gotm.sourceUrl) srcLink.href = gotm.sourceUrl;

    const openBtn = document.getElementById('btnGotmOpenGame');
    if (openBtn && gotm.gameId) openBtn.dataset.openDetail = gotm.gameId;
  }

  const strip = document.getElementById('gotmHeadlinesStrip');
  if (strip && verifiedNewsData.articles.length) {
    const topItems = verifiedNewsData.articles.slice(0, 5);
    strip.innerHTML = `
      <span class="gotm-strip-label">Últimas verificadas:</span>
      ${topItems
        .map(
          (a) => `
        <button type="button" class="gotm-headline-chip" data-open-news="${escapeHtml(a.id)}" title="${escapeHtml(a.title)}">
          <strong style="color: var(--accent)">${escapeHtml(a.sourceName.replace(' Oficial', ''))}:</strong>
          <span>${escapeHtml(a.title)}</span>
        </button>
      `
        )
        .join('')}
    `;
  }
}

function renderNews() {
  const grid = document.getElementById('newsGrid');
  const statusBar = document.getElementById('newsStatusBar');
  const articles = verifiedNewsData.articles || [];

  if (statusBar) {
    const okSources = (verifiedNewsData.meta?.feeds || [])
      .filter((f) => f.status === 'ok')
      .map((f) => f.source)
      .join(' · ');
    statusBar.innerHTML = verifiedNewsData.meta?.cachedFallback
      ? `<span>⚠ Mostrando última versión en caché verificada (${escapeHtml(verifiedNewsData.meta.verifiedDate)})</span><span>Reintento automático al recargar</span>`
      : `<span>Fuentes activas: ${escapeHtml(okSources || 'PlayStation.Blog · Xbox Wire · Nintendo Life · GameSpot')}</span><span>Verificado: ${escapeHtml(verifiedNewsData.meta?.verifiedDate || '2026-11-24')} · ${articles.length} titulares reales</span>`;
  }

  const filtered =
    newsCategory === 'all'
      ? articles
      : articles.filter((item) => item.category === newsCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Sin titulares en la categoría "${escapeHtml(newsCategory)}"</h3>
        <p style="color: var(--ink-secondary); margin: 0">Prueba seleccionar "Todas" para ver los ${articles.length} titulares verificados.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered
    .map((item) => {
      const isOfficial = String(item.verificationType || '').toLowerCase().includes('oficial');
      const badgeCls = isOfficial ? 'verify-badge--oficial' : 'verify-badge--medio';
      return `
      <article class="news-card" data-open-news="${escapeHtml(item.id)}" tabindex="0" role="button">
        <div class="news-thumb">
          <img
            src="${escapeHtml(item.image || 'assets/images/hero_editorial.webp')}"
            alt="${escapeHtml(item.title)}"
            loading="lazy"
            onerror="this.onerror=null;this.src='assets/images/hero_editorial.webp'"
          />
          <span class="news-cat">${escapeHtml(item.category)}</span>
        </div>
        <div class="news-body">
          <div class="news-meta" style="display: flex; align-items: center; justify-content: space-between; gap: 6px; flex-wrap: wrap">
            <span>${escapeHtml(item.publishedAt)} · ${escapeHtml(item.sourceName)}</span>
            <span class="verify-badge ${badgeCls}">${escapeHtml(item.verificationType)}</span>
          </div>
          <h3 class="news-title">${escapeHtml(item.title)}</h3>
          <p class="news-excerpt">${escapeHtml(item.summary)}</p>
          <div class="news-source-footer">
            <span class="news-read-more">Leer resumen →</span>
            <a
              href="${escapeHtml(item.sourceUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              class="link-btn"
              style="font-size: 12px"
              onclick="event.stopPropagation()"
            >
              Fuente original ↗
            </a>
          </div>
        </div>
      </article>
    `;
    })
    .join('');
}

function openNewsModal(newsId) {
  const item = (verifiedNewsData.articles || []).find((n) => n.id === newsId);
  if (!item) return;

  const isGta = /grand theft auto|gta/i.test(`${item.title} ${item.summary}`);
  const related = isGta ? findGameById('grand-theft-auto-vi') : null;

  document.getElementById('newsModalMeta').textContent = `${item.category} · ${item.sourceName} · Publicado ${item.publishedAt} · Verificado ${item.verifiedAt}`;
  document.getElementById('newsModalTitle').textContent = item.title;

  document.getElementById('newsModalContent').innerHTML = `
    <img
      src="${escapeHtml(item.image || 'assets/images/hero_editorial.webp')}"
      alt="${escapeHtml(item.title)}"
      style="width: 100%; max-height: 360px; object-fit: contain; background: #090c12; border-radius: var(--radius-md); margin-bottom: 18px; border: 1px solid var(--border)"
      onerror="this.onerror=null;this.src='assets/images/hero_editorial.webp'"
    />
    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px">
      <span class="meta-tag">${escapeHtml(item.verificationType)}</span>
      <span class="meta-tag">Fuente: ${escapeHtml(item.sourceName)}</span>
      <span class="meta-tag">Verificado: ${escapeHtml(item.verifiedAt)}</span>
    </div>
    <p style="margin: 0 0 18px; font-size: 14.5px; line-height: 1.68; color: var(--ink-secondary)">
      ${escapeHtml(item.summary)}
    </p>
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px">
      <a href="${escapeHtml(item.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
        Leer artículo completo en ${escapeHtml(item.sourceName)} ↗
      </a>
    </div>
    ${
      related
        ? `
      <div class="digital-key-card" style="display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-top: 14px">
        <div>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--accent); text-transform: uppercase">Juego relacionado en catálogo</div>
          <div style="font-weight: 700; font-size: 15px">${escapeHtml(related.title)} (${related.year})</div>
          <div style="font-size: 12.5px; color: var(--ink-secondary)">${formatPrice(related.priceUSD)} · Nota ${related.score}/100</div>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" id="btnNewsOpenGame">
          Abrir ficha y caja 3D →
        </button>
      </div>
    `
        : ''
    }
  `;

  if (related) {
    document.getElementById('btnNewsOpenGame')?.addEventListener('click', () => {
      closeModal('newsModal');
      openGameDetail(related.id, { mode: 'front' });
    });
  }

  openModal('newsModal');
}

function renderTrailers() {
  const featuredIds = ['grand-theft-auto-vi', 'expedition-33', 'elden-ring'];
  const container = document.getElementById('trailersGrid');

  container.innerHTML = featuredIds
    .map((id) => {
      const game = findGameById(id);
      if (!game || !game.trailerId) return '';
      return `
        <article class="trailer-card">
          <div class="trailer-player" data-trailer-embed="${game.trailerId}" data-trailer-title="${escapeHtml(game.title)}">
            <img src="${game.headerImg || game.cover}" alt="Vista previa del tráiler de ${escapeHtml(game.title)}" loading="lazy" onerror="this.onerror=null;this.src='${game.fallbackCover}'" />
            <button type="button" class="play-overlay" aria-label="Reproducir tráiler oficial de ${escapeHtml(game.title)}">
              <span class="play-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
              </span>
              <span style="font-size: 12.5px; font-weight: 700">Reproducir tráiler oficial</span>
            </button>
          </div>
          <div class="trailer-meta">
            <h3>${escapeHtml(game.title)} (${game.year})</h3>
            <p>${escapeHtml(ERAS[game.era]?.label || game.era)} · ${escapeHtml(game.developer)} · <a href="https://www.youtube.com/watch?v=${game.trailerId}" target="_blank" rel="noopener noreferrer" class="link-btn">Abrir en YouTube ↗</a></p>
          </div>
        </article>
      `;
    })
    .join('');
}

/* ==========================================================================
   Modales, Drawers y Enrutamiento Amigable (#/juego/<slug>)
   ========================================================================== */
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id, { updateHash = true } = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  if (id === 'gameModal') {
    document.getElementById('detailContent').innerHTML = '';
    document.title = BASE_TITLE;
    document.getElementById('dynamicProductJsonLd')?.remove();
    if (updateHash && window.location.hash.startsWith('#/juego/')) {
      history.replaceState(null, '', '#catalogo');
    }
  }
  restoreBodyScroll();
}

function openDrawer(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeDrawer(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  restoreBodyScroll();
}

function restoreBodyScroll() {
  const anyOpen = document.querySelector('.modal-backdrop.open, .drawer-backdrop.open, .mobile-nav-drawer.open');
  if (!anyOpen) document.body.style.overflow = '';
}

function openMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  drawer.classList.add('open');
  drawer.setAttribute('aria-hidden', 'false');
  document.getElementById('btnMobileMenu').setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobileNavDrawer');
  drawer.classList.remove('open');
  drawer.setAttribute('aria-hidden', 'true');
  document.getElementById('btnMobileMenu').setAttribute('aria-expanded', 'false');
  restoreBodyScroll();
}

function injectProductJsonLd(game) {
  document.getElementById('dynamicProductJsonLd')?.remove();
  const script = document.createElement('script');
  script.id = 'dynamicProductJsonLd';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: game.title,
    description: game.description,
    image: game.cover,
    genre: game.genres,
    gamePlatform: game.platforms,
    datePublished: game.releaseDate,
    author: { '@type': 'Organization', name: game.developer },
    publisher: { '@type': 'Organization', name: game.publisher },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: game.priceUSD,
      availability: 'https://schema.org/PreOrder'
    }
  });
  document.head.appendChild(script);
}

/* ==========================================================================
   Ficha Individual Profesional de Cada Videojuego (Fase 7)
   ========================================================================== */
function openGameDetail(gameId, { mode = 'front', pushRoute = true } = {}) {
  const game = findGameById(gameId);
  if (!game) return;

  if (pushRoute) {
    const targetHash = `#/juego/${encodeURIComponent(game.slug || game.id)}`;
    if (window.location.hash !== targetHash) {
      history.pushState(null, '', targetHash);
    }
  }

  document.title = `${game.title} (${game.year}) — KRONO Game Store`;
  injectProductJsonLd(game);

  if (!state.recentlyViewed.includes(game.id)) {
    state.recentlyViewed.unshift(game.id);
    state.recentlyViewed = state.recentlyViewed.slice(0, 8);
    saveState();
  }

  const theme = CASE_THEMES[game.caseTheme] || CASE_THEMES.pc;
  const { affinity, reasonText } = scoreGameForUser(game);
  const isWishlisted = state.wishlist.includes(game.id);
  const inCart = state.cart.some((c) => c.id === game.id);
  const related = getRelatedGames(catalogGames, game, 4);

  const initialCaseState = mode === 'disc' || mode === 'open' ? 'open' : mode === 'back' ? 'back' : 'front';
  const initialDiscOut = mode === 'disc';

  document.getElementById('detailKicker').textContent = `${game.franchise} · ${game.releaseDate} · ${game.developer}`;
  document.getElementById('detailTitle').textContent = game.title;

  const trailerActionHtml = game.trailerId
    ? `<button type="button" class="btn btn-secondary btn-sm" id="btnDetailTrailer">▶ Tráiler oficial</button>`
    : `<a href="https://www.youtube.com/results?search_query=${encodeURIComponent(game.title + ' official trailer')}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">▶ Buscar tráiler ↗</a>`;

  const shots = [...new Set((game.screenshots || []).filter(Boolean))].slice(0, 2);

  const content = document.getElementById('detailContent');
  content.innerHTML = `
    <div id="detailTrailerSlot" hidden></div>

    <div class="detail-grid">
      <div class="inspector-stage">
        <div class="inspector-case-wrap">
          ${renderAuroraCase(game, {
            idAttr: 'inspectorCaseStage',
            initialState: initialCaseState,
            discExtracted: initialDiscOut,
            lazy: false
          })}
        </div>

        <div class="inspector-toolbar" role="group" aria-label="Controles de caja física 3D">
          <button type="button" class="btn btn-sm ${initialCaseState === 'front' ? 'btn-primary' : 'btn-secondary'}" data-insp-mode="front">
            Portada
          </button>
          <button type="button" class="btn btn-sm ${initialCaseState === 'back' ? 'btn-primary' : 'btn-secondary'}" data-insp-mode="back">
            ↺ Contraportada
          </button>
          <button type="button" class="btn btn-sm ${initialCaseState === 'open' && !initialDiscOut ? 'btn-primary' : 'btn-secondary'}" data-insp-mode="open">
            Abrir caja
          </button>
          <button type="button" class="btn btn-sm ${initialDiscOut ? 'btn-primary' : 'btn-secondary'}" data-insp-mode="disc">
            ◉ ${initialDiscOut ? 'Insertar disco' : 'Extraer disco'}
          </button>
          <button type="button" class="btn btn-sm btn-secondary" id="btnToggleDiscSpin" ${initialDiscOut ? '' : 'hidden'}>
            ⏸ Pausar giro
          </button>
        </div>

        <p style="margin: 0; font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-muted); text-align: center">
          ${escapeHtml(theme.discFormat)} · ${escapeHtml(game.serial)}
        </p>
      </div>

      <div>
        <div class="detail-specs-row">
          <span class="meta-tag" style="color: var(--accent)">Nota ${game.score}/100</span>
          <span class="meta-tag">${escapeHtml(game.ratingSource)}</span>
          <span class="meta-tag">${escapeHtml(game.esrb)} · ${escapeHtml(game.esrbText)}</span>
          <span class="meta-tag">${escapeHtml(game.format)}</span>
          ${hasCustomPrefs() ? `<span class="meta-tag" style="color: var(--accent)">${affinity}% afinidad</span>` : ''}
        </div>

        <p style="margin: 0 0 10px; color: var(--ink-secondary)">${escapeHtml(game.description)}</p>

        ${
          shots.length
            ? `<div class="detail-gallery" ${shots.length === 1 ? 'style="grid-template-columns: 1fr; max-width: 340px"' : ''}>
                ${shots
                  .map(
                    (src, i) =>
                      `<img src="${escapeHtml(src)}" alt="Captura ${i + 1} de ${escapeHtml(game.title)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(game.fallbackCover)}'" />`
                  )
                  .join('')}
               </div>`
            : ''
        }

        <div class="editorial-note">
          <strong>Por qué destaca en el archivo</strong>
          ${escapeHtml(game.whyWorthIt)}
        </div>

        ${reasonText && hasCustomPrefs() ? `<p class="game-reason" style="margin-bottom: 10px">${escapeHtml(reasonText)}</p>` : ''}

        <div class="detail-availability-box">
          <div><strong>Disponibilidad:</strong> <span style="color: var(--accent)">${escapeHtml(game.availabilityStatus)}</span></div>
          <div><strong>Formato y ediciones:</strong> ${escapeHtml(game.format)} · ${escapeHtml(game.editions.join(' / '))}</div>
          <div><strong>Entrega estimada:</strong> Digital (clave oficial tras confirmación de pago) · Físico (envío nacional Colombia sujeto a inventario verificado).</div>
        </div>

        <p style="margin: 0 0 5px; font-size: 13px; color: var(--ink-secondary)">
          <strong>Desarrollador / Editor:</strong> ${escapeHtml(game.developer)} / ${escapeHtml(game.publisher)}
        </p>
        <p style="margin: 0 0 5px; font-size: 13px; color: var(--ink-secondary)">
          <strong>Plataformas:</strong> ${escapeHtml(game.platforms.join(', '))}
        </p>
        <p style="margin: 0 0 12px; font-size: 13px; color: var(--ink-secondary)">
          <strong>Modos e idiomas:</strong> ${escapeHtml(game.gameModes.join(', '))} · ${escapeHtml(game.players)} · ${escapeHtml(game.languages)}
        </p>

        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding-top: 14px; border-top: 1px solid var(--border)">
          <div class="price-block">
            <span class="price-current" style="font-size: 20px">${formatPrice(game.priceUSD)}</span>
            ${game.originalPriceUSD ? `<span class="price-old">${formatPrice(game.originalPriceUSD)} (-${game.discount}%)</span>` : ''}
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 7px">
            ${trailerActionHtml}
            <button type="button" class="btn btn-secondary btn-sm" id="btnDetailShare">Compartir</button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnDetailInquiry">Consultar stock</button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnDetailWishlist">
              ${isWishlisted ? '♥ Guardado' : '♡ Favorito'}
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btnDetailAddCart">
              ${inCart ? 'Añadir otra copia' : 'Añadir al carrito'}
            </button>
          </div>
        </div>

        <div class="detail-sources">
          <span>Fuentes verificadas:</span>
          ${game.sources
            .map(
              (s) =>
                `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="link-btn" style="font-size: 12px">${escapeHtml(s.name)} ↗</a>`
            )
            .join('')}
          <span>· Actualizado: ${escapeHtml(game.lastUpdated)}</span>
        </div>
      </div>
    </div>

    ${
      related.length
        ? `
      <div class="detail-related">
        <h3>Juegos similares y de la misma franquicia</h3>
        <div class="related-grid">
          ${related
            .map(
              (rel) => `
            <button type="button" class="related-card" data-open-detail="${escapeHtml(rel.id)}">
              <img src="${escapeHtml(rel.cover)}" alt="${escapeHtml(rel.title)}" loading="lazy" onerror="this.onerror=null;this.src='${escapeHtml(rel.fallbackCover)}'" />
              <strong>${escapeHtml(rel.title)}</strong>
              <span>${rel.year} · Nota ${rel.score} · ${formatPrice(rel.priceUSD)}</span>
            </button>
          `
            )
            .join('')}
        </div>
      </div>
    `
        : ''
    }
  `;

  const stage = document.getElementById('inspectorCaseStage');
  const spinBtn = document.getElementById('btnToggleDiscSpin');
  let discPaused = false;

  const syncInspectorButtons = () => {
    const isOpen = stage.classList.contains('is-open');
    const isBack = stage.classList.contains('is-back-pinned');
    const isDisc = stage.classList.contains('is-disc-extracted');
    const activeMode = isDisc ? 'disc' : isOpen ? 'open' : isBack ? 'back' : 'front';
    spinBtn.hidden = !isDisc;
    content.querySelectorAll('[data-insp-mode]').forEach((b) => {
      b.classList.toggle('btn-primary', b.dataset.inspMode === activeMode);
      b.classList.toggle('btn-secondary', b.dataset.inspMode !== activeMode);
      if (b.dataset.inspMode === 'disc') {
        b.textContent = isDisc ? '◉ Insertar disco' : '◉ Extraer disco';
      }
    });
  };

  stage.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-toggle-disc]')) {
      ev.stopPropagation();
      toggleAuroraDisc(stage);
      syncInspectorButtons();
      return;
    }
    const next = stage.classList.contains('is-open') ? 'front' : 'open';
    setAuroraCaseState(stage, next);
    syncInspectorButtons();
  });

  content.querySelectorAll('[data-insp-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.inspMode;
      if (m === 'disc') toggleAuroraDisc(stage);
      else setAuroraCaseState(stage, m);
      syncInspectorButtons();
    });
  });

  spinBtn.addEventListener('click', () => {
    discPaused = !discPaused;
    stage.querySelector('.tray-disc__rotor')?.classList.toggle('paused', discPaused);
    spinBtn.textContent = discPaused ? '▶ Girar disco' : '⏸ Pausar giro';
  });

  let trailerVisible = false;
  document.getElementById('btnDetailTrailer')?.addEventListener('click', (e) => {
    const slot = document.getElementById('detailTrailerSlot');
    trailerVisible = !trailerVisible;
    if (trailerVisible) {
      slot.hidden = false;
      slot.innerHTML = `
        <div class="detail-video-box">
          <iframe src="https://www.youtube-nocookie.com/embed/${game.trailerId}?autoplay=1&rel=0" title="Tráiler oficial de ${escapeHtml(game.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      `;
      e.currentTarget.textContent = 'Ocultar tráiler';
    } else {
      slot.hidden = true;
      slot.innerHTML = '';
      e.currentTarget.textContent = '▶ Tráiler oficial';
    }
  });

  document.getElementById('btnDetailShare').addEventListener('click', () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#/juego/${encodeURIComponent(game.slug || game.id)}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    showToast(`Enlace copiado: ${game.title}`);
  });

  document.getElementById('btnDetailInquiry').addEventListener('click', () => {
    closeModal('gameModal');
    const msg = document.getElementById('contactMessage');
    const topic = document.getElementById('contactTopic');
    if (topic) topic.value = 'Preventas y cajas físicas coleccionistas';
    if (msg) {
      msg.value = `Hola, deseo consultar disponibilidad comercial y precio actualizado para "${game.title}" (${game.platforms.slice(0, 3).join(', ')}).`;
    }
    document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
    showToast(`Consulta preparada para ${game.title}.`);
  });

  document.getElementById('btnDetailWishlist').addEventListener('click', (e) => {
    toggleWishlist(game.id);
    e.currentTarget.textContent = state.wishlist.includes(game.id) ? '♥ Guardado' : '♡ Favorito';
  });

  document.getElementById('btnDetailAddCart').addEventListener('click', () => {
    addToCart(game.id);
    closeModal('gameModal');
    openCart();
  });

  openModal('gameModal');
}

function handleHashRoute() {
  const hash = window.location.hash || '';
  if (hash.startsWith('#/juego/')) {
    const slug = decodeURIComponent(hash.replace('#/juego/', '').trim());
    if (slug && findGameById(slug)) {
      openGameDetail(slug, { mode: 'front', pushRoute: false });
    }
  } else if (document.getElementById('gameModal')?.classList.contains('open')) {
    closeModal('gameModal', { updateHash: false });
  }
}

/* ==========================================================================
   Personalización, Auth, Carrito y Cuenta
   ========================================================================== */
function openPrefsModal() {
  draftPrefs = clonePrefs(state.prefs);
  renderPrefsModalOptions();
  openModal('prefsModal');
}

function renderPrefsModalOptions() {
  document.getElementById('prefEras').innerHTML = Object.values(ERAS)
    .map(
      (era) => `
      <button type="button" class="chip ${draftPrefs.eras.includes(era.id) ? 'active' : ''}" data-pref-era="${era.id}">
        ${era.label} (${era.range})
      </button>
    `
    )
    .join('');

  document.getElementById('prefGenres').innerHTML = CATALOG_GENRES.map(
    (g) => `
      <button type="button" class="chip ${draftPrefs.genres.includes(g) ? 'active' : ''}" data-pref-genre="${g}">
        ${g}
      </button>
    `
  ).join('');

  document.getElementById('prefPlatforms').innerHTML = CATALOG_PLATFORMS.map(
    (p) => `
      <button type="button" class="chip ${draftPrefs.platforms.includes(p) ? 'active' : ''}" data-pref-platform="${p}">
        ${p}
      </button>
    `
  ).join('');

  document.querySelectorAll('#prefBudget [data-budget]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.budget === draftPrefs.budget);
  });
}

function toggleArrayItem(arr, val) {
  const idx = arr.indexOf(val);
  if (idx >= 0) arr.splice(idx, 1);
  else arr.push(val);
}

function applyTastePreset(presetId) {
  const preset = TASTE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return;

  if (state.prefs.presetId === presetId) {
    state.prefs = clonePrefs(defaultState.prefs);
    showToast('Perfil rápido desactivado.');
  } else {
    state.prefs = {
      presetId: preset.id,
      eras: [...preset.eras],
      genres: [...preset.genres],
      platforms: [...preset.platforms],
      budget: preset.budget
    };
    filterState.sort = 'recommended';
    document.getElementById('sortSelect').value = 'recommended';
    setActiveSection('parati');
    showToast(`Catálogo adaptado: ${preset.label}`);
  }

  saveState();
  renderPersonalizeRibbon();
  renderCatalog();
}

function openAuthModal({ requireForCheckout = false } = {}) {
  document.getElementById('authMainView').hidden = false;
  document.getElementById('authSocialView').hidden = true;
  document.getElementById('phoneStep1').hidden = false;
  document.getElementById('phoneStep2').hidden = true;

  const mandatoryEl = document.getElementById('authMandatoryNotice');
  if (mandatoryEl) mandatoryEl.hidden = !requireForCheckout;

  const backendNotice = document.getElementById('authBackendNotice');
  if (backendNotice) {
    backendNotice.innerHTML = isSupabaseConfigured()
      ? 'Autenticación real conectada a <strong>Supabase Auth</strong> (OAuth 2.0, Correo verificado y SMS).'
      : 'Modo vista previa local (sin credenciales Supabase configuradas). Configura <code>SUPABASE_URL</code> y <code>SUPABASE_ANON_KEY</code> en <code>js/config.js</code> para activar OAuth 2.0 y SMS reales.';
  }

  openModal('authModal');
}

function signInUser({ name, identifier, provider, realAuth = false }) {
  state.user = {
    name: name.trim(),
    identifier: identifier.trim(),
    provider,
    realAuth,
    initials: getInitials(name)
  };
  saveState();
  updateHeaderUI();
  renderPersonalizeRibbon();
  prefillContactIfLoggedIn();
  closeModal('authModal');
  showToast(`Sesión iniciada con ${provider}. ¡Bienvenido, ${state.user.name.split(' ')[0]}!`);

  if (resumeCheckoutAfterAuth) {
    resumeCheckoutAfterAuth = false;
    if (state.cart.length > 0) {
      openCheckoutModal();
    }
  }
}

async function signOutUser() {
  if (isSupabaseConfigured()) {
    const sb = await getSupabaseClient();
    await sb?.auth?.signOut().catch(() => {});
  }
  state.user = null;
  resumeCheckoutAfterAuth = false;
  saveState();
  updateHeaderUI();
  renderPersonalizeRibbon();
  closeDrawer('accountDrawer');
  showToast('Has cerrado sesión correctamente.');
}

async function startSocialAuth(providerKey) {
  if (isSupabaseConfigured()) {
    const { error } = await signInWithOAuthProvider(providerKey);
    if (error) showToast(error.message);
    return;
  }
  const cfg = DEMO_SOCIAL_ACCOUNTS[providerKey];
  if (!cfg) return;
  pendingSocialProvider = cfg;
  document.getElementById('authMainView').hidden = true;
  document.getElementById('authSocialView').hidden = false;
  document.getElementById('socialProviderPill').textContent = `${cfg.provider} · Vista previa`;
  document.getElementById('socialConfirmHeading').textContent = `Autorizar acceso con ${cfg.provider}`;
  document.getElementById('socialNameInput').value = cfg.defaultName;
  document.getElementById('socialHandleInput').value = cfg.defaultHandle;
}

function switchAuthTab(tab) {
  const isEmail = tab === 'email';
  document.getElementById('tabAuthEmail').classList.toggle('active', isEmail);
  document.getElementById('tabAuthPhone').classList.toggle('active', !isEmail);
  document.getElementById('emailAuthForm').hidden = !isEmail;
  document.getElementById('phoneAuthForm').hidden = isEmail;
}

function toggleEmailAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const isRegister = authMode === 'register';
  document.getElementById('emailNameField').hidden = !isRegister;
  document.getElementById('btnEmailSubmit').textContent = isRegister
    ? 'Crear cuenta con correo'
    : 'Iniciar sesión con correo';
  document.getElementById('emailTogglePrompt').textContent = isRegister
    ? '¿Ya tienes cuenta?'
    : '¿No tienes cuenta?';
  document.getElementById('btnToggleAuthMode').textContent = isRegister
    ? 'Iniciar sesión'
    : 'Crear cuenta';
}

function toggleWishlist(gameId) {
  const game = findGameById(gameId);
  if (!game) return;
  const idx = state.wishlist.indexOf(gameId);
  if (idx >= 0) {
    state.wishlist.splice(idx, 1);
    showToast(`${game.title} eliminado de favoritos.`);
  } else {
    state.wishlist.push(gameId);
    showToast(`${game.title} guardado en favoritos.`);
  }
  saveState();
  updateHeaderUI();
  renderCatalog();
}

function addToCart(gameId) {
  const game = findGameById(gameId);
  if (!game) return;
  const existing = state.cart.find((c) => c.id === gameId);
  if (existing) existing.qty += 1;
  else state.cart.push({ id: gameId, qty: 1 });
  saveState();
  updateHeaderUI();
  updateAuroraHud();
  renderCatalog();
  showToast(`${game.title} añadido al carrito.`);
}

function updateCartQty(gameId, delta) {
  const item = state.cart.find((c) => c.id === gameId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter((c) => c.id !== gameId);
  saveState();
  updateHeaderUI();
  updateAuroraHud();
  renderCatalog();
  renderCartDrawer();
}

function getCartTotals() {
  let subtotalUSD = 0;
  let itemCount = 0;
  const items = [];
  state.cart.forEach((entry) => {
    const game = findGameById(entry.id);
    if (!game) return;
    subtotalUSD += game.priceUSD * entry.qty;
    itemCount += entry.qty;
    items.push({ game, qty: entry.qty });
  });
  const promo = state.promoCode ? PROMO_CODES[state.promoCode] : null;
  const discountUSD = promo ? subtotalUSD * (promo.percent / 100) : 0;
  const totalUSD = Math.max(0, subtotalUSD - discountUSD);
  const totalCOP = toCopAmount(totalUSD);
  return { items, itemCount, subtotalUSD, promo, discountUSD, totalUSD, totalCOP };
}

function openCart() {
  renderCartDrawer();
  openDrawer('cartDrawer');
}

function renderCartDrawer() {
  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');

  if (state.cart.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 48px 12px">
        <p style="font-size: 16px; font-weight: 700; margin: 0 0 8px">Tu carrito está vacío</p>
        <p style="font-size: 13.5px; color: var(--ink-secondary); margin: 0 0 18px">
          Explora los 500 videojuegos verificados y arma tu pedido para Colombia.
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="btnCartExplore">Ir al catálogo</button>
      </div>
    `;
    footer.innerHTML = '';
    document.getElementById('btnCartExplore')?.addEventListener('click', () => {
      closeDrawer('cartDrawer');
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
    });
    return;
  }

  const { items, subtotalUSD, promo, discountUSD, totalUSD } = getCartTotals();

  body.innerHTML = items
    .map(
      ({ game, qty }) => `
        <div class="cart-item">
          <img src="${game.cover}" alt="${escapeHtml(game.title)}" onerror="this.onerror=null;this.src='${game.fallbackCover}'" />
          <div>
            <h4>${escapeHtml(game.title)}</h4>
            <div class="cart-item-meta">${escapeHtml(game.format)} · ${escapeHtml(game.edition)}</div>
            <div class="qty-control">
              <button type="button" data-cart-qty="${game.id}" data-delta="-1" aria-label="Disminuir cantidad">−</button>
              <span>${qty}</span>
              <button type="button" data-cart-qty="${game.id}" data-delta="1" aria-label="Aumentar cantidad">+</button>
            </div>
          </div>
          <div style="text-align: right">
            <div class="price-current">${formatPrice(game.priceUSD * qty)}</div>
            <button type="button" class="link-btn" style="font-size: 12px; margin-top: 5px" data-cart-qty="${game.id}" data-delta="-999">Quitar</button>
          </div>
        </div>
      `
    )
    .join('');

  footer.innerHTML = `
    <div class="promo-row">
      <input type="text" id="promoInput" class="input" placeholder="Cupón (SENA2026 o KRONO15)" value="${state.promoCode || ''}" style="height: 36px; text-transform: uppercase" />
      <button type="button" id="btnApplyPromo" class="btn btn-secondary btn-sm" style="height: 36px">Aplicar</button>
    </div>
    <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotalUSD)}</span></div>
    ${
      promo
        ? `<div class="summary-row" style="color: var(--success)"><span>Cupón ${state.promoCode} (-${promo.percent}%)</span><span>−${formatPrice(discountUSD)}</span></div>`
        : ''
    }
    <div class="summary-row total"><span>Total Colombia (COP)</span><span>${formatCopExact(totalUSD)}</span></div>
    <p class="field-hint" style="margin: 6px 0 10px">
      Tasa 1 USD = $${fxInfo.rate.toLocaleString('es-CO')} COP · ${escapeHtml(fxInfo.source)} (${escapeHtml(fxInfo.updatedAt)}).
      Solo disponible en Colombia · Visa, Mastercard, PayPal, Nequi y Corresponsales.
    </p>
    <button type="button" id="btnCheckout" class="btn btn-primary btn-full">
      ${state.user ? 'Continuar al pago en Colombia →' : 'Iniciar sesión para comprar →'}
    </button>
  `;

  document.getElementById('btnApplyPromo').addEventListener('click', () => {
    const code = document.getElementById('promoInput').value.trim().toUpperCase();
    if (!code) {
      state.promoCode = null;
      saveState();
      renderCartDrawer();
      return;
    }
    if (PROMO_CODES[code]) {
      state.promoCode = code;
      saveState();
      renderCartDrawer();
      showToast(`Cupón ${code} aplicado: ${PROMO_CODES[code].label}.`);
    } else {
      showToast('Cupón no válido.');
    }
  });

  document.getElementById('btnCheckout').addEventListener('click', startCheckoutFlow);
}

/* ==========================================================================
   ETAPA 7: CHECKOUT COLOMBIA (SESIÓN OBLIGATORIA + 5 MÉTODOS + CORRESPONSALES)
   ========================================================================== */
function startCheckoutFlow() {
  if (state.cart.length === 0) {
    showToast('Agrega al menos un videojuego al carrito.');
    return;
  }

  // REGLA OBLIGATORIA: No se puede comprar sin iniciar sesión
  if (!state.user) {
    resumeCheckoutAfterAuth = true;
    closeDrawer('cartDrawer');
    showToast('Debes iniciar sesión obligatoriamente para comprar en KRONO.');
    openAuthModal({ requireForCheckout: true });
    return;
  }

  closeDrawer('cartDrawer');
  openCheckoutModal();
}

function updateCheckoutPaymentPanels(selectedMethod) {
  document.querySelectorAll('#paymentMethodsGrid .payment-option').forEach((card) => {
    card.classList.toggle('selected', card.dataset.payCard === selectedMethod);
  });
  document.getElementById('subpanelCard').hidden = !(selectedMethod === 'visa' || selectedMethod === 'mastercard');
  document.getElementById('subpanelPaypal').hidden = selectedMethod !== 'paypal';
  document.getElementById('subpanelNequi').hidden = selectedMethod !== 'nequi';
  document.getElementById('subpanelCorresponsal').hidden = selectedMethod !== 'corresponsal';

  const submitBtn = document.getElementById('btnConfirmCheckout');
  if (submitBtn) {
    const labels = {
      visa: 'Continuar pago con Visa (Colombia)',
      mastercard: 'Continuar pago con Mastercard (Colombia)',
      paypal: 'Continuar pago con PayPal',
      nequi: 'Enviar solicitud de cobro a Nequi',
      corresponsal: 'Generar código de pago en Corresponsal'
    };
    submitBtn.textContent = labels[selectedMethod] || 'Confirmar pedido en Colombia';
  }
}

function openCheckoutModal() {
  if (!state.user) {
    resumeCheckoutAfterAuth = true;
    openAuthModal({ requireForCheckout: true });
    return;
  }

  const { items, subtotalUSD, promo, discountUSD, totalUSD, totalCOP } = getCartTotals();
  document.getElementById('checkoutFormView').hidden = false;
  document.getElementById('checkoutResultView').hidden = true;
  document.getElementById('checkoutKicker').textContent = `SOLO COLOMBIA (CO) · SESIÓN: ${state.user.name.toUpperCase()}`;

  const summaryBox = document.getElementById('checkoutSummaryBox');
  summaryBox.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px">
      <strong style="font-size: 13.5px">Resumen del pedido (${items.reduce((s, i) => s + i.qty, 0)} producto${items.length > 1 ? 's' : ''})</strong>
      <span class="meta-tag" style="color: var(--accent)">Colombia (COP)</span>
    </div>
    ${items
      .map(
        ({ game, qty }) => `
      <div style="display: flex; justify-content: space-between; font-size: 12.5px; color: var(--ink-secondary); margin-bottom: 4px">
        <span>${qty}× ${escapeHtml(game.title)}</span>
        <span>${formatCopExact(game.priceUSD * qty)}</span>
      </div>
    `
      )
      .join('')}
    ${
      promo
        ? `<div style="display: flex; justify-content: space-between; font-size: 12.5px; color: var(--success); margin-bottom: 4px"><span>Descuento ${state.promoCode} (-${promo.percent}%)</span><span>−${formatCopExact(discountUSD)}</span></div>`
        : ''
    }
    <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; padding-top: 8px; margin-top: 6px; border-top: 1px solid var(--border)">
      <span>Total a pagar (COP)</span>
      <span style="color: var(--accent)">$${totalCOP.toLocaleString('es-CO')} COP</span>
    </div>
    <div style="font-family: var(--font-mono); font-size: 10.5px; color: var(--ink-muted); margin-top: 5px">
      Equivalente referencial: $${totalUSD.toFixed(2)} USD · Tasa 1 USD = $${fxInfo.rate.toLocaleString('es-CO')} COP (${escapeHtml(fxInfo.source)}, ${escapeHtml(fxInfo.updatedAt)})
    </div>
  `;

  const selectedRadio = document.querySelector('input[name="paymentMethod"]:checked');
  updateCheckoutPaymentPanels(selectedRadio?.value || 'visa');
  openModal('checkoutModal');
}

function generateCorresponsalVoucher(network) {
  const convenios = {
    Efecty: '110845',
    'Corresponsal Bancolombia': '94210',
    PuntoRed: '88312'
  };
  const randDigits = (len) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join('');
  const expires = new Date(Date.now() + 48 * 60 * 60 * 1000);
  return {
    network,
    convenio: convenios[network] || '110845',
    paymentCode: `${randDigits(4)}-${randDigits(4)}-${randDigits(4)}`,
    expiresAt: expires.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };
}

function handleCheckoutSubmit(e) {
  e.preventDefault();
  if (!state.user) {
    closeModal('checkoutModal');
    openAuthModal({ requireForCheckout: true });
    return;
  }

  const docNumber = document.getElementById('chkDocNumber').value.replace(/\D/g, '');
  const phone = document.getElementById('chkPhone').value.replace(/\D/g, '');
  const department = document.getElementById('chkDepartment').value.trim();
  const city = document.getElementById('chkCity').value.trim();
  const legalOk = document.getElementById('chkLegalConsent').checked;
  const method = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'visa';

  if (docNumber.length < 6 || docNumber.length > 12) {
    return showToast('Ingresa un número de cédula o documento colombiano válido (6 a 12 dígitos).');
  }
  if (phone.length < 10) {
    return showToast('Ingresa un celular colombiano válido de 10 dígitos (+57).');
  }
  if (!department) {
    return showToast('Selecciona tu departamento en Colombia.');
  }
  if (city.length < 2) {
    return showToast('Indica tu ciudad o municipio en Colombia.');
  }
  if (method === 'nequi') {
    const nequiPhone = document.getElementById('chkNequiPhone').value.replace(/\D/g, '');
    if (nequiPhone.length !== 10) {
      return showToast('Ingresa un número celular Nequi válido de 10 dígitos.');
    }
  }
  if (!legalOk) {
    return showToast('Debes aceptar los Términos y Condiciones y la Política de Privacidad.');
  }

  const { items, totalUSD, totalCOP } = getCartTotals();
  const now = new Date();
  const dateCompact = now.toISOString().slice(0, 10).replace(/-/g, '');
  const orderRef = `KRN-CO-${dateCompact}-${Math.floor(100000 + Math.random() * 900000)}`;
  const createdAt = now.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const methodNames = {
    visa: 'Visa (Wompi Colombia)',
    mastercard: 'Mastercard (Wompi Colombia)',
    paypal: 'PayPal',
    nequi: 'Nequi Colombia',
    corresponsal: 'Corresponsal en efectivo Colombia'
  };

  let voucher = null;
  if (method === 'corresponsal') {
    const net = document.getElementById('chkCorresponsalNetwork').value;
    voucher = generateCorresponsalVoucher(net);
  }

  const orderRecord = {
    reference: orderRef,
    country: 'CO',
    buyerName: state.user.name,
    buyerIdentifier: state.user.identifier,
    docNumber,
    phone: `+57 ${phone}`,
    department,
    city,
    paymentMethod: method,
    paymentMethodLabel: methodNames[method],
    status: 'pending_payment',
    mode: KRONO_CONFIG.payments.liveCheckoutEnabled ? 'production' : 'sandbox_pending_credentials',
    totalCOP,
    totalUSD: Number(totalUSD.toFixed(2)),
    createdAt,
    voucher,
    items: items.map(({ game, qty }) => ({
      gameId: game.id,
      title: game.title,
      qty,
      unitPriceCOP: toCopAmount(game.priceUSD)
    }))
  };

  state.orders.unshift(orderRecord);
  state.cart = [];
  state.promoCode = null;
  saveState();
  updateHeaderUI();
  updateAuroraHud();
  renderCatalog();

  const resultView = document.getElementById('checkoutResultView');
  document.getElementById('checkoutFormView').hidden = true;
  resultView.hidden = false;

  const voucherHtml = voucher
    ? `
      <div class="voucher-box">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap">
          <strong style="font-size: 14px">Comprobante de Pago en Corresponsal (${escapeHtml(voucher.network)})</strong>
          <span class="meta-tag" style="color: var(--accent)">Vigencia 48 horas</span>
        </div>
        <p style="margin: 8px 0 4px; font-size: 12.5px; color: var(--ink-secondary)">
          Presenta este código de pago en cualquier punto <strong>${escapeHtml(voucher.network)}</strong> en Colombia:
        </p>
        <code class="voucher-code" id="corresponsalCodeText">${escapeHtml(voucher.paymentCode)}</code>
        <div class="voucher-meta-grid">
          <div><span>Red / Convenio</span><strong>${escapeHtml(voucher.network)} · #${escapeHtml(voucher.convenio)}</strong></div>
          <div><span>Valor exacto a pagar</span><strong>$${totalCOP.toLocaleString('es-CO')} COP</strong></div>
          <div><span>Referencia de pedido</span><strong>${escapeHtml(orderRef)}</strong></div>
          <div><span>Vence el</span><strong>${escapeHtml(voucher.expiresAt)}</strong></div>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px">
          <button type="button" class="btn btn-primary btn-sm" data-copy-key="${escapeHtml(voucher.paymentCode)}">
            Copiar código de pago
          </button>
          <button type="button" class="btn btn-secondary btn-sm" id="btnPrintVoucher">
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>
    `
    : `
      <div class="digital-key-card" style="margin: 14px 0">
        <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px">
          Método seleccionado: ${escapeHtml(orderRecord.paymentMethodLabel)}
        </div>
        <p style="margin: 0; font-size: 12.5px; color: var(--ink-secondary)">
          Estado actual: <strong>Pendiente de confirmación de pasarela (Modo Sandbox)</strong>.
          Las claves digitales y órdenes de despacho físico se liberan únicamente cuando el webhook
          firmado de Wompi / PayPal confirma el estado <code>APPROVED</code> en el servidor.
        </p>
      </div>
    `;

  resultView.innerHTML = `
    <span class="provider-pill" style="color: var(--accent); border-color: var(--accent); margin-bottom: 10px">
      ORDEN REGISTRADA · PENDIENTE DE PAGO (MODO SANDBOX COLOMBIA)
    </span>
    <h3 style="margin: 0 0 6px; font-size: 19px">Pedido ${escapeHtml(orderRef)}</h3>
    <p style="margin: 0 0 12px; font-size: 13px; color: var(--ink-secondary)">
      Titular: <strong>${escapeHtml(orderRecord.buyerName)}</strong> · ${escapeHtml(orderRecord.city)}, ${escapeHtml(orderRecord.department)} (Colombia).
      <strong>No se realizó ningún cobro real</strong> mientras la pasarela Wompi / PayPal permanezca en modo sandbox.
    </p>
    ${voucherHtml}
    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px">
      <button type="button" class="btn btn-secondary btn-sm" id="btnOpenOrdersFromCheckout">Ver mis pedidos</button>
      <button type="button" class="btn btn-primary btn-sm" data-close-modal="checkoutModal" style="flex: 1">
        Seguir explorando KRONO
      </button>
    </div>
  `;

  document.getElementById('btnPrintVoucher')?.addEventListener('click', () => window.print());
  document.getElementById('btnOpenOrdersFromCheckout')?.addEventListener('click', () => {
    closeModal('checkoutModal');
    openAccountDrawer('profile');
  });

  showToast(
    voucher
      ? `Código de pago en ${voucher.network} generado: ${voucher.paymentCode}`
      : `Pedido ${orderRef} registrado en estado pendiente.`
  );
}

function openAccountDrawer(focusSection = 'profile') {
  const body = document.getElementById('accountBody');
  const footer = document.getElementById('accountFooter');
  document.getElementById('accountDrawerTitle').textContent =
    focusSection === 'wishlist' ? 'Lista de deseos' : 'Tu espacio en Krono';

  const userCard = state.user
    ? `
      <div class="digital-key-card" style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px">
        <span class="avatar-circle" style="width: 38px; height: 38px; font-size: 14px">${escapeHtml(state.user.initials)}</span>
        <div style="min-width: 0">
          <div style="font-weight: 700; font-size: 15px">${escapeHtml(state.user.name)}</div>
          <div style="font-size: 12.5px; color: var(--ink-secondary); overflow: hidden; text-overflow: ellipsis">${escapeHtml(state.user.identifier)}</div>
          <span class="provider-pill" style="margin-top: 6px">Acceso vía ${escapeHtml(state.user.provider)}</span>
        </div>
      </div>
    `
    : `
      <div class="digital-key-card" style="margin-bottom: 16px">
        <div style="font-weight: 700; margin-bottom: 4px">Navegando como invitado</div>
        <p style="margin: 0 0 12px; font-size: 13px; color: var(--ink-secondary)">
          Debes iniciar sesión para realizar compras en Colombia, guardar pedidos y consultar códigos de corresponsal.
        </p>
        <button type="button" id="btnAccountSignIn" class="btn btn-primary btn-sm btn-full">Acceder a cuenta</button>
      </div>
    `;

  const wishlistGames = state.wishlist.map((id) => findGameById(id)).filter(Boolean);
  const wishlistHtml = wishlistGames.length
    ? wishlistGames
        .map(
          (g) => `
      <div class="cart-item">
        <img src="${g.cover}" alt="${escapeHtml(g.title)}" onerror="this.onerror=null;this.src='${g.fallbackCover}'" />
        <div>
          <h4>${escapeHtml(g.title)}</h4>
          <div class="cart-item-meta">${g.year} · ${formatPrice(g.priceUSD)}</div>
          <div style="display: flex; gap: 10px">
            <button type="button" class="link-btn" data-open-detail="${escapeHtml(g.id)}">Ver ficha</button>
            <button type="button" class="link-btn" style="color: var(--ink-muted)" data-remove-wish="${escapeHtml(g.id)}">Quitar</button>
          </div>
        </div>
      </div>
    `
        )
        .join('')
    : `<p style="font-size: 13px; color: var(--ink-muted)">Aún no has guardado juegos en favoritos.</p>`;

  const ordersHtml = state.orders.length
    ? state.orders
        .map(
          (ord) => `
      <div class="digital-key-card">
        <div style="display: flex; justify-content: space-between; gap: 6px; align-items: center">
          <strong style="font-size: 13px">${escapeHtml(ord.reference)}</strong>
          <span class="meta-tag" style="color: var(--accent)">Pendiente de pago</span>
        </div>
        <div style="font-size: 11.5px; color: var(--ink-muted); margin: 4px 0">
          ${escapeHtml(ord.createdAt)} · ${escapeHtml(ord.paymentMethodLabel)} · $${Number(ord.totalCOP).toLocaleString('es-CO')} COP
        </div>
        <div style="font-size: 12px; color: var(--ink-secondary)">
          ${ord.items.map((i) => `${i.qty}× ${escapeHtml(i.title)}`).join(', ')}
        </div>
        ${
          ord.voucher
            ? `<code class="key-code" data-copy-key="${escapeHtml(ord.voucher.paymentCode)}" style="cursor: pointer" title="Clic para copiar">${escapeHtml(ord.voucher.network)}: ${escapeHtml(ord.voucher.paymentCode)}</code>`
            : ''
        }
      </div>
    `
        )
        .join('')
    : `<p style="font-size: 13px; color: var(--ink-muted)">Aún no has registrado pedidos en Colombia.</p>`;

  body.innerHTML = `
    ${userCard}
    <h3 style="margin: 16px 0 8px; font-size: 15px">Lista de deseos (${wishlistGames.length})</h3>
    ${wishlistHtml}
    <h3 style="margin: 22px 0 10px; font-size: 15px">Pedidos en Colombia (${state.orders.length})</h3>
    ${ordersHtml}
  `;

  footer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px">
      <button type="button" id="btnDrawerEditPrefs" class="btn btn-secondary btn-full btn-sm">Editar mis gustos</button>
      ${state.user ? `<button type="button" id="btnSignOut" class="btn btn-ghost btn-full btn-sm" style="color: var(--sale)">Cerrar sesión</button>` : ''}
    </div>
  `;

  document.getElementById('btnAccountSignIn')?.addEventListener('click', () => {
    closeDrawer('accountDrawer');
    openAuthModal();
  });
  document.getElementById('btnDrawerEditPrefs')?.addEventListener('click', () => {
    closeDrawer('accountDrawer');
    openPrefsModal();
  });
  document.getElementById('btnSignOut')?.addEventListener('click', signOutUser);
  openDrawer('accountDrawer');
}

function setActiveSection(section) {
  filterState.section = section;
  visibleCount = KRONO_CONFIG.catalog.pageSize;
  document.querySelectorAll('.tab-btn[data-section]').forEach((btn) => {
    const active = btn.dataset.section === section;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  renderCatalog();
}

function resetFilters() {
  filterState = { ...defaultFilters };
  visibleCount = KRONO_CONFIG.catalog.pageSize;
  document.getElementById('searchInput').value = '';
  document.getElementById('platformFilter').value = 'all';
  document.getElementById('genreFilter').value = 'all';
  document.getElementById('priceFilter').value = 'all';
  document.getElementById('yearFilter').value = 'all';
  document.getElementById('scoreFilter').value = 'all';
  document.getElementById('esrbFilter').value = 'all';
  document.getElementById('formatFilter').value = 'all';
  document.getElementById('sortSelect').value = 'popular';
  setActiveSection('todos');
}

function prefillContactIfLoggedIn() {
  if (!state.user) return;
  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  if (!nameInput.value) nameInput.value = state.user.name;
  if (!emailInput.value && state.user.identifier.includes('@') && !state.user.identifier.startsWith('@')) {
    emailInput.value = state.user.identifier;
  }
}

/* ==========================================================================
   Eventos globales
   ========================================================================== */
function bindEvents() {
  // Aurora CoverFlow
  document.getElementById('cfPrev').addEventListener('click', () => stepCoverflow(-1));
  document.getElementById('cfNext').addEventListener('click', () => stepCoverflow(1));

  const cfTrack = document.getElementById('coverflowTrack');
  cfTrack.addEventListener('click', (e) => {
    const discBtn = e.target.closest('[data-toggle-disc]');
    if (discBtn) {
      e.stopPropagation();
      const slot = discBtn.closest('.cf-slot');
      if (slot && Number(slot.dataset.cfIndex) === coverflowIndex) {
        coverflowCaseState = 'open';
        coverflowDiscOut = !coverflowDiscOut;
        updateAuroraPositions();
      }
      return;
    }

    const slot = e.target.closest('.cf-slot');
    if (!slot) return;
    const idx = Number(slot.dataset.cfIndex);
    if (idx !== coverflowIndex) {
      coverflowIndex = idx;
      coverflowCaseState = 'front';
      coverflowDiscOut = false;
      updateAuroraPositions();
    } else {
      coverflowCaseState = coverflowCaseState === 'open' ? 'front' : 'open';
      if (coverflowCaseState !== 'open') coverflowDiscOut = false;
      updateAuroraPositions();
    }
  });

  let touchStartX = 0;
  cfTrack.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true }
  );
  cfTrack.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(dx) > 40) stepCoverflow(dx < 0 ? 1 : -1);
    },
    { passive: true }
  );

  // HUD Aurora
  document.getElementById('btnHudFlip').addEventListener('click', () => {
    coverflowCaseState = coverflowCaseState === 'back' ? 'front' : 'back';
    coverflowDiscOut = false;
    updateAuroraPositions();
  });

  document.getElementById('btnHudOpen').addEventListener('click', () => {
    coverflowCaseState = coverflowCaseState === 'open' ? 'front' : 'open';
    if (coverflowCaseState !== 'open') coverflowDiscOut = false;
    updateAuroraPositions();
  });

  document.getElementById('btnHudDisc').addEventListener('click', () => {
    if (coverflowCaseState !== 'open') {
      coverflowCaseState = 'open';
      coverflowDiscOut = true;
    } else {
      coverflowDiscOut = !coverflowDiscOut;
    }
    updateAuroraPositions();
  });

  document.getElementById('btnHudInspect').addEventListener('click', () => {
    const g = featuredGames[coverflowIndex];
    if (g) openGameDetail(g.id, { mode: coverflowDiscOut ? 'disc' : coverflowCaseState });
  });

  document.getElementById('btnHudCart').addEventListener('click', () => {
    const g = featuredGames[coverflowIndex];
    if (g) addToCart(g.id);
  });

  // Tema y moneda
  document.getElementById('btnThemeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    applyTheme();
  });

  document.querySelectorAll('[data-currency]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currency = btn.dataset.currency;
      saveState();
      syncCurrencyButtons();
      updateAuroraHud();
      renderCatalog();
      if (document.getElementById('cartDrawer').classList.contains('open')) renderCartDrawer();
      showToast(`Precios mostrados en ${state.currency}.`);
    });
  });

  // Menú móvil
  document.getElementById('btnMobileMenu').addEventListener('click', openMobileMenu);
  document.getElementById('btnCloseMobileMenu').addEventListener('click', closeMobileMenu);
  document.getElementById('mobileNavDrawer').addEventListener('click', (e) => {
    if (e.target.id === 'mobileNavDrawer') closeMobileMenu();
  });
  document.querySelectorAll('[data-mobile-nav]').forEach((link) => {
    link.addEventListener('click', () => {
      setActiveSection(link.dataset.mobileNav);
      closeMobileMenu();
    });
  });
  document.querySelectorAll('[data-mobile-close]').forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });
  document.getElementById('btnMobilePersonalize').addEventListener('click', () => {
    closeMobileMenu();
    openPrefsModal();
  });
  document.getElementById('btnMobileAuth').addEventListener('click', () => {
    closeMobileMenu();
    if (state.user) openAccountDrawer('profile');
    else openAuthModal();
  });

  // Header & navegación
  document.querySelectorAll('[data-nav-section]').forEach((link) => {
    link.addEventListener('click', () => setActiveSection(link.dataset.navSection));
  });
  document.getElementById('btnAccount').addEventListener('click', () => {
    if (state.user) openAccountDrawer('profile');
    else openAuthModal();
  });
  document.getElementById('btnOpenWishlist').addEventListener('click', () => openAccountDrawer('wishlist'));
  document.getElementById('btnOpenCart').addEventListener('click', openCart);
  document.getElementById('btnOpenPrefs').addEventListener('click', openPrefsModal);
  document.getElementById('btnFooterPrefs').addEventListener('click', openPrefsModal);

  document.getElementById('presetChips').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-preset]');
    if (btn) applyTastePreset(btn.dataset.preset);
  });

  // Catálogo: pestañas y filtros combinados
  document.querySelectorAll('.tab-btn[data-section]').forEach((btn) => {
    btn.addEventListener('click', () => setActiveSection(btn.dataset.section));
  });

  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('focus', renderSearchDropdown);
  searchInput.addEventListener('input', (e) => {
    filterState.search = e.target.value;
    visibleCount = KRONO_CONFIG.catalog.pageSize;
    renderSearchDropdown();
    renderCatalog();
  });
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      pushSearchHistory(searchInput.value);
      hideSearchDropdown();
    }
  });

  const bindSelect = (id, key) => {
    document.getElementById(id)?.addEventListener('change', (e) => {
      filterState[key] = e.target.value;
      visibleCount = KRONO_CONFIG.catalog.pageSize;
      renderCatalog();
    });
  };
  bindSelect('platformFilter', 'platform');
  bindSelect('genreFilter', 'genre');
  bindSelect('priceFilter', 'priceRange');
  bindSelect('yearFilter', 'yearRange');
  bindSelect('scoreFilter', 'minScore');
  bindSelect('esrbFilter', 'esrb');
  bindSelect('formatFilter', 'format');
  bindSelect('sortSelect', 'sort');

  document.getElementById('btnResetFilters').addEventListener('click', resetFilters);

  // Noticias filtros
  document.getElementById('newsFilters').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-news-cat]');
    if (!btn) return;
    newsCategory = btn.dataset.newsCat;
    document.querySelectorAll('#newsFilters [data-news-cat]').forEach((b) => {
      b.classList.toggle('active', b.dataset.newsCat === newsCategory);
    });
    renderNews();
  });

  // Delegación global de clicks
  document.addEventListener('click', (e) => {
    // Cerrar dropdown de búsqueda si se hace clic fuera
    if (!e.target.closest('#searchContainer')) {
      hideSearchDropdown();
    }

    // Sugerencias de búsqueda e historial
    const suggestGame = e.target.closest('[data-suggest-game]');
    if (suggestGame) {
      const g = findGameById(suggestGame.dataset.suggestGame);
      if (g) pushSearchHistory(g.title);
      hideSearchDropdown();
      openGameDetail(suggestGame.dataset.suggestGame, { mode: 'front' });
      return;
    }

    const suggestQuery = e.target.closest('[data-suggest-query]');
    if (suggestQuery) {
      const q = suggestQuery.dataset.suggestQuery;
      searchInput.value = q;
      filterState.search = q;
      visibleCount = KRONO_CONFIG.catalog.pageSize;
      pushSearchHistory(q);
      hideSearchDropdown();
      renderCatalog();
      return;
    }

    if (e.target.id === 'btnClearHistory') {
      clearSearchHistory();
      hideSearchDropdown();
      showToast('Historial de búsqueda limpiado.');
      return;
    }

    // Chips removibles de filtros activos
    const removeChip = e.target.closest('[data-remove-filter]');
    if (removeChip) {
      removeSingleFilter(removeChip.dataset.removeFilter);
      return;
    }

    // 1. Clic en disco interior de una caja del catálogo
    const cardDiscBtn = e.target.closest('#gamesGrid [data-toggle-disc]');
    if (cardDiscBtn) {
      e.stopPropagation();
      toggleAuroraDisc(cardDiscBtn.closest('.aurora-case'));
      return;
    }

    // 2. Botón táctil Reverso / Portada en tarjeta de catálogo
    const flipCardBtn = e.target.closest('[data-flip-card]');
    if (flipCardBtn) {
      e.stopPropagation();
      const card = flipCardBtn.closest('.game-card');
      const box = card?.querySelector('.card-case-box');
      const caseEl = card?.querySelector('.aurora-case');
      const openBtn = card?.querySelector('[data-open-case-card]');
      if (caseEl) {
        const next = caseEl.dataset.caseState === 'back' ? 'front' : 'back';
        setAuroraCaseState(caseEl, next);
        box?.classList.remove('has-open-case');
        flipCardBtn.textContent = next === 'back' ? '↺ Portada' : '↺ Reverso';
        if (openBtn) openBtn.textContent = '◉ Abrir caja';
      }
      return;
    }

    // 3. Botón Abrir / Cerrar caja 3D en tarjeta de catálogo
    const openCaseCardBtn = e.target.closest('[data-open-case-card]');
    if (openCaseCardBtn) {
      e.stopPropagation();
      const card = openCaseCardBtn.closest('.game-card');
      const box = card?.querySelector('.card-case-box');
      const caseEl = card?.querySelector('.aurora-case');
      const flipBtn = card?.querySelector('[data-flip-card]');
      if (caseEl) {
        const opening = !caseEl.classList.contains('is-open');
        setAuroraCaseState(caseEl, opening ? 'open' : 'front');
        box?.classList.toggle('has-open-case', opening);
        openCaseCardBtn.textContent = opening ? '✕ Cerrar' : '◉ Abrir caja';
        if (flipBtn) flipBtn.textContent = '↺ Reverso';
      }
      return;
    }

    // 4. Clic directo sobre la caja 3D en el catálogo: abre/cierra con bisagra
    const cardCaseTrigger = e.target.closest('[data-card-case-trigger]');
    if (cardCaseTrigger) {
      const card = cardCaseTrigger.closest('.game-card');
      const box = card?.querySelector('.card-case-box');
      const caseEl = cardCaseTrigger.querySelector('.aurora-case');
      const openBtn = card?.querySelector('[data-open-case-card]');
      const flipBtn = card?.querySelector('[data-flip-card]');
      if (caseEl) {
        const opening = !caseEl.classList.contains('is-open');
        setAuroraCaseState(caseEl, opening ? 'open' : 'front');
        box?.classList.toggle('has-open-case', opening);
        if (openBtn) openBtn.textContent = opening ? '✕ Cerrar' : '◉ Abrir caja';
        if (flipBtn) flipBtn.textContent = '↺ Reverso';
      }
      return;
    }

    const wishBtn = e.target.closest('[data-toggle-wishlist]');
    if (wishBtn) {
      e.stopPropagation();
      toggleWishlist(wishBtn.dataset.toggleWishlist);
      return;
    }

    const addCartBtn = e.target.closest('[data-add-cart]');
    if (addCartBtn) {
      e.stopPropagation();
      addToCart(addCartBtn.dataset.addCart);
      return;
    }

    const detailBtn = e.target.closest('[data-open-detail]');
    if (detailBtn) {
      closeDrawer('accountDrawer');
      openGameDetail(detailBtn.dataset.openDetail, { mode: 'front' });
      return;
    }

    const newsCard = e.target.closest('[data-open-news]');
    if (newsCard) {
      openNewsModal(newsCard.dataset.openNews);
      return;
    }

    const trailerBox = e.target.closest('[data-trailer-embed]');
    if (trailerBox && !trailerBox.querySelector('iframe')) {
      const ytId = trailerBox.dataset.trailerEmbed;
      const title = trailerBox.dataset.trailerTitle;
      trailerBox.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0" title="Tráiler de ${title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      return;
    }

    const qtyBtn = e.target.closest('[data-cart-qty]');
    if (qtyBtn) {
      updateCartQty(qtyBtn.dataset.cartQty, Number(qtyBtn.dataset.delta));
      return;
    }

    const removeWishBtn = e.target.closest('[data-remove-wish]');
    if (removeWishBtn) {
      toggleWishlist(removeWishBtn.dataset.removeWish);
      openAccountDrawer('wishlist');
      return;
    }

    const copyBtn = e.target.closest('[data-copy-key]');
    if (copyBtn) {
      navigator.clipboard?.writeText(copyBtn.dataset.copyKey).catch(() => {});
      showToast(`Referencia copiada: ${copyBtn.dataset.copyKey}`);
      return;
    }

    const closeModalBtn = e.target.closest('[data-close-modal]');
    if (closeModalBtn) {
      closeModal(closeModalBtn.dataset.closeModal);
      return;
    }

    const closeDrawerBtn = e.target.closest('[data-close-drawer]');
    if (closeDrawerBtn) {
      closeDrawer(closeDrawerBtn.dataset.closeDrawer);
      return;
    }

    if (e.target.classList.contains('modal-backdrop')) closeModal(e.target.id);
    if (e.target.classList.contains('drawer-backdrop')) closeDrawer(e.target.id);
  });

  // Modal de personalización
  document.getElementById('prefsModal').addEventListener('click', (e) => {
    const eraBtn = e.target.closest('[data-pref-era]');
    if (eraBtn) {
      draftPrefs.presetId = null;
      toggleArrayItem(draftPrefs.eras, eraBtn.dataset.prefEra);
      renderPrefsModalOptions();
      return;
    }
    const genreBtn = e.target.closest('[data-pref-genre]');
    if (genreBtn) {
      draftPrefs.presetId = null;
      toggleArrayItem(draftPrefs.genres, genreBtn.dataset.prefGenre);
      renderPrefsModalOptions();
      return;
    }
    const platBtn = e.target.closest('[data-pref-platform]');
    if (platBtn) {
      draftPrefs.presetId = null;
      toggleArrayItem(draftPrefs.platforms, platBtn.dataset.prefPlatform);
      renderPrefsModalOptions();
      return;
    }
    const budgetBtn = e.target.closest('[data-budget]');
    if (budgetBtn) {
      draftPrefs.presetId = null;
      draftPrefs.budget = budgetBtn.dataset.budget;
      renderPrefsModalOptions();
    }
  });

  document.getElementById('btnSavePrefs').addEventListener('click', () => {
    state.prefs = clonePrefs(draftPrefs);
    saveState();
    renderPersonalizeRibbon();
    filterState.sort = 'recommended';
    document.getElementById('sortSelect').value = 'recommended';
    setActiveSection(hasCustomPrefs() ? 'parati' : 'todos');
    closeModal('prefsModal');
    showToast('Preferencias aplicadas a tu catálogo.');
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btnClearPrefs').addEventListener('click', () => {
    draftPrefs = clonePrefs(defaultState.prefs);
    renderPrefsModalOptions();
  });

  // Auth modal
  document.querySelectorAll('[data-social-provider]').forEach((btn) => {
    btn.addEventListener('click', () => startSocialAuth(btn.dataset.socialProvider));
  });
  document.getElementById('btnBackSocial').addEventListener('click', () => {
    document.getElementById('authSocialView').hidden = true;
    document.getElementById('authMainView').hidden = false;
  });
  document.getElementById('socialConfirmForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pendingSocialProvider) return;
    const name = document.getElementById('socialNameInput').value.trim();
    const handle = document.getElementById('socialHandleInput').value.trim();
    if (!name || !handle) return;
    signInUser({ name, identifier: handle, provider: pendingSocialProvider.provider });
  });
  document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.authTab));
  });
  document.getElementById('btnToggleAuthMode').addEventListener('click', toggleEmailAuthMode);

  document.getElementById('btnForgotPassword')?.addEventListener('click', async () => {
    const email = document.getElementById('authEmail').value.trim();
    if (!email || !email.includes('@')) {
      return showToast('Escribe primero tu correo electrónico para solicitar recuperación.');
    }
    if (isSupabaseConfigured()) {
      const { error } = await requestPasswordReset(email);
      if (error) return showToast(error.message);
      return showToast(`Correo de recuperación enviado a ${email}.`);
    }
    showToast('La recuperación real por correo requiere configurar Supabase Auth (js/config.js).');
  });

  document.getElementById('emailAuthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const fullName = document.getElementById('authFullName').value.trim();
    if (!email || !email.includes('@')) return showToast('Ingresa un correo electrónico válido.');
    if (password.length < 6) return showToast('La contraseña debe tener al menos 6 caracteres.');

    if (isSupabaseConfigured()) {
      const res =
        authMode === 'register'
          ? await signUpWithEmailPassword(email, password, fullName || email.split('@')[0])
          : await signInWithEmailPassword(email, password);
      if (res.error) return showToast(res.error.message);
      const userObj = res.data?.user;
      const displayName = userObj?.user_metadata?.full_name || fullName || email.split('@')[0];
      signInUser({ name: displayName, identifier: email, provider: 'Supabase Email', realAuth: true });
      e.target.reset();
      return;
    }

    const derivedName =
      authMode === 'register' && fullName
        ? fullName
        : email
            .split('@')[0]
            .replace(/[._-]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    signInUser({ name: derivedName, identifier: email, provider: 'Correo (Vista previa)' });
    e.target.reset();
  });

  const otpInputs = Array.from({ length: 6 }, (_, i) => document.getElementById(`otpInput${i}`));
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/\D/g, '');
      e.target.value = clean.slice(0, 1);
      if (clean && index < otpInputs.length - 1) otpInputs[index + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) otpInputs[index - 1].focus();
    });
    input.addEventListener('paste', (e) => {
      const pasted = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6);
      if (pasted.length === 6) {
        e.preventDefault();
        otpInputs.forEach((box, idx) => {
          box.value = pasted[idx] || '';
        });
        otpInputs[5].focus();
      }
    });
  });

  document.getElementById('btnSendOtp').addEventListener('click', async () => {
    const code = document.getElementById('authPhoneCode').value;
    const number = document.getElementById('authPhoneNumber').value.replace(/[^\d\s-]/g, '').trim();
    if (number.replace(/\D/g, '').length < 7) return showToast('Ingresa un número válido (mínimo 7 dígitos).');
    const phoneE164 = `${code}${number.replace(/\D/g, '')}`;
    pendingPhoneFormatted = `${code} ${number}`;

    if (isSupabaseConfigured()) {
      const { error } = await sendPhoneOtp(phoneE164);
      if (error) return showToast(error.message);
      document.getElementById('phoneStep1').hidden = true;
      document.getElementById('phoneStep2').hidden = false;
      document.getElementById('phoneOtpHint').textContent = `Código SMS enviado a ${pendingPhoneFormatted}.`;
      otpInputs.forEach((b) => (b.value = ''));
      otpInputs[0].focus();
      return showToast(`SMS enviado a ${pendingPhoneFormatted}.`);
    }

    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById('phoneStep1').hidden = true;
    document.getElementById('phoneStep2').hidden = false;
    document.getElementById('phoneOtpHint').textContent = `Vista previa SMS (${pendingPhoneFormatted}). Código local: ${generatedOtp}`;
    otpInputs.forEach((b) => (b.value = ''));
    otpInputs[0].focus();
    showToast(`Vista previa SMS (${pendingPhoneFormatted}): código ${generatedOtp}`);
  });

  document.getElementById('btnBackPhone').addEventListener('click', () => {
    document.getElementById('phoneStep2').hidden = true;
    document.getElementById('phoneStep1').hidden = false;
  });

  document.getElementById('phoneAuthForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const entered = otpInputs.map((i) => i.value).join('');
    if (entered.length < 6) return showToast('Completa los 6 dígitos del código SMS.');

    if (isSupabaseConfigured()) {
      const phoneE164 = pendingPhoneFormatted.replace(/\s+/g, '');
      const { error } = await verifyPhoneOtp(phoneE164, entered);
      if (error) return showToast(error.message);
      signInUser({ name: `Jugador ${pendingPhoneFormatted.slice(-4)}`, identifier: pendingPhoneFormatted, provider: 'Supabase SMS', realAuth: true });
      e.target.reset();
      document.getElementById('phoneStep2').hidden = true;
      document.getElementById('phoneStep1').hidden = false;
      return;
    }

    if (entered !== generatedOtp) return showToast(`Código incorrecto. Usa: ${generatedOtp}`);
    signInUser({ name: `Jugador ${pendingPhoneFormatted.slice(-4)}`, identifier: pendingPhoneFormatted, provider: 'Teléfono (Vista previa)' });
    e.target.reset();
    document.getElementById('phoneStep2').hidden = true;
    document.getElementById('phoneStep1').hidden = false;
  });

  // Checkout Colombia (selector de método de pago y envío)
  document.getElementById('paymentMethodsGrid')?.addEventListener('change', (e) => {
    if (e.target.name === 'paymentMethod') {
      updateCheckoutPaymentPanels(e.target.value);
    }
  });
  document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckoutSubmit);

  // Formulario de contacto
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const topic = document.getElementById('contactTopic').value;
    const message = document.getElementById('contactMessage').value.trim();
    const consent = document.getElementById('contactConsent').checked;
    const feedback = document.getElementById('contactFeedback');
    feedback.className = 'form-feedback show';

    if (!name || !email || !email.includes('@') || message.length < 10) {
      feedback.classList.add('error');
      feedback.textContent = 'Completa tu nombre, un correo válido y un mensaje de al menos 10 caracteres.';
      return;
    }
    if (!consent) {
      feedback.classList.add('error');
      feedback.textContent = 'Debes aceptar la autorización de contacto conforme a la Ley 1581/2012.';
      return;
    }

    const ticket = `KRN-${Math.floor(1000 + Math.random() * 9000)}`;
    feedback.classList.add('success');
    feedback.innerHTML = `
      <strong>¡Solicitud recibida! (Referencia #${ticket})</strong><br />
      Gracias, ${escapeHtml(name)}. Registramos tu mensaje sobre <em>${escapeHtml(topic)}</em> para responder a <strong>${escapeHtml(email)}</strong>.
    `;
    e.target.reset();
    prefillContactIfLoggedIn();
    showToast(`Solicitud enviada (#${ticket}).`);
  });

  // Navegación por hash (#/juego/<slug>) y teclado
  window.addEventListener('hashchange', handleHashRoute);

  document.addEventListener('keydown', (e) => {
    const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    const modalOpen = document.querySelector('.modal-backdrop.open, .drawer-backdrop.open');

    if (e.key === 'Escape') {
      hideSearchDropdown();
      closeModal('authModal');
      closeModal('prefsModal');
      closeModal('gameModal');
      closeModal('newsModal');
      closeModal('checkoutModal');
      closeDrawer('cartDrawer');
      closeDrawer('accountDrawer');
      closeMobileMenu();
    } else if (!inField && !modalOpen && e.key === '/') {
      e.preventDefault();
      searchInput.focus();
    } else if (!inField && !modalOpen && e.key === 'ArrowRight') {
      stepCoverflow(1);
    } else if (!inField && !modalOpen && e.key === 'ArrowLeft') {
      stepCoverflow(-1);
    }
  });
}

async function init() {
  applyTheme();
  syncCurrencyButtons();
  updateHeaderUI();
  renderPersonalizeRibbon();
  prefillContactIfLoggedIn();
  bindEvents();

  // Carga en paralelo: tasa COP/USD verificable, noticias verificadas RSS y catálogo de 500 juegos
  const [liveFx, , loaded] = await Promise.all([
    loadVerifiedFxRate(),
    loadVerifiedNews(),
    loadCatalog()
  ]);

  if (liveFx?.rate) {
    fxInfo = liveFx;
  }

  catalogGames = loaded.games;
  catalogMeta = loaded.meta;
  featuredGames = catalogGames.filter((g) => g.featured).slice(0, 12);
  if (featuredGames.length < 8) featuredGames = catalogGames.slice(0, 12);

  updateTabCounts();
  renderAuroraCoverflow();
  renderCatalog();
  renderTrailers();
  handleHashRoute();
}

init();
