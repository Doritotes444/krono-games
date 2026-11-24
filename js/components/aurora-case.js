/**
 * KRONO — Componente Aurora 3D de Caja Física Interactiva (Fase 5)
 *
 * Comportamiento:
 * - Reposo: muestra la contraportada (claramente identificada cuando es reconstrucción editorial).
 * - Hover (escritorio) / Toque (móvil): gira suavemente en 3D a la portada frontal oficial.
 * - Retirar cursor: regresa suavemente a la contraportada (si la caja está cerrada).
 * - Clic sobre la caja: abre la caja 3D con bisagra lateral revelando la bandeja y el disco interior.
 * - Clic sobre el disco: anima la extracción e inserción del disco desde el eje central.
 */

import { CASE_THEMES } from '../data.js';

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renderiza una caja 3D interactiva Aurora.
 * @param {object} game - Registro del videojuego.
 * @param {object} opts - Opciones de renderizado.
 */
export function renderAuroraCase(
  game,
  {
    idAttr = '',
    initialState = 'front', // 'front' | 'back' | 'open'
    discExtracted = false,
    lazy = true,
    compact = false
  } = {}
) {
  const theme = CASE_THEMES[game.caseTheme] || CASE_THEMES.pc;
  const shots =
    game.screenshots && game.screenshots.length >= 2
      ? game.screenshots
      : [game.headerImg || game.cover, game.heroBg || game.cover];

  const backLabel = game.officialBackCoverUrl
    ? 'CONTRAPORTADA OFICIAL'
    : 'RECONSTRUCCIÓN EDITORIAL';

  const discNotice = game.officialDiscUrl
    ? `${theme.short} · DISCO OFICIAL`
    : `VISTA PREVIA KRONO · ${theme.short}`;

  const stateClasses = [
    'aurora-case',
    compact ? 'aurora-case--compact' : '',
    initialState === 'open' ? 'is-open' : '',
    initialState === 'back' ? 'is-back-pinned' : '',
    discExtracted ? 'is-disc-extracted' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return `
    <div
      class="${stateClasses}"
      ${idAttr ? `id="${idAttr}"` : ''}
      data-aurora-case="${esc(game.id)}"
      data-case-state="${esc(initialState)}"
      style="--case-header-bg: ${theme.headerBg}; --case-header-text: ${theme.headerText}; --case-accent: ${theme.accent}"
    >
      <div class="aurora-case__shadow" aria-hidden="true"></div>

      <div class="aurora-case__body">
        <!-- BANDEJA INTERIOR DERECHA (visible al abrir la tapa 3D) -->
        <div class="aurora-case__tray" aria-label="Interior de la caja y disco">
          <div class="tray-header">
            <span>${esc(theme.short)} · BANDEJA</span>
            <span>${esc(game.serial)}</span>
          </div>

          <div class="tray-well">
            <div class="tray-clips" aria-hidden="true"></div>
            <div class="tray-spindle" aria-hidden="true"></div>

            <!-- DISCO INTERACTIVO (clic para extraer / insertar) -->
            <button
              type="button"
              class="tray-disc"
              data-toggle-disc="${esc(game.id)}"
              aria-label="${discExtracted ? 'Insertar disco en la caja' : 'Extraer disco de la caja'}"
              title="${discExtracted ? 'Clic para insertar el disco' : 'Clic para extraer el disco'}"
            >
              <span class="tray-disc__rotor">
                <img
                  class="tray-disc__art"
                  src="${esc(game.officialDiscUrl || game.cover)}"
                  alt=""
                  ${lazy ? 'loading="lazy"' : ''}
                  onerror="this.onerror=null;this.src='${esc(game.fallbackCover)}'"
                />
                <span class="tray-disc__sheen" aria-hidden="true"></span>
                <span class="tray-disc__band">${esc(discNotice)}</span>
                <span class="tray-disc__hub" aria-hidden="true"></span>
              </span>
            </button>
          </div>

          <div class="tray-footer">
            <span class="tray-hint">${discExtracted ? 'Disco extraído · clic para insertar' : 'Clic en el disco para extraer'}</span>
          </div>
        </div>

        <!-- TAPA FRONTAL CON BISAGRA IZQUIERDA (incluye interior del folleto al abrirse) -->
        <div class="aurora-case__lid">
          <!-- Cara exterior de la tapa: PORTADA FRONTAL -->
          <div class="aurora-case__face aurora-case__front">
            <div class="case-banner">
              <span>${esc(theme.label)}</span>
              <span>${esc(game.year)}</span>
            </div>
            <div class="case-artwork">
              <img
                src="${esc(game.cover)}"
                alt="Portada oficial de ${esc(game.title)}"
                ${lazy ? 'loading="lazy"' : ''}
                onerror="this.onerror=null;this.src='${esc(game.fallbackCover)}'"
              />
            </div>
            <div class="case-gloss" aria-hidden="true"></div>
          </div>

          <!-- Cara interior de la tapa izquierda: FOLLETO / EDICIÓN -->
          <div class="aurora-case__face aurora-case__inside-left" aria-hidden="true">
            <div class="booklet-sheet">
              <span class="booklet-kicker">MANUAL · ${esc(game.year)}</span>
              <strong class="booklet-title">${esc(game.title)}</strong>
              <p class="booklet-studio">${esc(game.studio)}</p>
              <p class="booklet-note">${esc(game.whyWorthIt)}</p>
              <span class="booklet-serial">${esc(game.serial)}</span>
            </div>
          </div>
        </div>

        <!-- CARA TRASERA EXTERIOR: CONTRAPORTADA (estado por defecto en reposo) -->
        <div class="aurora-case__face aurora-case__back">
          <div class="case-banner">
            <span>${esc(theme.short)} · ${esc(game.year)}</span>
            <span class="back-source-badge">${esc(backLabel)}</span>
          </div>

          <div class="case-back-inner">
            <p class="back-tagline">${esc(game.backTagline)}</p>

            <div class="back-shots">
              <img
                src="${esc(shots[0])}"
                alt="Captura oficial 1 de ${esc(game.title)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='${esc(game.fallbackCover)}'"
              />
              <img
                src="${esc(shots[1])}"
                alt="Captura oficial 2 de ${esc(game.title)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='${esc(game.fallbackCover)}'"
              />
            </div>

            <p class="back-synopsis">${esc(game.synopsis)}</p>

            <div class="back-specs-grid">
              <div><span>Jugadores</span>${esc(game.players)}</div>
              <div><span>Video</span>${esc(game.resolution)}</div>
              <div><span>Espacio</span>${esc(game.storage)}</div>
              <div><span>Idiomas</span>${esc(game.languages)}</div>
            </div>

            <div class="back-footer">
              <div class="esrb-box" title="Clasificación ${esc(game.esrbText)}">
                <span>ESRB</span>
                <strong>${esc(game.esrb)}</strong>
              </div>
              <div class="barcode-box">
                <div class="barcode-stripes" aria-hidden="true"></div>
                <span class="barcode-num">${esc(game.barcode)}</span>
              </div>
            </div>
          </div>

          <div class="case-gloss" aria-hidden="true"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Cambia el estado visual de una caja Aurora existente en el DOM.
 * @param {HTMLElement} caseEl
 * @param {'back'|'front'|'open'} nextState
 */
export function setAuroraCaseState(caseEl, nextState) {
  if (!caseEl) return;
  caseEl.dataset.caseState = nextState;
  caseEl.classList.toggle('is-open', nextState === 'open');
  caseEl.classList.toggle('is-back-pinned', nextState === 'back');
  if (nextState !== 'open') {
    caseEl.classList.remove('is-disc-extracted');
    syncDiscButtonMeta(caseEl, false);
  }
}

/**
 * Alterna extracción / inserción del disco dentro de una caja abierta.
 * @param {HTMLElement} caseEl
 * @param {boolean} [force]
 * @returns {boolean} Nuevo estado de extracción.
 */
export function toggleAuroraDisc(caseEl, force) {
  if (!caseEl) return false;
  if (!caseEl.classList.contains('is-open')) {
    setAuroraCaseState(caseEl, 'open');
  }
  const extracted =
    typeof force === 'boolean' ? force : !caseEl.classList.contains('is-disc-extracted');
  caseEl.classList.toggle('is-disc-extracted', extracted);
  syncDiscButtonMeta(caseEl, extracted);
  return extracted;
}

function syncDiscButtonMeta(caseEl, extracted) {
  const btn = caseEl.querySelector('.tray-disc');
  const hint = caseEl.querySelector('.tray-hint');
  if (btn) {
    btn.setAttribute('aria-label', extracted ? 'Insertar disco en la caja' : 'Extraer disco de la caja');
    btn.setAttribute('title', extracted ? 'Clic para insertar el disco' : 'Clic para extraer el disco');
  }
  if (hint) {
    hint.textContent = extracted
      ? 'Disco extraído · clic para insertar'
      : 'Clic en el disco para extraer';
  }
}
