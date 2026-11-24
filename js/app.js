import {
  DEMO_SOCIAL_ACCOUNTS,
  ERAS,
  GAMES,
  GENRES,
  PLATFORMS,
  PROMO_CODES,
  TASTE_PRESETS,
  USD_TO_COP
} from './data.js';

const STORAGE_KEY = 'krono_store_state_v1';

const defaultState = {
  theme: 'light',
  currency: 'COP',
  user: null, // { name, identifier, provider, initials }
  prefs: {
    presetId: null,
    eras: [],
    genres: [],
    platforms: [],
    budget: 'all'
  },
  wishlist: [],
  cart: [], // [{ id, qty }]
  promoCode: null,
  library: [], // [{ gameId, title, key, date, edition }]
  recentlyViewed: []
};

let state = loadState();
let filterState = {
  section: 'todos',
  search: '',
  platform: 'all',
  genre: 'all',
  sort: 'recommended'
};

let authMode = 'login'; // 'login' | 'register'
let pendingSocialProvider = null;
let generatedOtp = null;
let pendingPhoneFormatted = '';
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
    // Ignorar errores de almacenamiento privado
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

function formatPrice(usdAmount) {
  if (state.currency === 'USD') {
    return `$${usdAmount.toFixed(2)} USD`;
  }
  const cop = Math.round((usdAmount * USD_TO_COP) / 100) * 100;
  return `$${cop.toLocaleString('es-CO')} COP`;
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
  return String(str)
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

/**
 * Motor de afinidad personalizada: evalúa cada videojuego según gustos,
 * plataformas, historial reciente y lista de deseos del usuario.
 */
function scoreGameForUser(game) {
  let points = game.score * 0.45; // Base por calidad curatorial
  const reasons = [];

  if (state.prefs.eras.includes(game.era)) {
    points += 24;
    reasons.push(ERAS[game.era].shortLabel);
  }

  const matchedGenres = game.genres.filter((g) => state.prefs.genres.includes(g));
  if (matchedGenres.length > 0) {
    points += Math.min(28, matchedGenres.length * 16);
    reasons.push(matchedGenres[0]);
  }

  const matchedPlatforms = game.platforms.filter((p) => state.prefs.platforms.includes(p));
  if (matchedPlatforms.length > 0) {
    points += 14;
    if (reasons.length < 2) reasons.push(`en ${matchedPlatforms[0]}`);
  }

  if (state.prefs.budget === 'ofertas' && (game.discount >= 20 || game.priceUSD <= 25)) {
    points += 14;
    reasons.push('Gran precio');
  }

  if (state.wishlist.includes(game.id)) {
    points += 8;
  }

  if (state.recentlyViewed.includes(game.id)) {
    points += 4;
  }

  const affinity = Math.min(99, Math.max(72, Math.round(points)));
  const reasonText =
    reasons.length > 0
      ? `Ideal para ti · ${reasons.slice(0, 2).join(' + ')}`
      : game.featured
        ? 'Destacado por curaduría Krono'
        : '';

  return { affinity, reasonText, matched: reasons.length > 0 };
}

/* ==========================================================================
   Renderizado de UI
   ========================================================================== */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const sun = document.getElementById('iconSun');
  const moon = document.getElementById('iconMoon');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (state.theme === 'dark') {
    sun.hidden = false;
    moon.hidden = true;
    metaTheme?.setAttribute('content', '#111110');
  } else {
    sun.hidden = true;
    moon.hidden = false;
    metaTheme?.setAttribute('content', '#F7F6F2');
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
    avatar.hidden = false;
    userIcon.hidden = true;
    label.textContent = state.user.name.split(' ')[0];
    mobileAuthBtn.textContent = `Mi cuenta (${state.user.name.split(' ')[0]})`;
  } else {
    avatar.hidden = true;
    userIcon.hidden = false;
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
      parts.push(`Épocas: ${state.prefs.eras.map((e) => ERAS[e].shortLabel).join(', ')}`);
    }
    if (state.prefs.genres.length) {
      parts.push(`Géneros: ${state.prefs.genres.slice(0, 3).join(', ')}`);
    }
    if (state.prefs.platforms.length) {
      parts.push(`Plataformas: ${state.prefs.platforms.slice(0, 3).join(', ')}`);
    }
    if (state.prefs.budget === 'ofertas') {
      parts.push('Prioridad: Ofertas');
    }
    summary.textContent = parts.join(' · ');
  } else {
    summary.textContent =
      'Elige un perfil rápido o configura tus épocas, géneros y plataformas favoritas para reordenar el catálogo a tu medida.';
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

function updateHeroSpotlight() {
  const ranked = [...GAMES]
    .map((g) => ({ game: g, meta: scoreGameForUser(g) }))
    .sort((a, b) => b.meta.affinity - a.meta.affinity);

  const pick = hasCustomPrefs() ? ranked[0] : { game: GAMES[0], meta: scoreGameForUser(GAMES[0]) };
  const label = document.getElementById('spotlightLabel');
  const title = document.getElementById('spotlightTitle');
  const sub = document.getElementById('spotlightSub');
  const btn = document.getElementById('btnSpotlightDetail');

  label.textContent = hasCustomPrefs()
    ? `Recomendado para ti · ${pick.meta.affinity}% afinidad`
    : `Selección de la semana · ${pick.game.year}`;
  title.textContent = pick.game.title;
  sub.textContent = `${pick.game.genres.slice(0, 2).join(' · ')} · Nota ${pick.game.score}/100 · ${formatPrice(pick.game.priceUSD)}`;
  btn.dataset.gameId = pick.game.id;
}

function updateTabCounts() {
  document.getElementById('countTodos').textContent = String(GAMES.length);
  document.getElementById('countLanzamiento').textContent = String(
    GAMES.filter((g) => g.era === 'lanzamiento').length
  );
  document.getElementById('countModerno').textContent = String(
    GAMES.filter((g) => g.era === 'moderno').length
  );
  document.getElementById('countClasico').textContent = String(
    GAMES.filter((g) => g.era === 'clasico').length
  );
  document.getElementById('countOfertas').textContent = String(
    GAMES.filter((g) => g.discount > 0).length
  );
  document.getElementById('countParati').textContent = '6';
}

function getFilteredGames() {
  let list = GAMES.map((game) => ({
    game,
    ...scoreGameForUser(game)
  }));

  if (filterState.section === 'lanzamiento') {
    list = list.filter((item) => item.game.era === 'lanzamiento');
  } else if (filterState.section === 'moderno') {
    list = list.filter((item) => item.game.era === 'moderno');
  } else if (filterState.section === 'clasico') {
    list = list.filter((item) => item.game.era === 'clasico');
  } else if (filterState.section === 'ofertas') {
    list = list.filter((item) => item.game.discount > 0);
  } else if (filterState.section === 'parati') {
    list = list.sort((a, b) => b.affinity - a.affinity).slice(0, 6);
  }

  if (filterState.platform !== 'all') {
    list = list.filter((item) => item.game.platforms.includes(filterState.platform));
  }

  if (filterState.genre !== 'all') {
    list = list.filter((item) => item.game.genres.includes(filterState.genre));
  }

  if (filterState.search.trim()) {
    const q = filterState.search.trim().toLowerCase();
    list = list.filter(({ game }) => {
      const haystack = `${game.title} ${game.studio} ${game.year} ${game.genres.join(' ')} ${game.platforms.join(' ')} ${ERAS[game.era].label}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  switch (filterState.sort) {
    case 'score':
      list.sort((a, b) => b.game.score - a.game.score);
      break;
    case 'newest':
      list.sort((a, b) => b.game.year - a.game.year);
      break;
    case 'oldest':
      list.sort((a, b) => a.game.year - b.game.year);
      break;
    case 'price-asc':
      list.sort((a, b) => a.game.priceUSD - b.game.priceUSD);
      break;
    case 'price-desc':
      list.sort((a, b) => b.game.priceUSD - a.game.priceUSD);
      break;
    default:
      list.sort((a, b) => b.affinity - a.affinity);
      break;
  }

  return list;
}

function renderCatalog() {
  const grid = document.getElementById('gamesGrid');
  const resultsCount = document.getElementById('resultsCount');
  const resetBtn = document.getElementById('btnResetFilters');
  const items = getFilteredGames();

  const hasActiveFilters =
    filterState.section !== 'todos' ||
    filterState.platform !== 'all' ||
    filterState.genre !== 'all' ||
    filterState.search.trim() !== '';

  resetBtn.hidden = !hasActiveFilters;
  resultsCount.textContent =
    items.length === 1
      ? 'Mostrando 1 videojuego'
      : `Mostrando ${items.length} videojuegos`;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No encontramos juegos con esos filtros</h3>
        <p>Prueba cambiando la plataforma, el género o limpiando tu búsqueda actual.</p>
        <button type="button" class="btn btn-primary btn-sm" id="btnEmptyReset">
          Ver todo el catálogo
        </button>
      </div>
    `;
    document.getElementById('btnEmptyReset')?.addEventListener('click', resetFilters);
    return;
  }

  const showAffinity = hasCustomPrefs() || filterState.section === 'parati';

  grid.innerHTML = items
    .map(({ game, affinity, reasonText }) => {
      const isWishlisted = state.wishlist.includes(game.id);
      const inCart = state.cart.some((c) => c.id === game.id);
      const eraLabel = ERAS[game.era].shortLabel;

      return `
        <article class="game-card" data-game-card="${game.id}">
          <div class="game-cover-wrap" data-open-detail="${game.id}">
            <img
              src="${game.cover}"
              alt="Portada ilustrada de ${escapeHtml(game.title)}"
              width="720"
              height="960"
              loading="lazy"
            />
            <div class="cover-top-bar">
              <span class="era-tag">${game.year} · ${eraLabel}</span>
              <button
                type="button"
                class="wishlist-btn ${isWishlisted ? 'saved' : ''}"
                data-toggle-wishlist="${game.id}"
                aria-label="${isWishlisted ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
                aria-pressed="${isWishlisted}"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>
            <div class="cover-bottom-bar">
              ${game.discount > 0 ? `<span class="discount-tag">-${game.discount}%</span>` : ''}
              ${showAffinity ? `<span class="affinity-tag">${affinity}% afín</span>` : ''}
            </div>
          </div>

          <div class="game-body">
            <div class="game-meta-top">
              <span>${escapeHtml(game.studio)}</span>
              <span class="game-score" title="Calificación curatorial">${game.score}</span>
            </div>

            <h3 class="game-title" data-open-detail="${game.id}">${escapeHtml(game.title)}</h3>

            ${showAffinity && reasonText ? `<p class="game-reason">${escapeHtml(reasonText)}</p>` : ''}

            <div class="game-platforms">
              ${game.genres.slice(0, 2).join(' · ')} — ${game.platforms.slice(0, 3).join(', ')}
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
                  data-open-detail="${game.id}"
                  aria-label="Ver detalles de ${escapeHtml(game.title)}"
                >
                  <span class="btn-detail-label">Ficha</span>
                  <span aria-hidden="true">+</span>
                </button>
                <button
                  type="button"
                  class="btn ${inCart ? 'btn-accent' : 'btn-primary'} btn-sm"
                  data-add-cart="${game.id}"
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
}

function renderTrailers() {
  const featuredIds = ['expedition-33', 'elden-ring', 'shadow-colossus'];
  const container = document.getElementById('trailersGrid');

  container.innerHTML = featuredIds
    .map((id) => {
      const game = GAMES.find((g) => g.id === id);
      if (!game) return '';
      return `
        <article class="trailer-card">
          <div class="trailer-player" data-trailer-embed="${game.youtubeId}" data-trailer-title="${escapeHtml(game.title)}">
            <img src="${game.cover}" alt="Vista previa del tráiler de ${escapeHtml(game.title)}" loading="lazy" />
            <button type="button" class="play-overlay" aria-label="Reproducir tráiler oficial de ${escapeHtml(game.title)}">
              <span class="play-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
              </span>
              <span style="font-size: 12.5px; font-weight: 600">Reproducir tráiler oficial</span>
            </button>
          </div>
          <div class="trailer-meta">
            <h3>${escapeHtml(game.title)} (${game.year})</h3>
            <p>${ERAS[game.era].label} · ${escapeHtml(game.studio)} · <a href="https://www.youtube.com/watch?v=${game.youtubeId}" target="_blank" rel="noopener noreferrer" class="link-btn">Abrir en YouTube ↗</a></p>
          </div>
        </article>
      `;
    })
    .join('');
}

/* ==========================================================================
   Modales y Drawers (Apertura, Cierre, Accesibilidad)
   ========================================================================== */
function openModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('open');
  el.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('open');
  el.setAttribute('aria-hidden', 'true');
  if (id === 'gameModal') {
    // Limpiar iframe para detener audio/video inmediatamente
    document.getElementById('detailContent').innerHTML = '';
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

/* ==========================================================================
   Ficha de detalle del videojuego + Tráiler
   ========================================================================== */
function openGameDetail(gameId, autoPlayTrailer = false) {
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) return;

  if (!state.recentlyViewed.includes(gameId)) {
    state.recentlyViewed.unshift(gameId);
    state.recentlyViewed = state.recentlyViewed.slice(0, 6);
    saveState();
  }

  const { affinity, reasonText } = scoreGameForUser(game);
  const isWishlisted = state.wishlist.includes(game.id);
  const inCart = state.cart.some((c) => c.id === game.id);

  document.getElementById('detailKicker').textContent = `${ERAS[game.era].label} · ${game.year} · ${game.studio}`;
  document.getElementById('detailTitle').textContent = game.title;

  const content = document.getElementById('detailContent');
  content.innerHTML = `
    <div id="detailTrailerSlot" ${autoPlayTrailer ? '' : 'hidden'}>
      ${
        autoPlayTrailer
          ? `<div class="detail-video-box"><iframe src="https://www.youtube-nocookie.com/embed/${game.youtubeId}?autoplay=1&rel=0" title="Tráiler oficial de ${escapeHtml(game.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
          : ''
      }
    </div>

    <div class="detail-grid">
      <div class="detail-media">
        <img src="${game.cover}" alt="Portada de ${escapeHtml(game.title)}" />
      </div>

      <div>
        <div class="detail-specs-row">
          <span class="meta-tag">Nota ${game.score}/100</span>
          <span class="meta-tag">Duración: ${game.playtime}</span>
          <span class="meta-tag">${escapeHtml(game.edition)}</span>
          ${hasCustomPrefs() ? `<span class="meta-tag" style="color: var(--accent)">${affinity}% afinidad</span>` : ''}
        </div>

        <p style="margin: 0 0 12px; color: var(--ink-secondary)">${escapeHtml(game.synopsis)}</p>

        <div class="editorial-note">
          <strong>Por qué vale la pena</strong>
          ${escapeHtml(game.whyWorthIt)}
        </div>

        ${reasonText && hasCustomPrefs() ? `<p class="game-reason" style="margin-bottom: 12px">${escapeHtml(reasonText)}</p>` : ''}

        <p style="margin: 0 0 6px; font-size: 13px; color: var(--ink-secondary)">
          <strong>Plataformas:</strong> ${game.platforms.join(', ')}
        </p>
        <p style="margin: 0 0 14px; font-size: 13px; color: var(--ink-secondary)">
          <strong>Requisitos / compatibilidad:</strong> ${escapeHtml(game.specs)}
        </p>

        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 20px">
          ${game.tags.map((t) => `<span class="meta-tag">${escapeHtml(t)}</span>`).join('')}
        </div>

        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding-top: 16px; border-top: 1px solid var(--border)">
          <div class="price-block">
            <span class="price-current" style="font-size: 20px">${formatPrice(game.priceUSD)}</span>
            ${game.originalPriceUSD ? `<span class="price-old">${formatPrice(game.originalPriceUSD)} (-${game.discount}%)</span>` : ''}
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            <button type="button" class="btn btn-secondary btn-sm" id="btnDetailTrailer">
              ${autoPlayTrailer ? 'Ocultar tráiler' : '▶ Ver tráiler'}
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnDetailWishlist">
              ${isWishlisted ? '♥ Guardado' : '♡ Favorito'}
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btnDetailAddCart">
              ${inCart ? 'Añadir otra copia' : 'Añadir al carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  let trailerVisible = autoPlayTrailer;
  document.getElementById('btnDetailTrailer').addEventListener('click', () => {
    const slot = document.getElementById('detailTrailerSlot');
    const btn = document.getElementById('btnDetailTrailer');
    trailerVisible = !trailerVisible;
    if (trailerVisible) {
      slot.hidden = false;
      slot.innerHTML = `
        <div class="detail-video-box">
          <iframe src="https://www.youtube-nocookie.com/embed/${game.youtubeId}?autoplay=1&rel=0" title="Tráiler oficial de ${escapeHtml(game.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      `;
      btn.textContent = 'Ocultar tráiler';
    } else {
      slot.hidden = true;
      slot.innerHTML = '';
      btn.textContent = '▶ Ver tráiler';
    }
  });

  document.getElementById('btnDetailWishlist').addEventListener('click', (e) => {
    toggleWishlist(game.id);
    const saved = state.wishlist.includes(game.id);
    e.currentTarget.textContent = saved ? '♥ Guardado' : '♡ Favorito';
  });

  document.getElementById('btnDetailAddCart').addEventListener('click', () => {
    addToCart(game.id);
    closeModal('gameModal');
    openCart();
  });

  openModal('gameModal');
}

/* ==========================================================================
   Personalización de gustos (Modal & Presets)
   ========================================================================== */
function openPrefsModal() {
  draftPrefs = clonePrefs(state.prefs);
  renderPrefsModalOptions();
  openModal('prefsModal');
}

function renderPrefsModalOptions() {
  const erasEl = document.getElementById('prefEras');
  erasEl.innerHTML = Object.values(ERAS)
    .map(
      (era) => `
      <button type="button" class="chip ${draftPrefs.eras.includes(era.id) ? 'active' : ''}" data-pref-era="${era.id}">
        ${era.label} (${era.range})
      </button>
    `
    )
    .join('');

  const genresEl = document.getElementById('prefGenres');
  genresEl.innerHTML = GENRES.map(
    (g) => `
      <button type="button" class="chip ${draftPrefs.genres.includes(g) ? 'active' : ''}" data-pref-genre="${g}">
        ${g}
      </button>
    `
  ).join('');

  const platEl = document.getElementById('prefPlatforms');
  platEl.innerHTML = PLATFORMS.map(
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
    setActiveSection('parati');
    showToast(`Catálogo adaptado: ${preset.label}`);
  }

  saveState();
  renderPersonalizeRibbon();
  updateHeroSpotlight();
  renderCatalog();
}

/* ==========================================================================
   Autenticación: Google, Facebook, Discord, Correo y Teléfono (SMS)
   ========================================================================== */
function openAuthModal() {
  document.getElementById('authMainView').hidden = false;
  document.getElementById('authSocialView').hidden = true;
  document.getElementById('phoneStep1').hidden = false;
  document.getElementById('phoneStep2').hidden = true;
  openModal('authModal');
}

function signInUser({ name, identifier, provider }) {
  state.user = {
    name: name.trim(),
    identifier: identifier.trim(),
    provider,
    initials: getInitials(name)
  };
  saveState();
  updateHeaderUI();
  renderPersonalizeRibbon();
  prefillContactIfLoggedIn();
  closeModal('authModal');
  showToast(`Sesión iniciada con ${provider}. ¡Bienvenido, ${state.user.name.split(' ')[0]}!`);
}

function signOutUser() {
  state.user = null;
  saveState();
  updateHeaderUI();
  renderPersonalizeRibbon();
  closeDrawer('accountDrawer');
  showToast('Has cerrado sesión correctamente.');
}

function startSocialAuth(providerKey) {
  const cfg = DEMO_SOCIAL_ACCOUNTS[providerKey];
  if (!cfg) return;
  pendingSocialProvider = cfg;

  document.getElementById('authMainView').hidden = true;
  document.getElementById('authSocialView').hidden = false;
  document.getElementById('socialProviderPill').textContent = cfg.provider;
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
    ? '¿Ya tienes cuenta en Krono?'
    : '¿No tienes cuenta todavía?';
  document.getElementById('btnToggleAuthMode').textContent = isRegister
    ? 'Iniciar sesión'
    : 'Crear cuenta';
}

/* ==========================================================================
   Carrito, Lista de Deseos y Checkout Digital
   ========================================================================== */
function toggleWishlist(gameId) {
  const game = GAMES.find((g) => g.id === gameId);
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
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) return;

  const existing = state.cart.find((c) => c.id === gameId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ id: gameId, qty: 1 });
  }

  saveState();
  updateHeaderUI();
  renderCatalog();
  showToast(`${game.title} añadido al carrito.`);
}

function updateCartQty(gameId, delta) {
  const item = state.cart.find((c) => c.id === gameId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((c) => c.id !== gameId);
  }
  saveState();
  updateHeaderUI();
  renderCatalog();
  renderCartDrawer();
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
        <p style="font-size: 13.5px; color: var(--ink-secondary); margin: 0 0 20px">
          Explora lanzamientos, modernos o clásicos y añade tus favoritos para obtener claves digitales al instante.
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="btnCartExplore">
          Ir al catálogo
        </button>
      </div>
    `;
    footer.innerHTML = '';
    document.getElementById('btnCartExplore')?.addEventListener('click', () => {
      closeDrawer('cartDrawer');
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
    });
    return;
  }

  let subtotalUSD = 0;
  body.innerHTML = state.cart
    .map((entry) => {
      const game = GAMES.find((g) => g.id === entry.id);
      if (!game) return '';
      subtotalUSD += game.priceUSD * entry.qty;
      return `
        <div class="cart-item">
          <img src="${game.cover}" alt="${escapeHtml(game.title)}" />
          <div>
            <h4>${escapeHtml(game.title)}</h4>
            <div class="cart-item-meta">${escapeHtml(game.edition)}</div>
            <div class="qty-control">
              <button type="button" data-cart-qty="${game.id}" data-delta="-1" aria-label="Disminuir cantidad">−</button>
              <span>${entry.qty}</span>
              <button type="button" data-cart-qty="${game.id}" data-delta="1" aria-label="Aumentar cantidad">+</button>
            </div>
          </div>
          <div style="text-align: right">
            <div class="price-current">${formatPrice(game.priceUSD * entry.qty)}</div>
            <button type="button" class="link-btn" style="font-size: 12px; margin-top: 6px" data-cart-qty="${game.id}" data-delta="-999">
              Quitar
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  const promo = state.promoCode ? PROMO_CODES[state.promoCode] : null;
  const discountUSD = promo ? subtotalUSD * (promo.percent / 100) : 0;
  const totalUSD = Math.max(0, subtotalUSD - discountUSD);

  footer.innerHTML = `
    <div class="promo-row">
      <input
        type="text"
        id="promoInput"
        class="input"
        placeholder="Cupón (ej. SENA2026 o KRONO15)"
        value="${state.promoCode || ''}"
        style="height: 38px; text-transform: uppercase"
      />
      <button type="button" id="btnApplyPromo" class="btn btn-secondary btn-sm" style="height: 38px">
        Aplicar
      </button>
    </div>

    <div class="summary-row">
      <span>Subtotal</span>
      <span>${formatPrice(subtotalUSD)}</span>
    </div>
    ${
      promo
        ? `<div class="summary-row" style="color: var(--success)">
            <span>Cupón ${state.promoCode} (-${promo.percent}%)</span>
            <span>−${formatPrice(discountUSD)}</span>
          </div>`
        : ''
    }
    <div class="summary-row total">
      <span>Total a pagar</span>
      <span>${formatPrice(totalUSD)}</span>
    </div>

    <button type="button" id="btnCheckout" class="btn btn-primary btn-full" style="margin-top: 12px">
      Finalizar compra digital
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
      showToast('Cupón no válido. Prueba con SENA2026 o KRONO15.');
    }
  });

  document.getElementById('btnCheckout').addEventListener('click', completePurchase);
}

function completePurchase() {
  const newKeys = [];
  const today = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  state.cart.forEach((entry) => {
    const game = GAMES.find((g) => g.id === entry.id);
    if (!game) return;
    for (let i = 0; i < entry.qty; i++) {
      const record = {
        gameId: game.id,
        title: game.title,
        edition: game.edition,
        key: generateKey(game.id),
        date: today
      };
      state.library.unshift(record);
      newKeys.push(record);
    }
  });

  state.cart = [];
  state.promoCode = null;
  saveState();
  updateHeaderUI();
  renderCatalog();

  const body = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');

  body.innerHTML = `
    <div style="padding: 8px 0">
      <span class="provider-pill" style="color: var(--success); border-color: var(--success); margin-bottom: 12px">
        ✓ Compra simulada confirmada
      </span>
      <h3 style="margin: 0 0 6px; font-size: 18px">Tus claves digitales están listas</h3>
      <p style="margin: 0 0 18px; font-size: 13.5px; color: var(--ink-secondary)">
        ${
          state.user
            ? `Guardadas en la biblioteca de <strong>${escapeHtml(state.user.name)}</strong> (${escapeHtml(state.user.identifier)}).`
            : 'Se han guardado en tu biblioteca local. Inicia sesión cuando quieras para mantener tu perfil.'
        }
      </p>

      ${newKeys
        .map(
          (item) => `
        <div class="digital-key-card">
          <div style="font-weight: 700; font-size: 14px">${escapeHtml(item.title)}</div>
          <div style="font-size: 12px; color: var(--ink-muted)">${escapeHtml(item.edition)} · ${item.date}</div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap">
            <code class="key-code">${item.key}</code>
            <button type="button" class="link-btn" data-copy-key="${item.key}">Copiar clave</button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>
  `;

  footer.innerHTML = `
    <button type="button" class="btn btn-primary btn-full" data-close-drawer="cartDrawer">
      Seguir explorando
    </button>
  `;

  showToast('¡Compra completada! Claves digitales generadas al instante.');
}

/* ==========================================================================
   Drawer de Cuenta / Lista de Deseos / Biblioteca
   ========================================================================== */
function openAccountDrawer(focusSection = 'profile') {
  const body = document.getElementById('accountBody');
  const footer = document.getElementById('accountFooter');
  const titleEl = document.getElementById('accountDrawerTitle');

  titleEl.textContent = focusSection === 'wishlist' ? 'Lista de deseos' : 'Tu espacio en Krono';

  const userCard = state.user
    ? `
      <div class="digital-key-card" style="display: flex; align-items: center; gap: 12px; margin-bottom: 18px">
        <span class="avatar-circle" style="width: 40px; height: 40px; font-size: 14px">${escapeHtml(state.user.initials)}</span>
        <div style="min-width: 0">
          <div style="font-weight: 700; font-size: 15px">${escapeHtml(state.user.name)}</div>
          <div style="font-size: 12.5px; color: var(--ink-secondary); overflow: hidden; text-overflow: ellipsis">${escapeHtml(state.user.identifier)}</div>
          <span class="provider-pill" style="margin-top: 6px">Acceso vía ${escapeHtml(state.user.provider)}</span>
        </div>
      </div>
    `
    : `
      <div class="digital-key-card" style="margin-bottom: 18px">
        <div style="font-weight: 700; margin-bottom: 4px">Navegando como invitado</div>
        <p style="margin: 0 0 12px; font-size: 13px; color: var(--ink-secondary)">
          Inicia sesión con Google, Facebook, Discord, correo o teléfono para identificar tu perfil.
        </p>
        <button type="button" id="btnAccountSignIn" class="btn btn-primary btn-sm btn-full">
          Iniciar sesión o registrarme
        </button>
      </div>
    `;

  const wishlistGames = state.wishlist
    .map((id) => GAMES.find((g) => g.id === id))
    .filter(Boolean);

  const wishlistHtml =
    wishlistGames.length > 0
      ? wishlistGames
          .map(
            (g) => `
          <div class="cart-item">
            <img src="${g.cover}" alt="${escapeHtml(g.title)}" />
            <div>
              <h4>${escapeHtml(g.title)}</h4>
              <div class="cart-item-meta">${g.year} · ${formatPrice(g.priceUSD)}</div>
              <div style="display: flex; gap: 10px">
                <button type="button" class="link-btn" data-add-cart="${g.id}">Al carrito</button>
                <button type="button" class="link-btn" style="color: var(--ink-muted)" data-remove-wish="${g.id}">Quitar</button>
              </div>
            </div>
          </div>
        `
          )
          .join('')
      : `<p style="font-size: 13px; color: var(--ink-muted)">Aún no has guardado juegos en favoritos.</p>`;

  const libraryHtml =
    state.library.length > 0
      ? state.library
          .map(
            (item) => `
          <div class="digital-key-card">
            <div style="font-weight: 700; font-size: 13.5px">${escapeHtml(item.title)}</div>
            <div style="font-size: 11.5px; color: var(--ink-muted)">${item.date} · ${escapeHtml(item.edition)}</div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap">
              <code class="key-code">${item.key}</code>
              <button type="button" class="link-btn" data-copy-key="${item.key}">Copiar</button>
            </div>
          </div>
        `
          )
          .join('')
      : `<p style="font-size: 13px; color: var(--ink-muted)">Tus claves digitales compradas aparecerán aquí.</p>`;

  body.innerHTML = `
    ${userCard}
    <div style="display: flex; align-items: center; justify-content: space-between; margin: 18px 0 8px">
      <h3 style="margin: 0; font-size: 15px">Lista de deseos (${wishlistGames.length})</h3>
    </div>
    ${wishlistHtml}

    <div style="display: flex; align-items: center; justify-content: space-between; margin: 24px 0 10px">
      <h3 style="margin: 0; font-size: 15px">Mi biblioteca digital (${state.library.length})</h3>
    </div>
    ${libraryHtml}
  `;

  footer.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px">
      <button type="button" id="btnDrawerEditPrefs" class="btn btn-secondary btn-full btn-sm">
        Editar mis gustos y recomendaciones
      </button>
      ${
        state.user
          ? `<button type="button" id="btnSignOut" class="btn btn-ghost btn-full btn-sm" style="color: var(--accent)">Cerrar sesión</button>`
          : ''
      }
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

/* ==========================================================================
   Filtros y navegación de secciones
   ========================================================================== */
function setActiveSection(section) {
  filterState.section = section;
  document.querySelectorAll('.tab-btn[data-section]').forEach((btn) => {
    const active = btn.dataset.section === section;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  renderCatalog();
}

function resetFilters() {
  filterState = {
    section: 'todos',
    search: '',
    platform: 'all',
    genre: 'all',
    sort: 'recommended'
  };
  document.getElementById('searchInput').value = '';
  document.getElementById('platformFilter').value = 'all';
  document.getElementById('genreFilter').value = 'all';
  document.getElementById('sortSelect').value = 'recommended';
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
   Eventos y arranque
   ========================================================================== */
function bindEvents() {
  // Tema claro / oscuro
  document.getElementById('btnThemeToggle').addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    saveState();
    applyTheme();
  });

  // Cambio de moneda COP / USD
  document.querySelectorAll('[data-currency]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.currency = btn.dataset.currency;
      saveState();
      syncCurrencyButtons();
      updateHeroSpotlight();
      renderCatalog();
      if (document.getElementById('cartDrawer').classList.contains('open')) {
        renderCartDrawer();
      }
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

  // Navegación desktop directa a secciones
  document.querySelectorAll('[data-nav-section]').forEach((link) => {
    link.addEventListener('click', () => {
      setActiveSection(link.dataset.navSection);
    });
  });

  document.querySelectorAll('[data-jump-section]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setActiveSection(btn.dataset.jumpSection);
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Botones header cuenta / carrito / favoritos
  document.getElementById('btnAccount').addEventListener('click', () => {
    if (state.user) openAccountDrawer('profile');
    else openAuthModal();
  });
  document.getElementById('btnOpenWishlist').addEventListener('click', () => openAccountDrawer('wishlist'));
  document.getElementById('btnOpenCart').addEventListener('click', openCart);

  // Hero spotlight y personalización
  document.getElementById('btnSpotlightDetail').addEventListener('click', (e) => {
    openGameDetail(e.currentTarget.dataset.gameId || GAMES[0].id, false);
  });
  document.getElementById('btnHeroPersonalize').addEventListener('click', openPrefsModal);
  document.getElementById('btnOpenPrefs').addEventListener('click', openPrefsModal);
  document.getElementById('btnFooterPrefs').addEventListener('click', openPrefsModal);

  // Presets rápidos de gustos
  document.getElementById('presetChips').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-preset]');
    if (btn) applyTastePreset(btn.dataset.preset);
  });

  // Pestañas de sección del catálogo
  document.querySelectorAll('.tab-btn[data-section]').forEach((btn) => {
    btn.addEventListener('click', () => setActiveSection(btn.dataset.section));
  });

  // Búsqueda, plataforma, género, orden
  document.getElementById('searchInput').addEventListener('input', (e) => {
    filterState.search = e.target.value;
    renderCatalog();
  });
  document.getElementById('platformFilter').addEventListener('change', (e) => {
    filterState.platform = e.target.value;
    renderCatalog();
  });
  document.getElementById('genreFilter').addEventListener('change', (e) => {
    filterState.genre = e.target.value;
    renderCatalog();
  });
  document.getElementById('sortSelect').addEventListener('change', (e) => {
    filterState.sort = e.target.value;
    renderCatalog();
  });
  document.getElementById('btnResetFilters').addEventListener('click', resetFilters);

  // Delegación global de clicks en catálogo, tráilers y drawers
  document.addEventListener('click', (e) => {
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
      openGameDetail(detailBtn.dataset.openDetail, false);
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
      showToast(`Clave copiada: ${copyBtn.dataset.copyKey}`);
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

    if (e.target.classList.contains('modal-backdrop')) {
      closeModal(e.target.id);
    }

    if (e.target.classList.contains('drawer-backdrop')) {
      closeDrawer(e.target.id);
    }
  });

  // Modal de personalización (chips)
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
    updateHeroSpotlight();
    setActiveSection(hasCustomPrefs() ? 'parati' : 'todos');
    closeModal('prefsModal');
    showToast('Preferencias aplicadas a tu catálogo.');
    document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('btnClearPrefs').addEventListener('click', () => {
    draftPrefs = clonePrefs(defaultState.prefs);
    renderPrefsModalOptions();
  });

  // Modal de autenticación: Proveedores sociales
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
    signInUser({
      name,
      identifier: handle,
      provider: pendingSocialProvider.provider
    });
  });

  // Tabs Correo / Teléfono
  document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
    btn.addEventListener('click', () => switchAuthTab(btn.dataset.authTab));
  });

  document.getElementById('btnToggleAuthMode').addEventListener('click', toggleEmailAuthMode);

  // Envío formulario Correo
  document.getElementById('emailAuthForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const fullName = document.getElementById('authFullName').value.trim();

    if (!email || !email.includes('@')) {
      showToast('Ingresa un correo electrónico válido.');
      return;
    }
    if (password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const derivedName =
      authMode === 'register' && fullName
        ? fullName
        : email
            .split('@')[0]
            .replace(/[._-]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());

    signInUser({
      name: derivedName,
      identifier: email,
      provider: 'Correo electrónico'
    });
    e.target.reset();
  });

  // Flujo Teléfono + Código SMS OTP
  const otpInputs = Array.from({ length: 6 }, (_, i) => document.getElementById(`otpInput${i}`));

  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/\D/g, '');
      e.target.value = clean.slice(0, 1);
      if (clean && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
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

  document.getElementById('btnSendOtp').addEventListener('click', () => {
    const code = document.getElementById('authPhoneCode').value;
    const number = document.getElementById('authPhoneNumber').value.replace(/[^\d\s-]/g, '').trim();
    const digits = number.replace(/\D/g, '');
    if (digits.length < 7) {
      showToast('Ingresa un número de teléfono válido (mínimo 7 dígitos).');
      return;
    }

    pendingPhoneFormatted = `${code} ${number}`;
    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById('phoneStep1').hidden = true;
    document.getElementById('phoneStep2').hidden = false;
    document.getElementById('phoneOtpHint').textContent = `Enviado a ${pendingPhoneFormatted}. Código de prueba SMS: ${generatedOtp}`;
    otpInputs.forEach((box) => {
      box.value = '';
    });
    otpInputs[0].focus();
    showToast(`SMS de verificación (${pendingPhoneFormatted}): tu código es ${generatedOtp}`);
  });

  document.getElementById('btnBackPhone').addEventListener('click', () => {
    document.getElementById('phoneStep2').hidden = true;
    document.getElementById('phoneStep1').hidden = false;
  });

  document.getElementById('phoneAuthForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = otpInputs.map((i) => i.value).join('');
    if (entered.length < 6) {
      showToast('Completa los 6 dígitos del código SMS.');
      return;
    }
    if (entered !== generatedOtp) {
      showToast(`Código incorrecto. Usa el código enviado: ${generatedOtp}`);
      return;
    }

    signInUser({
      name: `Jugador ${pendingPhoneFormatted.slice(-4)}`,
      identifier: pendingPhoneFormatted,
      provider: 'Teléfono (SMS)'
    });
    e.target.reset();
    document.getElementById('phoneStep2').hidden = true;
    document.getElementById('phoneStep1').hidden = false;
  });

  // Formulario de contacto funcional
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
      feedback.textContent =
        'Por favor completa tu nombre, un correo electrónico válido y un mensaje de al menos 10 caracteres.';
      return;
    }

    if (!consent) {
      feedback.classList.add('error');
      feedback.textContent = 'Debes aceptar la autorización de contacto para enviar el formulario.';
      return;
    }

    const ticket = `KRN-${Math.floor(1000 + Math.random() * 9000)}`;
    feedback.classList.add('success');
    feedback.innerHTML = `
      <strong>¡Mensaje recibido con éxito! (Radicado #${ticket})</strong><br />
      Gracias, ${escapeHtml(name)}. Registramos tu solicitud sobre <em>${escapeHtml(topic)}</em> y
      responderemos a <strong>${escapeHtml(email)}</strong> en menos de 24 horas hábiles.
    `;
    e.target.reset();
    prefillContactIfLoggedIn();
    showToast(`Solicitud enviada (#${ticket}).`);
  });

  // Atajos de teclado (Escape y "/")
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal('authModal');
      closeModal('prefsModal');
      closeModal('gameModal');
      closeDrawer('cartDrawer');
      closeDrawer('accountDrawer');
      closeMobileMenu();
    } else if (
      e.key === '/' &&
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA' &&
      document.activeElement?.tagName !== 'SELECT'
    ) {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    }
  });
}

function init() {
  applyTheme();
  syncCurrencyButtons();
  updateHeaderUI();
  updateTabCounts();
  renderPersonalizeRibbon();
  updateHeroSpotlight();
  renderCatalog();
  renderTrailers();
  prefillContactIfLoggedIn();
  bindEvents();
}

init();
