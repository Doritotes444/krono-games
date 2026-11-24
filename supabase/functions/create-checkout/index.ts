/**
 * KRONO — Edge Function: create-checkout (Colombia únicamente)
 * Valida sesión obligatoria, recalcula precios/stock en servidor (nunca confía en el navegador),
 * calcula IVA/envío en COP y genera referencia para Visa, Mastercard, PayPal, Nequi o Corresponsal.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ALLOWED_METHODS = new Set(['visa', 'mastercard', 'paypal', 'nequi', 'corresponsal']);
const ALLOWED_CORRESPONSALES = new Set(['Efecty', 'Corresponsal Bancolombia', 'PuntoRed']);

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const wompiIntegritySecret = Deno.env.get('WOMPI_INTEGRITY_SECRET') || '';

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Debes iniciar sesión para realizar una compra.' }), { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceKey);
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Sesión inválida o expirada.' }), { status: 401 });
  }

  const body = await req.json();
  const { items, paymentMethod, corresponsalNetwork, departmentCo, cityCo, documentId, phoneCo, couponCode } = body;

  if (body.country && body.country !== 'CO') {
    return new Response(JSON.stringify({ error: 'Por ahora las compras en KRONO operan únicamente en Colombia.' }), { status: 400 });
  }
  if (!ALLOWED_METHODS.has(paymentMethod)) {
    return new Response(JSON.stringify({ error: 'Método de pago no soportado.' }), { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return new Response(JSON.stringify({ error: 'El carrito está vacío.' }), { status: 400 });
  }

  // 1. Obtener precios y stock reales desde PostgreSQL (nunca desde el cliente)
  const gameIds = items.map((i: { gameId: string }) => i.gameId);
  const { data: dbGames, error: gamesErr } = await supabaseAdmin
    .from('games')
    .select('id, title, price_usd, stock_physical, stock_digital, is_active')
    .in('id', gameIds);

  if (gamesErr || !dbGames) {
    return new Response(JSON.stringify({ error: 'Error consultando catálogo.' }), { status: 500 });
  }

  const fxRate = Number(Deno.env.get('KRONO_USD_TO_COP') || 4100);
  let subtotalCop = 0;
  let hasPhysical = false;
  const orderItemsPayload = [];

  for (const reqItem of items) {
    const g = dbGames.find((x) => x.id === reqItem.gameId && x.is_active);
    if (!g) {
      return new Response(JSON.stringify({ error: `Producto no disponible: ${reqItem.gameId}` }), { status: 400 });
    }
    const qty = Math.max(1, Math.min(10, Number(reqItem.quantity || 1)));
    const editionType = reqItem.editionType === 'physical' ? 'physical' : 'digital';
    const availableStock = editionType === 'physical' ? g.stock_physical : g.stock_digital;
    if (availableStock < qty) {
      return new Response(
        JSON.stringify({ error: `Sin inventario autorizado suficiente para ${g.title}.` }),
        { status: 409 }
      );
    }
    if (editionType === 'physical') hasPhysical = true;
    const unitCop = Math.round((Number(g.price_usd) * fxRate) / 100) * 100;
    subtotalCop += unitCop * qty;
    orderItemsPayload.push({
      game_id: g.id,
      title_snapshot: g.title,
      edition_type: editionType,
      quantity: qty,
      unit_price_cop: unitCop
    });
  }

  // 2. Validar cupón en servidor
  let discountCop = 0;
  if (couponCode) {
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', String(couponCode).toUpperCase())
      .eq('active', true)
      .maybeSingle();
    if (coupon && (!coupon.expires_at || new Date(coupon.expires_at) > new Date())) {
      discountCop = Math.round(subtotalCop * (coupon.discount_percent / 100));
    }
  }

  const shippingCop = hasPhysical ? 14900 : 0;
  const totalCop = Math.max(0, subtotalCop - discountCop + shippingCop);
  const reference = `KRN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // 3. Código de corresponsal bancario (48 h de vigencia) si aplica
  const isCorresponsal = paymentMethod === 'corresponsal';
  const network = ALLOWED_CORRESPONSALES.has(corresponsalNetwork) ? corresponsalNetwork : 'Efecty';
  const corresponsalCode = isCorresponsal ? `8804${String(Date.now()).slice(-8)}` : null;
  const corresponsalExpiresAt = isCorresponsal
    ? new Date(Date.now() + 48 * 3600 * 1000).toISOString()
    : null;

  // 4. Registrar orden en estado PENDING (solo un webhook firmado la aprueba)
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert({
      reference,
      user_id: userData.user.id,
      country: 'CO',
      department_co: departmentCo,
      city_co: cityCo,
      customer_document: documentId,
      customer_phone: phoneCo,
      payment_method: paymentMethod,
      payment_provider: paymentMethod === 'paypal' ? 'paypal' : 'wompi',
      corresponsal_network: isCorresponsal ? network : null,
      corresponsal_agreement: isCorresponsal ? 'CONVENIO-KRONO-PENDIENTE' : null,
      corresponsal_code: corresponsalCode,
      corresponsal_expires_at: corresponsalExpiresAt,
      currency: 'COP',
      fx_rate_used: fxRate,
      subtotal_cop: subtotalCop,
      discount_cop: discountCop,
      shipping_cop: shippingCop,
      total_cop: totalCop,
      coupon_code: discountCop > 0 ? String(couponCode).toUpperCase() : null,
      status: 'pending'
    })
    .select()
    .single();

  if (orderErr || !order) {
    return new Response(JSON.stringify({ error: 'No se pudo crear la orden.' }), { status: 500 });
  }

  await supabaseAdmin
    .from('order_items')
    .insert(orderItemsPayload.map((item) => ({ ...item, order_id: order.id })));

  // 5. Firma de integridad SHA-256 para Wompi Colombia (amount_in_cents)
  let integritySignature = null;
  if (wompiIntegritySecret && paymentMethod !== 'paypal') {
    const raw = `${reference}${totalCop * 100}COP${wompiIntegritySecret}`;
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    integritySignature = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  return new Response(
    JSON.stringify({
      orderId: order.id,
      reference,
      status: 'pending',
      totalCop,
      amountInCents: totalCop * 100,
      currency: 'COP',
      paymentMethod,
      integritySignature,
      corresponsal: isCorresponsal
        ? { network, agreement: order.corresponsal_agreement, code: corresponsalCode, expiresAt: corresponsalExpiresAt }
        : null
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
