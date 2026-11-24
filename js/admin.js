import { loadCatalog } from './services/catalog-service.js';
import { getSupabaseClient, isSupabaseConfigured } from './services/supabase-client.js';

let activeTab = 'catalog';
let games = [];
let news = [];
let hasWriteAccess = false;

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function initAdmin() {
  const banner = document.getElementById('adminStatusBanner');
  const roleBadge = document.getElementById('adminRoleBadge');
  const backendStat = document.getElementById('statBackend');

  const cat = await loadCatalog();
  games = cat.games;
  document.getElementById('statGames').textContent = String(games.length);

  try {
    const r = await fetch('data/news-verified.json');
    const nd = await r.json();
    news = nd.articles || [];
    document.getElementById('statNews').textContent = String(news.length);
  } catch {
    news = [];
  }

  if (!isSupabaseConfigured()) {
    roleBadge.textContent = 'Modo inspección (solo lectura)';
    backendStat.textContent = 'Sin llaves';
    banner.innerHTML = `
      <strong>Seguridad activa: escritura bloqueada hasta conectar Supabase.</strong><br />
      Este panel está diseñado con <strong>Row Level Security (RLS)</strong> y roles <code>admin</code> / <code>editor</code>
      (ver <code>supabase/schema.sql</code> y <code>.env.example</code>). Por seguridad, no se permiten cambios
      administrativos ni edición de precios desde el navegador sin autenticación real de servidor.
    `;
  } else {
    const sb = await getSupabaseClient();
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData?.session) {
      roleBadge.textContent = 'Acceso denegado (sin sesión)';
      backendStat.textContent = 'Conectado';
      banner.innerHTML = `<strong>Acceso restringido:</strong> inicia sesión con una cuenta con rol <code>admin</code> o <code>editor</code> en la tienda principal para habilitar la gestión.`;
    } else {
      const { data: profile } = await sb
        .from('profiles')
        .select('role, full_name')
        .eq('id', sessionData.session.user.id)
        .maybeSingle();

      if (profile && ['admin', 'editor'].includes(profile.role)) {
        hasWriteAccess = true;
        roleBadge.textContent = `Rol: ${profile.role.toUpperCase()} (${profile.full_name})`;
        backendStat.textContent = 'Activo (RLS)';
        banner.innerHTML = `<strong>Sesión administrativa verificada.</strong> Todas las modificaciones quedan registradas automáticamente en <code>public.audit_logs</code>.`;
      } else {
        roleBadge.textContent = 'Permisos insuficientes';
        backendStat.textContent = 'Bloqueado (RLS)';
        banner.innerHTML = `<strong>Permisos insuficientes:</strong> tu cuenta tiene rol <code>customer</code>. Solo los roles <code>admin</code> o <code>editor</code> pueden modificar el catálogo.`;
      }
    }
  }

  document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.adminTab;
      document.querySelectorAll('[data-admin-tab]').forEach((b) => {
        b.classList.toggle('active', b.dataset.adminTab === activeTab);
      });
      renderTab();
    });
  });

  renderTab();
}

function renderTab() {
  const host = document.getElementById('adminTabContent');
  if (activeTab === 'catalog') {
    const rows = games.slice(0, 30);
    host.innerHTML = `
      <p style="font-size: 13px; color: var(--ink-secondary); margin: 0 0 12px">
        Mostrando los primeros 30 de ${games.length} registros verificados. ${hasWriteAccess ? 'Edición habilitada en Supabase.' : 'Vista de solo lectura hasta configurar SUPABASE_URL y rol admin.'}
      </p>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Plataformas</th>
              <th>Formato</th>
              <th>Precio USD</th>
              <th>Disponibilidad</th>
              <th>Actualizado</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (g) => `
              <tr>
                <td><strong>${esc(g.title)}</strong><br/><span style="font-size:11px;color:var(--ink-muted)">${esc(g.developer)}</span></td>
                <td>${esc(g.platforms.slice(0, 3).join(', '))}</td>
                <td>${esc(g.format)}</td>
                <td style="font-family:var(--font-mono)">$${Number(g.priceUSD).toFixed(2)}</td>
                <td>${esc(g.availabilityStatus)}</td>
                <td style="font-family:var(--font-mono)">${esc(g.lastUpdated)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  if (activeTab === 'news') {
    host.innerHTML = `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr><th>Titular</th><th>Fuente</th><th>Tipo</th><th>Publicación</th><th>Verificación</th></tr>
          </thead>
          <tbody>
            ${news
              .map(
                (n) => `
              <tr>
                <td><a href="${esc(n.sourceUrl)}" target="_blank" rel="noopener noreferrer" class="link-btn">${esc(n.title)} ↗</a></td>
                <td>${esc(n.sourceName)}</td>
                <td>${esc(n.verificationType)}</td>
                <td style="font-family:var(--font-mono)">${esc(n.publishedAt)}</td>
                <td style="font-family:var(--font-mono)">${esc(n.verifiedAt)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
    return;
  }

  host.innerHTML = `
    <div class="card-panel">
      <h3 style="margin: 0 0 8px">Módulo conectado a Supabase (${esc(activeTab)})</h3>
      <p style="margin: 0; color: var(--ink-secondary); font-size: 13.5px">
        Esta tabla (<code>public.${activeTab === 'orders' ? 'orders' : activeTab === 'coupons' ? 'coupons' : 'audit_logs'}</code>)
        está protegida por Row Level Security (RLS) en <code>supabase/schema.sql</code>.
        Configura <code>SUPABASE_URL</code> y <code>SUPABASE_ANON_KEY</code> en <code>js/config.js</code> y despliega las Edge Functions
        para gestionar pedidos de Colombia, cupones y bitácora de auditoría en vivo.
      </p>
    </div>
  `;
}

initAdmin();
