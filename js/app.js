import {
  CASE_THEMES,
  DEMO_SOCIAL_ACCOUNTS,
  ERAS,
  GAMES,
  GENRES,
  NEWS_ITEMS,
  PLATFORMS,
  PROMO_CODES,
  TASTE_PRESETS,
  USD_TO_COP
} from './data.js';
import {
  renderAuroraCase,
  setAuroraCaseState,
  toggleAuroraDisc
} from './components/aurora-case.js';
import { KRONO_CONFIG } from './config.js';

const STORAGE_KEY = 'krono_store_state_v2';

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

let newsCategory = 'all';
let coverflowIndex = 0;
let coverflowCaseState = 'back'; // 'back' | 'front' | 'open'
let coverflowDiscOut = false;

let authMode = 'login';
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

function scoreGameForUser(game) {
  let points = game.score * 0.45;
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

  if (state.wishlist.includes(game.id)) points += 8;
  if (state.recentlyViewed.includes(game.id)) points += 4;

  const affinity = Math.min(99, Math.max(72, Math.round(points)));
  const reasonText =
    reasons.length > 0
      ? `Ideal para ti · ${reasons.slice(0, 2).join(' + ')}`
      : game.featured
        ? 'Destacado en Aurora Krono'
        : '';

  return { affinity, reasonText, matched: reasons.length > 0 };
}

/* ==========================================================================
   Vitrina Aurora 3D CoverFlow (Reposo contraportada -> Hover portada -> Clic abrir + disco)
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
  track.innerHTML = GAMES.map((game, index) => {
    const offset = getCoverflowOffset(index, coverflowIndex, GAMES.length);
    const isActive = index === coverflowIndex;
    return `
      <div class="cf-slot" data-cf-index="${index}" data-offset="${offset}">
        ${renderAuroraCase(game, {
          idAttr: isActive ? 'auroraActiveCase' : '',
          initialState: isActive ? coverflowCaseState : 'back',
          discExtracted: isActive && coverflowDiscOut,
          lazy: Math.abs(Number(offset) || 0) > 1
        })}
      </div>
    `;
  }).join('');

  updateAuroraHud();
}

function updateAuroraPositions() {
  const slots = document.querySelectorAll('#coverflowTrack .cf-slot');
  slots.forEach((slot) => {
    const idx = Number(slot.dataset.cfIndex);
    const offset = getCoverflowOffset(idx, coverflowIndex, GAMES.length);
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
      setAuroraCaseState(caseEl, 'back');
    }
  });
  updateAuroraHud();
}

function updateAuroraHud() {
  const game = GAMES[coverflowIndex];
  const theme = CASE_THEMES[game.caseTheme] || CASE_THEMES.xbox;
  const bgImg = document.getElementById('auroraBgImg');
  bgImg.src = game.heroBg;
  bgImg.onerror = () => {
    bgImg.onerror = null;
    bgImg.src = game.fallbackCover;
  };

  document.getElementById('hudKicker').innerHTML = `
    <span>${escapeHtml(theme.short)}</span>
    <span>·</span>
    <span>${ERAS[game.era].label} (${game.year})</span>
    <span>·</span>
    <span>Nota ${game.score}/100</span>
    <span>·</span>
    <span>${coverflowIndex + 1} / ${GAMES.length}</span>
  `;
  document.getElementById('hudTitle').textContent = game.title;
  document.getElementById('hudSub').textContent = `${game.studio} · ${game.genres.join(', ')} · ${formatPrice(game.priceUSD)}${game.discount ? ` (-${game.discount}%)` : ''}`;

  const flipBtn = document.getElementById('btnHudFlip');
  const openBtn = document.getElementById('btnHudOpen');
  const discBtn = document.getElementById('btnHudDisc');

  flipBtn.textContent = coverflowCaseState === 'front' ? '↺ Contraportada' : '↺ Ver portada';
  openBtn.textContent = coverflowCaseState === 'open' ? 'Cerrar caja' : 'Abrir caja 3D';
  discBtn.textContent = coverflowDiscOut ? '◉ Insertar disco' : '◉ Extraer disco';

  const inCart = state.cart.some((c) => c.id === game.id);
  const cartBtn = document.getElementById('btnHudCart');
  cartBtn.textContent = inCart ? 'En carrito ✓' : `Añadir · ${formatPrice(game.priceUSD)}`;
}

function stepCoverflow(delta) {
  coverflowIndex = (coverflowIndex + delta + GAMES.length) % GAMES.length;
  coverflowCaseState = 'back';
  coverflowDiscOut = false;
  updateAuroraPositions();
}

/* ==========================================================================
   Renderizado de Header, Personalización, Catálogo, Noticias y Tráilers
   ========================================================================== */
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const sun = document.getElementById('iconSun');
  const moon = document.getElementById('iconMoon');
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (state.theme === 'dark') {
    sun.hidden = false;
    moon.hidden = true;
    metaTheme?.setAttribute('content', '#0A0D12');
  } else {
    sun.hidden = true;
    moon.hidden = false;
    metaTheme?.setAttribute('content', '#F4F5F7');
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
    if (state.prefs.budget === 'ofertas') parts.push('Prioridad: Ofertas');
    summary.textContent = parts.join(' · ');
  } else {
    summary.textContent =
      'Elige un perfil rápido o configura tus épocas, géneros y consolas favoritas para reordenar el catálogo a tu medida.';
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
    items.length === 1 ? 'Mostrando 1 videojuego' : `Mostrando ${items.length} videojuegos`;

  if (items.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No encontramos juegos con esos filtros</h3>
        <p style="color: var(--ink-secondary); margin: 0 0 18px">Prueba cambiando la plataforma, el género o limpiando tu búsqueda.</p>
        <button type="button" class="btn btn-primary btn-sm" id="btnEmptyReset">Ver todo el catálogo</button>
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

      return `
        <article class="game-card" data-game-card="${game.id}">
          <div class="card-case-box">
            <div class="cover-top-actions">
              <div style="display: flex; gap: 5px; align-items: center">
                ${game.discount > 0 ? `<span class="discount-tag">-${game.discount}%</span>` : ''}
                ${showAffinity ? `<span class="affinity-tag">${affinity}%</span>` : ''}
              </div>
              <button
                type="button"
                class="wishlist-btn ${isWishlisted ? 'saved' : ''}"
                data-toggle-wishlist="${game.id}"
                aria-label="${isWishlisted ? 'Quitar de favoritos' : 'Guardar en favoritos'}"
                aria-pressed="${isWishlisted}"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            </div>

            <div data-card-case-trigger="${game.id}">
              ${renderAuroraCase(game, { initialState: 'back', compact: true, lazy: true })}
            </div>

            <div class="card-case-controls">
              <button type="button" class="mini-pill-btn" data-flip-card="${game.id}" title="Alternar entre contraportada y portada frontal">
                ↺ Portada
              </button>
              <button type="button" class="mini-pill-btn" data-open-case-card="${game.id}" title="Abrir caja 3D y ver el disco interior">
                ◉ Abrir caja
              </button>
            </div>
          </div>

          <div class="game-body">
            <div class="game-meta-top">
              <span>${escapeHtml(game.studio)} · ${game.year}</span>
              <span class="game-score" title="Calificación">${game.score}</span>
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
                  aria-label="Abrir ficha completa de ${escapeHtml(game.title)}"
                >
                  <span class="btn-detail-label">Ficha</span>
                  <span aria-hidden="true">→</span>
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

function renderNews() {
  const grid = document.getElementById('newsGrid');
  const filtered =
    newsCategory === 'all'
      ? NEWS_ITEMS
      : NEWS_ITEMS.filter((item) => item.category === newsCategory);

  grid.innerHTML = filtered
    .map(
      (item) => `
      <article class="news-card" data-open-news="${item.id}" tabindex="0" role="button">
        <div class="news-thumb">
          <img src="${item.image}" alt="${escapeHtml(item.title)}" loading="lazy" />
          <span class="news-cat">${escapeHtml(item.category)}</span>
        </div>
        <div class="news-body">
          <div class="news-meta">${escapeHtml(item.date)} · Lectura ${escapeHtml(item.readTime)}</div>
          <h3 class="news-title">${escapeHtml(item.title)}</h3>
          <p class="news-excerpt">${escapeHtml(item.excerpt)}</p>
          <span class="news-read-more">Leer noticia completa →</span>
        </div>
      </article>
    `
    )
    .join('');
}

function openNewsModal(newsId) {
  const item = NEWS_ITEMS.find((n) => n.id === newsId);
  if (!item) return;

  const related = GAMES.find((g) => g.id === item.relatedGameId);
  document.getElementById('newsModalMeta').textContent = `${item.category} · ${item.date} · Lectura ${item.readTime}`;
  document.getElementById('newsModalTitle').textContent = item.title;

  document.getElementById('newsModalContent').innerHTML = `
    <img
      src="${item.image}"
      alt="${escapeHtml(item.title)}"
      style="width: 100%; border-radius: var(--radius-md); margin-bottom: 18px; border: 1px solid var(--border)"
    />
    ${item.body
      .map(
        (p) =>
          `<p style="margin: 0 0 14px; font-size: 14.5px; line-height: 1.65; color: var(--ink-secondary)">${escapeHtml(p)}</p>`
      )
      .join('')}
    ${
      related
        ? `
      <div class="digital-key-card" style="display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-top: 18px">
        <div>
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--accent); text-transform: uppercase">Juego relacionado</div>
          <div style="font-weight: 700; font-size: 15px">${escapeHtml(related.title)} (${related.year})</div>
          <div style="font-size: 12.5px; color: var(--ink-secondary)">${formatPrice(related.priceUSD)} · Nota ${related.score}/100</div>
        </div>
        <button type="button" class="btn btn-primary btn-sm" id="btnNewsOpenGame">
          Ver caja 3D y disco →
        </button>
      </div>
    `
        : ''
    }
  `;

  if (related) {
    document.getElementById('btnNewsOpenGame').addEventListener('click', () => {
      closeModal('newsModal');
      openGameDetail(related.id, { mode: 'front' });
    });
  }

  openModal('newsModal');
}

function renderTrailers() {
  const featuredIds = ['expedition-33', 'elden-ring', 'halo-mcc'];
  const container = document.getElementById('trailersGrid');

  container.innerHTML = featuredIds
    .map((id) => {
      const game = GAMES.find((g) => g.id === id);
      if (!game) return '';
      return `
        <article class="trailer-card">
          <div class="trailer-player" data-trailer-embed="${game.youtubeId}" data-trailer-title="${escapeHtml(game.title)}">
            <img src="${game.headerImg}" alt="Vista previa del tráiler de ${escapeHtml(game.title)}" loading="lazy" onerror="this.onerror=null;this.src='${game.fallbackCover}'" />
            <button type="button" class="play-overlay" aria-label="Reproducir tráiler oficial de ${escapeHtml(game.title)}">
              <span class="play-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"></polygon></svg>
              </span>
              <span style="font-size: 12.5px; font-weight: 700">Reproducir tráiler oficial</span>
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
   Modales y Drawers
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
   Inspector Completo de Caja Física 3D (Portada, Contraportada, Disco, Tráiler)
   ========================================================================== */
function openGameDetail(gameId, { mode = 'front' } = {}) {
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) return;

  if (!state.recentlyViewed.includes(gameId)) {
    state.recentlyViewed.unshift(gameId);
    state.recentlyViewed = state.recentlyViewed.slice(0, 6);
    saveState();
  }

  const theme = CASE_THEMES[game.caseTheme] || CASE_THEMES.xbox;
  const { affinity, reasonText } = scoreGameForUser(game);
  const isWishlisted = state.wishlist.includes(game.id);
  const inCart = state.cart.some((c) => c.id === game.id);

  document.getElementById('detailKicker').textContent = `${theme.label} · ${ERAS[game.era].label} (${game.year}) · ${game.studio}`;
  document.getElementById('detailTitle').textContent = game.title;

  const initialCaseState = mode === 'disc' || mode === 'open' ? 'open' : mode === 'front' ? 'front' : 'back';
  const initialDiscOut = mode === 'disc';

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
          <button type="button" class="btn btn-sm ${initialCaseState === 'back' ? 'btn-primary' : 'btn-secondary'}" data-insp-mode="back">
            Contraportada
          </button>
          <button type="button" class="btn btn-sm ${initialCaseState === 'front' ? 'btn-primary' : 'btn-secondary'}" data-insp-mode="front">
            Portada
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

        <p style="margin: 0; font-family: var(--font-mono); font-size: 11px; color: var(--ink-muted); text-align: center">
          ${escapeHtml(theme.discFormat)} · ${escapeHtml(game.serial)}
        </p>
      </div>

      <div>
        <div class="detail-specs-row">
          <span class="meta-tag" style="color: var(--accent)">Nota ${game.score}/100</span>
          <span class="meta-tag">${escapeHtml(game.esrb)} · ${escapeHtml(game.esrbText)}</span>
          <span class="meta-tag">Duración: ${game.playtime}</span>
          <span class="meta-tag">${escapeHtml(game.players)}</span>
          ${hasCustomPrefs() ? `<span class="meta-tag" style="color: var(--accent)">${affinity}% afinidad</span>` : ''}
        </div>

        <p style="margin: 0 0 10px; color: var(--ink-secondary)">${escapeHtml(game.synopsis)}</p>

        <div class="editorial-note">
          <strong>Por qué vale la pena</strong>
          ${escapeHtml(game.whyWorthIt)}
        </div>

        ${reasonText && hasCustomPrefs() ? `<p class="game-reason" style="margin-bottom: 10px">${escapeHtml(reasonText)}</p>` : ''}

        <p style="margin: 0 0 5px; font-size: 13px; color: var(--ink-secondary)">
          <strong>Edición:</strong> ${escapeHtml(game.edition)} · <strong>Video:</strong> ${escapeHtml(game.resolution)}
        </p>
        <p style="margin: 0 0 14px; font-size: 13px; color: var(--ink-secondary)">
          <strong>Compatibilidad:</strong> ${escapeHtml(game.specs)}
        </p>

        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px">
          ${game.tags.map((t) => `<span class="meta-tag">${escapeHtml(t)}</span>`).join('')}
        </div>

        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; padding-top: 14px; border-top: 1px solid var(--border)">
          <div class="price-block">
            <span class="price-current" style="font-size: 20px">${formatPrice(game.priceUSD)}</span>
            ${game.originalPriceUSD ? `<span class="price-old">${formatPrice(game.originalPriceUSD)} (-${game.discount}%)</span>` : ''}
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 8px">
            <button type="button" class="btn btn-secondary btn-sm" id="btnDetailTrailer">▶ Tráiler</button>
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

  const stage = document.getElementById('inspectorCaseStage');
  const spinBtn = document.getElementById('btnToggleDiscSpin');
  let discPaused = false;

  const syncInspectorButtons = () => {
    const isOpen = stage.classList.contains('is-open');
    const isFront = stage.classList.contains('is-front-pinned');
    const isDisc = stage.classList.contains('is-disc-extracted');
    const activeMode = isDisc ? 'disc' : isOpen ? 'open' : isFront ? 'front' : 'back';
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
    const next = stage.classList.contains('is-open') ? 'back' : 'open';
    setAuroraCaseState(stage, next);
    syncInspectorButtons();
  });

  content.querySelectorAll('[data-insp-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const m = btn.dataset.inspMode;
      if (m === 'disc') {
        toggleAuroraDisc(stage);
      } else {
        setAuroraCaseState(stage, m);
      }
      syncInspectorButtons();
    });
  });

  spinBtn.addEventListener('click', () => {
    discPaused = !discPaused;
    stage.querySelector('.tray-disc__rotor')?.classList.toggle('paused', discPaused);
    spinBtn.textContent = discPaused ? '▶ Girar disco' : '⏸ Pausar giro';
  });

  let trailerVisible = false;
  document.getElementById('btnDetailTrailer').addEventListener('click', (e) => {
    const slot = document.getElementById('detailTrailerSlot');
    trailerVisible = !trailerVisible;
    if (trailerVisible) {
      slot.hidden = false;
      slot.innerHTML = `
        <div class="detail-video-box">
          <iframe src="https://www.youtube-nocookie.com/embed/${game.youtubeId}?autoplay=1&rel=0" title="Tráiler oficial de ${escapeHtml(game.title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      `;
      e.currentTarget.textContent = 'Ocultar tráiler';
    } else {
      slot.hidden = true;
      slot.innerHTML = '';
      e.currentTarget.textContent = '▶ Tráiler';
    }
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

  document.getElementById('prefGenres').innerHTML = GENRES.map(
    (g) => `
      <button type="button" class="chip ${draftPrefs.genres.includes(g) ? 'active' : ''}" data-pref-genre="${g}">
        ${g}
      </button>
    `
  ).join('');

  document.getElementById('prefPlatforms').innerHTML = PLATFORMS.map(
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
  renderCatalog();
}

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
          Añade cualquier videojuego desde la vitrina Aurora 3D o el catálogo para generar tus claves al instante.
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

  let subtotalUSD = 0;
  body.innerHTML = state.cart
    .map((entry) => {
      const game = GAMES.find((g) => g.id === entry.id);
      if (!game) return '';
      subtotalUSD += game.priceUSD * entry.qty;
      return `
        <div class="cart-item">
          <img src="${game.cover}" alt="${escapeHtml(game.title)}" onerror="this.onerror=null;this.src='${game.fallbackCover}'" />
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
            <button type="button" class="link-btn" style="font-size: 12px; margin-top: 5px" data-cart-qty="${game.id}" data-delta="-999">Quitar</button>
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
      <input type="text" id="promoInput" class="input" placeholder="Cupón (SENA2026 o KRONO15)" value="${state.promoCode || ''}" style="height: 36px; text-transform: uppercase" />
      <button type="button" id="btnApplyPromo" class="btn btn-secondary btn-sm" style="height: 36px">Aplicar</button>
    </div>
    <div class="summary-row"><span>Subtotal</span><span>${formatPrice(subtotalUSD)}</span></div>
    ${
      promo
        ? `<div class="summary-row" style="color: var(--success)"><span>Cupón ${state.promoCode} (-${promo.percent}%)</span><span>−${formatPrice(discountUSD)}</span></div>`
        : ''
    }
    <div class="summary-row total"><span>Total a pagar</span><span>${formatPrice(totalUSD)}</span></div>
    <button type="button" id="btnCheckout" class="btn btn-primary btn-full" style="margin-top: 12px">Finalizar compra digital</button>
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
  const today = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

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
  updateAuroraHud();
  renderCatalog();

  document.getElementById('cartBody').innerHTML = `
    <div style="padding: 8px 0">
      <span class="provider-pill" style="color: var(--success); border-color: var(--success); margin-bottom: 12px">✓ Compra simulada confirmada</span>
      <h3 style="margin: 0 0 6px; font-size: 18px">Tus claves digitales están listas</h3>
      <p style="margin: 0 0 16px; font-size: 13.5px; color: var(--ink-secondary)">
        ${
          state.user
            ? `Guardadas en la biblioteca de <strong>${escapeHtml(state.user.name)}</strong>.`
            : 'Guardadas en tu biblioteca local.'
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

  document.getElementById('cartFooter').innerHTML = `
    <button type="button" class="btn btn-primary btn-full" data-close-drawer="cartDrawer">Seguir explorando</button>
  `;
  showToast('¡Compra completada! Claves digitales generadas.');
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
          Inicia sesión con Google, Facebook, Discord, correo o teléfono para sincronizar tu colección.
        </p>
        <button type="button" id="btnAccountSignIn" class="btn btn-primary btn-sm btn-full">Iniciar sesión o registrarme</button>
      </div>
    `;

  const wishlistGames = state.wishlist.map((id) => GAMES.find((g) => g.id === id)).filter(Boolean);
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
            <button type="button" class="link-btn" data-add-cart="${g.id}">Al carrito</button>
            <button type="button" class="link-btn" style="color: var(--ink-muted)" data-remove-wish="${g.id}">Quitar</button>
          </div>
        </div>
      </div>
    `
        )
        .join('')
    : `<p style="font-size: 13px; color: var(--ink-muted)">Aún no has guardado juegos en favoritos.</p>`;

  const libraryHtml = state.library.length
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
    <h3 style="margin: 16px 0 8px; font-size: 15px">Lista de deseos (${wishlistGames.length})</h3>
    ${wishlistHtml}
    <h3 style="margin: 22px 0 10px; font-size: 15px">Mi biblioteca digital (${state.library.length})</h3>
    ${libraryHtml}
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
  document.querySelectorAll('.tab-btn[data-section]').forEach((btn) => {
    const active = btn.dataset.section === section;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  renderCatalog();
}

function resetFilters() {
  filterState = { section: 'todos', search: '', platform: 'all', genre: 'all', sort: 'recommended' };
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
   Eventos globales
   ========================================================================== */
function bindEvents() {
  // Aurora CoverFlow controles + swipe móvil
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
      coverflowCaseState = 'back';
      coverflowDiscOut = false;
      updateAuroraPositions();
    } else {
      // Clic en la caja centrada abre o cierra la caja 3D con bisagra
      coverflowCaseState = coverflowCaseState === 'open' ? 'back' : 'open';
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

  // Botones del HUD Aurora
  document.getElementById('btnHudFlip').addEventListener('click', () => {
    coverflowCaseState = coverflowCaseState === 'front' ? 'back' : 'front';
    coverflowDiscOut = false;
    updateAuroraPositions();
  });

  document.getElementById('btnHudOpen').addEventListener('click', () => {
    coverflowCaseState = coverflowCaseState === 'open' ? 'back' : 'open';
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
    openGameDetail(GAMES[coverflowIndex].id, {
      mode: coverflowDiscOut ? 'disc' : coverflowCaseState
    });
  });

  document.getElementById('btnHudCart').addEventListener('click', () => {
    addToCart(GAMES[coverflowIndex].id);
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

  // Catálogo filtros
  document.querySelectorAll('.tab-btn[data-section]').forEach((btn) => {
    btn.addEventListener('click', () => setActiveSection(btn.dataset.section));
  });
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

  // Delegación global
  document.addEventListener('click', (e) => {
    // 1. Clic en disco interior de una caja del catálogo
    const cardDiscBtn = e.target.closest('#gamesGrid [data-toggle-disc]');
    if (cardDiscBtn) {
      e.stopPropagation();
      const caseEl = cardDiscBtn.closest('.aurora-case');
      toggleAuroraDisc(caseEl);
      return;
    }

    // 2. Botón táctil Portada / Reverso en tarjeta de catálogo
    const flipCardBtn = e.target.closest('[data-flip-card]');
    if (flipCardBtn) {
      e.stopPropagation();
      const card = flipCardBtn.closest('.game-card');
      const box = card?.querySelector('.card-case-box');
      const caseEl = card?.querySelector('.aurora-case');
      const openBtn = card?.querySelector('[data-open-case-card]');
      if (caseEl) {
        const next = caseEl.dataset.caseState === 'front' ? 'back' : 'front';
        setAuroraCaseState(caseEl, next);
        box?.classList.remove('has-open-case');
        flipCardBtn.textContent = next === 'front' ? '↺ Reverso' : '↺ Portada';
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
        setAuroraCaseState(caseEl, opening ? 'open' : 'back');
        box?.classList.toggle('has-open-case', opening);
        openCaseCardBtn.textContent = opening ? '✕ Cerrar' : '◉ Abrir caja';
        if (flipBtn) flipBtn.textContent = '↺ Portada';
      }
      return;
    }

    // 4. Clic directo sobre la caja 3D en el catálogo: abre/cierra la caja con bisagra
    const cardCaseTrigger = e.target.closest('[data-card-case-trigger]');
    if (cardCaseTrigger) {
      const card = cardCaseTrigger.closest('.game-card');
      const box = card?.querySelector('.card-case-box');
      const caseEl = cardCaseTrigger.querySelector('.aurora-case');
      const openBtn = card?.querySelector('[data-open-case-card]');
      const flipBtn = card?.querySelector('[data-flip-card]');
      if (caseEl) {
        const opening = !caseEl.classList.contains('is-open');
        setAuroraCaseState(caseEl, opening ? 'open' : 'back');
        box?.classList.toggle('has-open-case', opening);
        if (openBtn) openBtn.textContent = opening ? '✕ Cerrar' : '◉ Abrir caja';
        if (flipBtn) flipBtn.textContent = '↺ Portada';
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
      openGameDetail(detailBtn.dataset.openDetail, { mode: 'back' });
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

  document.getElementById('emailAuthForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const fullName = document.getElementById('authFullName').value.trim();
    if (!email || !email.includes('@')) return showToast('Ingresa un correo electrónico válido.');
    if (password.length < 6) return showToast('La contraseña debe tener al menos 6 caracteres.');
    const derivedName =
      authMode === 'register' && fullName
        ? fullName
        : email
            .split('@')[0]
            .replace(/[._-]+/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
    signInUser({ name: derivedName, identifier: email, provider: 'Correo electrónico' });
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

  document.getElementById('btnSendOtp').addEventListener('click', () => {
    const code = document.getElementById('authPhoneCode').value;
    const number = document.getElementById('authPhoneNumber').value.replace(/[^\d\s-]/g, '').trim();
    if (number.replace(/\D/g, '').length < 7) return showToast('Ingresa un número válido (mínimo 7 dígitos).');
    pendingPhoneFormatted = `${code} ${number}`;
    generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById('phoneStep1').hidden = true;
    document.getElementById('phoneStep2').hidden = false;
    document.getElementById('phoneOtpHint').textContent = `Enviado a ${pendingPhoneFormatted}. Código de prueba SMS: ${generatedOtp}`;
    otpInputs.forEach((b) => (b.value = ''));
    otpInputs[0].focus();
    showToast(`SMS (${pendingPhoneFormatted}): código ${generatedOtp}`);
  });

  document.getElementById('btnBackPhone').addEventListener('click', () => {
    document.getElementById('phoneStep2').hidden = true;
    document.getElementById('phoneStep1').hidden = false;
  });

  document.getElementById('phoneAuthForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const entered = otpInputs.map((i) => i.value).join('');
    if (entered.length < 6) return showToast('Completa los 6 dígitos del código SMS.');
    if (entered !== generatedOtp) return showToast(`Código incorrecto. Usa: ${generatedOtp}`);
    signInUser({ name: `Jugador ${pendingPhoneFormatted.slice(-4)}`, identifier: pendingPhoneFormatted, provider: 'Teléfono (SMS)' });
    e.target.reset();
    document.getElementById('phoneStep2').hidden = true;
    document.getElementById('phoneStep1').hidden = false;
  });

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
      feedback.textContent = 'Debes aceptar la autorización de contacto.';
      return;
    }

    const ticket = `KRN-${Math.floor(1000 + Math.random() * 9000)}`;
    feedback.classList.add('success');
    feedback.innerHTML = `
      <strong>¡Mensaje recibido con éxito! (Radicado #${ticket})</strong><br />
      Gracias, ${escapeHtml(name)}. Registramos tu solicitud sobre <em>${escapeHtml(topic)}</em> y responderemos a <strong>${escapeHtml(email)}</strong>.
    `;
    e.target.reset();
    prefillContactIfLoggedIn();
    showToast(`Solicitud enviada (#${ticket}).`);
  });

  // Teclado: flechas para Aurora CoverFlow, "/" para buscar, Escape para cerrar
  document.addEventListener('keydown', (e) => {
    const inField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    const modalOpen = document.querySelector('.modal-backdrop.open, .drawer-backdrop.open');

    if (e.key === 'Escape') {
      closeModal('authModal');
      closeModal('prefsModal');
      closeModal('gameModal');
      closeModal('newsModal');
      closeDrawer('cartDrawer');
      closeDrawer('accountDrawer');
      closeMobileMenu();
    } else if (!inField && !modalOpen && e.key === '/') {
      e.preventDefault();
      document.getElementById('searchInput').focus();
    } else if (!inField && !modalOpen && e.key === 'ArrowRight') {
      stepCoverflow(1);
    } else if (!inField && !modalOpen && e.key === 'ArrowLeft') {
      stepCoverflow(-1);
    }
  });
}

function init() {
  applyTheme();
  syncCurrencyButtons();
  updateHeaderUI();
  updateTabCounts();
  renderAuroraCoverflow();
  renderPersonalizeRibbon();
  renderCatalog();
  renderNews();
  renderTrailers();
  prefillContactIfLoggedIn();
  bindEvents();
}

init();
