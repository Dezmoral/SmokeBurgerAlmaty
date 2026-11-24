import { corsHeaders, db, json, validFreedomPaySignature, xml } from '../_shared/http.ts';

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return xml('<pg_status>rejected</pg_status>', 405);
  try {
    const secret = Deno.env.get('FREEDOMPAY_PAYMENT_SECRET');
    if (!secret) return xml('<pg_status>rejected</pg_status>', 503);
    const form = await request.formData();
    const params: Record<string, string> = {};
    for (const [key, value] of form.entries()) if (typeof value === 'string') params[key] = value;
    if (!await validFreedomPaySignature('freedompay-result', params, secret)) return xml('<pg_status>rejected</pg_status>', 400);
    if (!params.pg_order_id || !params.pg_payment_id || !['0', '1'].includes(params.pg_result) || params.pg_currency !== 'KZT') {
      return xml('<pg_status>rejected</pg_status>', 400);
    }
    const rows = await db(`orders?order_code=eq.${encodeURIComponent(params.pg_order_id)}&select=id,total,payment_status,provider_payment_id`);
    const order = rows?.[0];
    if (!order) return xml('<pg_status>rejected</pg_status>', 404);
    if (order.payment_status === 'paid' && order.provider_payment_id === params.pg_payment_id) return xml('<pg_status>ok</pg_status>');
    if (order.payment_status !== 'pending' || order.provider_payment_id !== params.pg_payment_id || Number(params.pg_amount) !== Number(order.total)) {
      return xml('<pg_status>rejected</pg_status>', 409);
    }
    const nextStatus = params.pg_result === '1' ? 'paid' : 'failed';
    const updated = await db(`orders?id=eq.${encodeURIComponent(order.id)}&payment_status=eq.pending&provider_payment_id=eq.${encodeURIComponent(params.pg_payment_id)}`, {
      method: 'PATCH', body: JSON.stringify({ payment_status: nextStatus }),
    });
    if (!updated?.length) {
      const current = await db(`orders?id=eq.${encodeURIComponent(order.id)}&select=payment_status,provider_payment_id`);
      if (current?.[0]?.payment_status === nextStatus && current?.[0]?.provider_payment_id === params.pg_payment_id) return xml('<pg_status>ok</pg_status>');
      return xml('<pg_status>rejected</pg_status>', 409);
    }
    return xml('<pg_status>ok</pg_status>');
  } catch {
    return xml('<pg_status>rejected</pg_status>', 500);
  }
});
