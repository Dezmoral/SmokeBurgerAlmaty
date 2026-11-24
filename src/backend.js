const STORAGE_KEYS = {
  session: 'smokeBurgerAdminSession',
  menu: 'smokeBurgerMenu',
  promotions: 'smokeBurgerPromotions',
  reviews: 'smokeBurgerReviews',
};

const backendUrl = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const backendConfigured = Boolean(backendUrl && anonKey);
export const demoMode = !backendConfigured;

function readSession() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.session) || 'null'); }
  catch { return null; }
}

function saveSession(session) {
  if (session) localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  else localStorage.removeItem(STORAGE_KEYS.session);
}

async function api(path, options = {}) {
  if (!backendConfigured) throw new Error('Supabase is not configured.');
  const session = options.session === undefined ? await currentSession() : options.session;
  const response = await fetch(`${backendUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: anonKey,
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.msg || result?.message || result?.error_description || result?.error || 'Не удалось связаться с базой данных.');
  return result;
}

async function refreshSession() {
  const oldSession = readSession();
  if (!oldSession?.refresh_token) return null;
  const response = await fetch(`${backendUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: oldSession.refresh_token }),
  });
  const session = await response.json().catch(() => null);
  if (!response.ok) { saveSession(null); return null; }
  saveSession({ ...session, expires_at: Math.floor(Date.now() / 1000) + session.expires_in });
  return readSession();
}

async function currentSession() {
  const session = readSession();
  if (!session) return null;
  if (session.expires_at && session.expires_at < Math.floor(Date.now() / 1000) + 60) return refreshSession();
  return session;
}

export async function signIn(email, password) {
  const response = await api('/auth/v1/token?grant_type=password', {
    method: 'POST', body: { email, password }, session: null,
  });
  const session = { ...response, expires_at: Math.floor(Date.now() / 1000) + response.expires_in };
  saveSession(session);
  return session;
}

export async function signOut() {
  const session = await currentSession();
  if (session) await api('/auth/v1/logout', { method: 'POST', session }).catch(() => {});
  saveSession(null);
}

export async function verifyStaff() {
  const session = await currentSession();
  if (!session) return false;
  const result = await api('/rest/v1/rpc/is_staff', { method: 'POST', body: {}, session });
  return result === true;
}

export const fetchMenu = () => api('/rest/v1/menu_items?select=id,product,available&order=id.asc');
export const fetchPromotions = (all = false) => api(`/rest/v1/promotions?select=*&order=created_at.desc${all ? '' : '&active=eq.true'}`);
export const fetchReviews = (all = false) => api(`/rest/v1/reviews?select=id,author,rating,body,created_at,status&order=created_at.desc${all ? '' : '&status=eq.approved'}`);

export const saveMenuItem = item => api('/rest/v1/menu_items?on_conflict=id', {
  method: 'POST', body: { id: item.id, product: item.product, available: item.available !== false },
  headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
});
export const deleteMenuItem = id => api(`/rest/v1/menu_items?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
export const savePromotion = promo => api(promo.id
  ? `/rest/v1/promotions?id=eq.${encodeURIComponent(promo.id)}`
  : '/rest/v1/promotions', {
    method: promo.id ? 'PATCH' : 'POST', body: promo,
    headers: { Prefer: 'return=representation' },
  });
export const deletePromotion = id => api(`/rest/v1/promotions?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
export const sendReview = review => api('/rest/v1/reviews', {
  method: 'POST', body: { ...review, status: 'pending' },
});
export const setReviewStatus = (id, status) => api(`/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`, {
  method: 'PATCH', body: { status }, headers: { Prefer: 'return=representation' },
});
export const deleteReview = id => api(`/rest/v1/reviews?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });

export const demoStorageKeys = STORAGE_KEYS;
export function readDemoList(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return Array.isArray(value) ? value : null;
  } catch { return null; }
}
export function writeDemoList(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
