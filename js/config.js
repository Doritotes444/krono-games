/**
 * KRONO — Configuración central de arquitectura MVP
 * Ninguna llave secreta debe colocarse aquí. Solo endpoints públicos y flags de estado.
 */

export const KRONO_CONFIG = {
  brandName: 'KRONO',
  tagline: 'Game Store & Archive',
  siteUrl: 'https://doritotes444.github.io/krono-games/',
  currency: {
    primary: 'COP',
    secondary: 'USD',
    // Tasa referencial pública actualizable vía API verificable en Etapa 7
    fallbackUsdToCop: 4100,
    rateSource: 'Referencia de mercado (pendiente sincronización TRM en vivo)',
    rateUpdatedAt: '2026-11-24'
  },
  // Integraciones backend (se activan al configurar variables públicas en Etapa 6 y 7)
  supabase: {
    url: '', // Ej. https://<project-ref>.supabase.co
    anonKey: '', // Clave pública anon (nunca service_role)
    configured: false
  },
  payments: {
    provider: 'Wompi Colombia',
    liveCheckoutEnabled: false, // Bloqueado hasta configurar comercio legal y webhooks verificados
    publicKey: ''
  },
  catalog: {
    pageSize: 24
  }
};
