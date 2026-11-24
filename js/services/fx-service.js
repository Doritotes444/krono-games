/**
 * KRONO — Servicio de Conversión COP / USD con Fuente Verificable (Fase 10)
 * Consulta ExchangeRate-API pública (sin llaves secretas) y muestra fecha exacta de actualización.
 */
import { KRONO_CONFIG } from '../config.js';

const FX_CACHE_KEY = 'krono_fx_usd_cop_v1';
const FX_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

export async function loadVerifiedFxRate() {
  try {
    const cachedRaw = localStorage.getItem(FX_CACHE_KEY);
    if (cachedRaw) {
      const cached = JSON.parse(cachedRaw);
      if (Date.now() - cached.fetchedAt < FX_TTL_MS && cached.rate > 1000) {
        return cached;
      }
    }
  } catch {
    // ignore storage errors
  }

  try {
    const resp = await fetch('https://open.er-api.com/v6/latest/USD', { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const rate = Number(data?.rates?.COP);
    if (!rate || rate < 1000) throw new Error('Tasa COP inválida');

    const record = {
      rate: Math.round(rate * 100) / 100,
      source: 'ExchangeRate-API (open.er-api.com)',
      updatedAt: data.time_last_update_utc
        ? new Date(data.time_last_update_utc).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
          })
        : KRONO_CONFIG.currency.rateUpdatedAt,
      verifiedLive: true,
      fetchedAt: Date.now()
    };
    try {
      localStorage.setItem(FX_CACHE_KEY, JSON.stringify(record));
    } catch {
      // ignore
    }
    return record;
  } catch {
    return {
      rate: KRONO_CONFIG.currency.fallbackUsdToCop,
      source: KRONO_CONFIG.currency.rateSource,
      updatedAt: KRONO_CONFIG.currency.rateUpdatedAt,
      verifiedLive: false,
      fetchedAt: Date.now()
    };
  }
}
