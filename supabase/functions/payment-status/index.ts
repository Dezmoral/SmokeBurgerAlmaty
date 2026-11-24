import { corsHeaders, db, json } from '../_shared/http.ts';

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Метод не поддерживается.' }, 405);
  try {
    const { order_id: orderId, order_code: orderCode } = await request.json();
    if (typeof orderId !== 'string' || typeof orderCode !== 'string' || !/^[0-9a-f-]{36}$/i.test(orderId) || !/^SB-[A-Z0-9]{8}$/.test(orderCode)) return json({ error: 'Заказ не найден.' }, 404);
    const rows = await db(`orders?id=eq.${encodeURIComponent(orderId)}&order_code=eq.${encodeURIComponent(orderCode)}&select=order_code,status,payment_status`);
    if (!rows?.length) return json({ error: 'Заказ не найден.' }, 404);
    return json({ order_code: rows[0].order_code, order_status: rows[0].status, payment_status: rows[0].payment_status });
  } catch {
    return json({ error: 'Не удалось проверить статус оплаты.' }, 500);
  }
});
