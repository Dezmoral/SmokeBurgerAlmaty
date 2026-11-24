import { createHash } from 'node:crypto';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export function xml(data: string, status = 200) {
  return new Response(`<?xml version="1.0" encoding="utf-8"?><response>${data}</response>`, {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/xml; charset=utf-8' },
  });
}

export async function db(path: string, init: RequestInit = {}) {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Серверная база не настроена.');
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      Prefer: 'return=representation',
      ...init.headers,
    },
  });
  const result = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error('Не удалось сохранить данные заказа.');
  return result;
}

export function freedomPaySignature(script: string, params: Record<string, string>, secret: string) {
  const values = Object.keys(params).filter(key => key !== 'pg_sig').sort().map(key => params[key]);
  const raw = `${script};${values.join(';')};${secret}`;
  return createHash('md5').update(raw).digest('hex');
}

export async function validFreedomPaySignature(script: string, params: Record<string, string>, secret: string) {
  if (!params.pg_sig) return false;
  const expected = freedomPaySignature(script, params, secret);
  const actual = params.pg_sig.toLowerCase();
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let index = 0; index < actual.length; index++) diff |= actual.charCodeAt(index) ^ expected.charCodeAt(index);
  return diff === 0;
}

