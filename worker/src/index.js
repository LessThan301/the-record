// The Record: anonymous "Did you believe this?" counter.
// Stores only totals per card. No cookies, no IP addresses, no user IDs, no logs written by this code.
import { IDS } from './ids.js';

const json = (data, status, cors) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...cors } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin) ? { 'access-control-allow-origin': origin, 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type', vary: 'origin' } : {};
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/counts' && req.method === 'GET') {
      const id = url.searchParams.get('id');
      if (!IDS.has(id)) return json({ error: 'unknown card' }, 404, cors);
      const row = await env.DB.prepare('SELECT believed, total FROM counts WHERE id = ?').bind(id).first();
      return json({ id, believed: row?.believed ?? 0, total: row?.total ?? 0 }, 200, cors);
    }

    if (url.pathname === '/vote' && req.method === 'POST') {
      if (!cors['access-control-allow-origin']) return json({ error: 'origin not allowed' }, 403, cors);
      let body; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400, cors); }
      if (!IDS.has(body?.id) || typeof body.believed !== 'boolean') return json({ error: 'bad request' }, 400, cors);
      const b = body.believed ? 1 : 0;
      const row = await env.DB.prepare(
        'INSERT INTO counts (id, believed, total) VALUES (?1, ?2, 1) ON CONFLICT(id) DO UPDATE SET believed = believed + ?2, total = total + 1 RETURNING believed, total'
      ).bind(body.id, b).first();
      return json({ id: body.id, believed: row.believed, total: row.total }, 200, cors);
    }
    return json({ error: 'not found' }, 404, cors);
  },
};
