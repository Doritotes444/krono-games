# Guía de Despliegue y Configuración Comercial — KRONO GAME STORE

## 1. Arquitectura del MVP
- **Frontend estático HTTPS:** GitHub Pages (`https://doritotes444.github.io/krono-games/`).
- **Base de datos y autenticación real:** Supabase (`supabase/schema.sql` con PostgreSQL + Row Level Security).
- **Lógica privada de pagos y webhooks:** Supabase Edge Functions (`supabase/functions/create-checkout` y `supabase/functions/wompi-webhook`).
- **Actualización de noticias verificadas:** GitHub Actions (`.github/workflows/sync-news.yml` ejecutando `scripts/sync_news.py` cada 12 horas).

## 2. Paso a paso para activar Autenticación Real (Fase 8)
1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Ejecuta `supabase/schema.sql` en el **SQL Editor** para crear tablas y políticas RLS.
3. En **Authentication → Providers**, activa y pega tus credenciales oficiales de:
   - **Google OAuth 2.0** (Google Cloud Console)
   - **Facebook Login** (Meta for Developers)
   - **Discord OAuth 2.0** (Discord Developer Portal)
   - **Email/Password** (con verificación de correo obligatoria activada)
   - **Phone SMS** (Twilio o MessageBird habilitado para Colombia `+57`)
4. En `js/config.js`, configura únicamente `supabase.url` y `supabase.anonKey` (claves públicas) y cambia `supabase.configured = true`. **Nunca coloques `service_role` en el frontend.**

## 3. Paso a paso para activar Pagos Reales en Colombia (Fase 10)
1. Crea tu cuenta comercial en **Wompi Colombia** (acepta Visa, Mastercard, Nequi y Corresponsales Efecty / Bancolombia / PuntoRed) y opcionalmente **PayPal**.
2. Configura los secretos en Supabase Edge Functions (ver `.env.example`):
   - `WOMPI_INTEGRITY_SECRET`
   - `WOMPI_EVENTS_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Despliega las funciones:
   ```bash
   supabase functions deploy create-checkout
   supabase functions deploy wompi-webhook --no-verify-jwt
   ```
4. Registra la URL del webhook `https://<tu-proyecto>.supabase.co/functions/v1/wompi-webhook` en el panel de Wompi.
5. Activa `payments.liveCheckoutEnabled = true` en `js/config.js` **únicamente** después de validar tus documentos legales con un abogado colombiano y contar con inventario/distribuidor autorizado.

## 4. Verificación Legal Previa al Lanzamiento Comercial (Fase 12)
Antes de aceptar dinero real en Colombia, completa los campos `[PENDIENTE ...]` en las 11 páginas de `legal/*.html` con tu **Razón Social / Nombre legal, NIT, correo de notificaciones y teléfono**, y somete los borradores a revisión jurídica.
