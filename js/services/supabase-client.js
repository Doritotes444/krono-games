/**
 * KRONO — Cliente de Autenticación Real y Base de Datos (Supabase Auth + PostgreSQL)
 * Soporta Google, Facebook, Discord (OAuth 2.0), Correo/Contraseña y Teléfono SMS.
 * Nunca simula una conexión real a Supabase cuando faltan credenciales.
 */
import { KRONO_CONFIG } from '../config.js';

let clientPromise = null;

export function isSupabaseConfigured() {
  return Boolean(KRONO_CONFIG.supabase.url && KRONO_CONFIG.supabase.anonKey);
}

export async function getSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) =>
      createClient(KRONO_CONFIG.supabase.url, KRONO_CONFIG.supabase.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      })
    );
  }
  return clientPromise;
}

export async function signInWithOAuthProvider(provider) {
  const sb = await getSupabaseClient();
  if (!sb) {
    return {
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: `OAuth 2.0 real (${provider}) requiere configurar SUPABASE_URL, SUPABASE_ANON_KEY y el Client ID de ${provider} en Supabase Auth.`
      }
    };
  }
  return sb.auth.signInWithOAuth({
    provider, // 'google' | 'facebook' | 'discord'
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
}

export async function signInWithEmailPassword(email, password) {
  const sb = await getSupabaseClient();
  if (!sb) {
    return {
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'La autenticación real con correo requiere conectar tu proyecto de Supabase.'
      }
    };
  }
  return sb.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmailPassword(email, password, fullName) {
  const sb = await getSupabaseClient();
  if (!sb) {
    return {
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'El registro real con verificación de correo requiere conectar tu proyecto de Supabase.'
      }
    };
  }
  return sb.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: window.location.origin + window.location.pathname
    }
  });
}

export async function requestPasswordReset(email) {
  const sb = await getSupabaseClient();
  if (!sb) {
    return {
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'La recuperación real de contraseña requiere conectar Supabase Auth.'
      }
    };
  }
  return sb.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + window.location.pathname
  });
}

export async function sendPhoneOtp(phoneE164) {
  const sb = await getSupabaseClient();
  if (!sb) {
    return {
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'El envío real de SMS requiere configurar Supabase Phone Auth + Twilio/MessageBird.'
      }
    };
  }
  return sb.auth.signInWithOtp({ phone: phoneE164 });
}

export async function verifyPhoneOtp(phoneE164, token) {
  const sb = await getSupabaseClient();
  if (!sb) {
    return {
      error: {
        code: 'SUPABASE_NOT_CONFIGURED',
        message: 'La verificación real de SMS requiere configurar Supabase Phone Auth.'
      }
    };
  }
  return sb.auth.verifyOtp({ phone: phoneE164, token, type: 'sms' });
}
