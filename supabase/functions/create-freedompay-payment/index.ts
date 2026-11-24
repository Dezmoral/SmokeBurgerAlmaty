import { corsHeaders, db, freedomPaySignature, json, validFreedomPaySignature } from '../_shared/http.ts';

const ADDONS = { cheese: 100, sauce: 250, fries: 900 } as const;
const ADDON_LABELS = { cheese: 'Сыр', sauce: 'Дополнительный соус', fries: 'Картофель фри' };
type OrderLine = { id: string; qty: number; addon_options?: Record<string, unknown>; note?: string };

function xmlValue(xml: string, key: string) {
  const match = xml.match(new RegExp(`<${key}>([\\s\\S]*?)</${key}>`, 'i'));
  return match?.[1]?.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") || '';
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Метод не поддерживается.' }, 405);
  try {
    const { order_id: orderId } = await request.json();
    if (typeof orderId !== 'string' || !/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: 'Некорректный заказ.' }, 400);
    const merchantId = Deno.env.get('FREEDOMPAY_MERCHANT_ID');
    const secret = Deno.env.get('FREEDOMPAY_PAYMENT_SECRET');
    const publicUrl = Deno.env.get('APP_PUBLIC_URL')?.replace(/\/$/, '');
    if (!merchantId || !secret || !publicUrl) return json({ error: 'Оплата ещё не настроена для этого сайта.' }, 503);
    let publicOrigin: URL;
    try { publicOrigin = new URL(publicUrl); } catch { return json({ error: 'Некорректно настроен адрес сайта.' }, 503); }
    if (publicOrigin.protocol !== 'https:') return json({ error: 'Для оплаты требуется HTTPS-адрес сайта.' }, 503);

    const rows = await db(`orders?id=eq.${encodeURIComponent(orderId)}&select=id,order_code,customer_phone,items,total,status,consent,payment_status,payment_url,provider_payment_id`);
    const order = rows?.[0];
    if (!order) return json({ error: 'Заказ не найден.' }, 404);
    if (!order.consent || order.status === 'cancelled') return json({ error: 'Этот заказ нельзя оплатить.' }, 409);
    if (order.payment_status === 'paid') return json({ error: 'Этот заказ уже оплачен.' }, 409);
    if (order.payment_status === 'pending' && order.payment_url) return json({ payment_url: order.payment_url });
    if (order.payment_status === 'processing' && order.payment_url) return json({ payment_url: order.payment_url });

    const lines = order.items as OrderLine[];
    if (!Array.isArray(lines) || lines.length < 1 || lines.length > 40) return json({ error: 'Состав заказа некорректен.' }, 400);
    const catalog = await db('menu_items?select=id,product,available');
    const byId = new Map(catalog.map((row: any) => [row.id, row]));
    let total = 0;
    const verifiedItems = lines.map(line => {
      const menuRow: any = byId.get(line.id);
      const qty = Number(line.qty);
      if (!menuRow || !menuRow.available || !Number.isInteger(qty) || qty < 1 || qty > 40) throw new Error('Одно из блюд больше недоступно. Обновите корзину и попробуйте снова.');
      const product = menuRow.product;
      const category = String(product.category || '');
      const extras = line.addon_options || {};
      const cheese = extras.cheese === true;
      const sauce = extras.sauce === true;
      const fries = extras.fries === true;
      const cheeseEligible = ['chicken-burger', 'beef-burger'];
      if (cheese && (!cheeseEligible.includes(String(product.id)) || category !== 'burgers')) throw new Error('Выбранная добавка больше недоступна.');
      if (sauce && category === 'drinks') throw new Error('Выбранная добавка больше недоступна.');
      if (fries && ['drinks', 'snacks'].includes(category)) throw new Error('Выбранная добавка больше недоступна.');
      const basePrice = Number(product.price);
      if (!Number.isSafeInteger(basePrice) || basePrice < 1) throw new Error('В меню обнаружена некорректная цена.');
      const unitPrice = basePrice + (cheese ? ADDONS.cheese : 0) + (sauce ? ADDONS.sauce : 0) + (fries ? ADDONS.fries : 0);
      total += unitPrice * qty;
      return {
        id: line.id,
        name_ru: String(product.name || line.id),
        name_kk: String(product.nameKk || product.name || line.id),
        qty,
        unit_price: unitPrice,
        line_total: unitPrice * qty,
        addons: Object.keys(ADDON_LABELS).filter(key => ({ cheese, sauce, fries } as Record<string, boolean>)[key]).map(key => ADDON_LABELS[key as keyof typeof ADDON_LABELS]),
        addon_options: { cheese, sauce, fries },
        note: typeof line.note === 'string' ? line.note.slice(0, 300) : '',
      };
    });
    if (!Number.isSafeInteger(total) || total < 1) return json({ error: 'Сумма заказа некорректна.' }, 400);

    const claimed = await db(`orders?id=eq.${encodeURIComponent(orderId)}&payment_status=in.(unpaid,failed)`, {
      method: 'PATCH', body: JSON.stringify({ total, items: verifiedItems, payment_status: 'processing', payment_provider: 'freedompay' }),
    });
    if (!claimed?.length) return json({ error: 'Заказ уже обрабатывается. Обновите страницу через несколько секунд.' }, 409);

    const returnUrl = `${publicOrigin.origin}/?payment=return&order_id=${encodeURIComponent(order.id)}&code=${encodeURIComponent(order.order_code)}`;
    const params: Record<string, string> = {
      pg_amount: String(total),
      pg_currency: 'KZT',
      pg_description: `Smoke Burger ${order.order_code}`,
      pg_failure_url: returnUrl,
      pg_language: 'ru',
      pg_merchant_id: merchantId,
      pg_order_id: order.order_code,
      pg_result_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/freedompay-result`,
      pg_salt: crypto.randomUUID().replaceAll('-', ''),
      pg_success_url: returnUrl,
      pg_user_phone: String(order.customer_phone).replace(/\D/g, ''),
    };
    if (Deno.env.get('FREEDOMPAY_TEST_MODE') === 'true') params.pg_testing_mode = '1';
    params.pg_sig = await freedomPaySignature('payment_page', params, secret);
    const form = new FormData();
    Object.entries(params).forEach(([key, value]) => form.append(key, value));
    const providerResponse = await fetch('https://api.freedompay.kz/g2g/payment_page', { method: 'POST', body: form });
    const responseText = await providerResponse.text();
    const status = xmlValue(responseText, 'pg_status');
    if (!providerResponse.ok || status !== 'ok') {
      await db(`orders?id=eq.${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ payment_status: 'failed' }) });
      return json({ error: xmlValue(responseText, 'pg_error_description') || 'Freedom Pay не смог создать платёж. Проверьте настройки мерчанта.' }, 502);
    }
    const paymentId = xmlValue(responseText, 'pg_payment_id');
    const paymentUrl = xmlValue(responseText, 'pg_redirect_url');
    const responseParams: Record<string, string> = {};
    for (const [, key, value] of responseText.matchAll(/<(pg_[a-z0-9_]+)>([^<]*)<\/\1>/gi)) responseParams[key] = value.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (!await validFreedomPaySignature('payment_page', responseParams, secret)) {
      await db(`orders?id=eq.${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ payment_status: 'failed' }) });
      return json({ error: 'Не удалось проверить ответ Freedom Pay.' }, 502);
    }
    if (!paymentId || !/^https:\/\/([a-z0-9-]+\.)*freedompay\.kz(?::\d+)?(?:\/|$)/i.test(paymentUrl)) {
      await db(`orders?id=eq.${encodeURIComponent(orderId)}`, { method: 'PATCH', body: JSON.stringify({ payment_status: 'failed' }) });
      return json({ error: 'Freedom Pay вернул некорректную ссылку оплаты.' }, 502);
    }
    await db(`orders?id=eq.${encodeURIComponent(orderId)}`, {
      method: 'PATCH', body: JSON.stringify({ payment_status: 'pending', provider_payment_id: paymentId, payment_url: paymentUrl }),
    });
    return json({ payment_url: paymentUrl });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Не удалось создать оплату.' }, 400);
  }
});
