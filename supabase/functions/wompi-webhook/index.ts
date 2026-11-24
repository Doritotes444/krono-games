/**
 * KRONO — Edge Function: wompi-webhook
 * Verifica firma criptográfica SHA-256 de Wompi Colombia antes de aprobar un pedido.
 * Ningún cliente del navegador puede marcar una orden como pagada.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STATUS_MAP: Record<string, string> = {
  APPROVED: 'approved',
  DECLINED: 'rejected',
  VOIDED: 'refunded',
  ERROR: 'rejected'
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const eventsSecret = Deno.env.get('WOMPI_EVENTS_SECRET');
  if (!eventsSecret) {
    return new Response('WOMPI_EVENTS_SECRET not configured', { status: 503 });
  }

  const payload = await req.json();
  const tx = payload?.data?.transaction;
  const sig = payload?.signature;

  if (!tx || !sig?.checksum || !Array.isArray(sig?.properties)) {
    return new Response('Invalid webhook payload', { status: 400 });
  }

  // Verificar checksum oficial de Wompi: concat(properties values) + timestamp + eventsSecret
  const concatenated =
    sig.properties
      .map((prop: string) => prop.split('.').reduce((acc: any, key: string) => acc?.[key], payload.data))
      .join('') +
    String(payload.timestamp) +
    eventsSecret;

  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(concatenated));
  const computed = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (computed !== sig.checksum) {
    return new Response('Invalid signature', { status: 401 });
  }

  const nextStatus = STATUS_MAP[tx.status] || 'pending';
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .update({
      status: nextStatus,
      provider_transaction_id: tx.id,
      updated_at: new Date().toISOString()
    })
    .eq('reference', tx.reference)
    .select()
    .single();

  if (error || !order) {
    return new Response('Order not found', { status: 404 });
  }

  await supabaseAdmin.from('audit_logs').insert({
    action: 'payment_webhook_processed',
    entity_type: 'order',
    entity_id: order.id,
    payload: { provider: 'wompi', status: nextStatus, transaction_id: tx.id }
  });

  return new Response(JSON.stringify({ ok: true, status: nextStatus }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
});
