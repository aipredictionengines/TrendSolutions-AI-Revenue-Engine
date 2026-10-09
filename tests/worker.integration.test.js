import { describe, expect, it } from 'vitest';
import worker from '../src/index.js';

const key = 'test-ingest-secret';
const endpoint = 'https://worker.example/v1/leads';
const validLead = {
  source: 'form',
  external_id: 'demo-001',
  contact: { email: 'buyer@example.com' },
  requirements: { location: 'Dubai Marina', budget_max: 1500000, timeline: '30 days' }
};
function fakeD1() {
  const ids = new Set();
  const audits = [];
  return {
    audits,
    prepare(sql) {
      const state = { values: [] };
      return {
        bind(...args) { state.values = args; return this; },
        async run() {
          if (sql.startsWith('INSERT OR IGNORE INTO leads')) {
            const id = state.values[0];
            if (ids.has(id)) return { meta: { changes: 0 } };
            ids.add(id);
            return { meta: { changes: 1 } };
          }
          if (sql.startsWith('INSERT INTO audit_events')) {
            audits.push(state.values);
            return { meta: { changes: 1 } };
          }
          throw new Error('unexpected SQL');
        }
      };
    }
  };
}
const request = (body, headers = {}) =>
  new Request(endpoint, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
const env = (DB = fakeD1()) => ({ DB, INGEST_API_KEY: key });

describe('Worker API contract (mock D1; not a live Cloudflare D1 test)', () => {
  it('serves health without revealing secrets', async () => {
    const res = await worker.fetch(new Request('https://worker.example/health'), env());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, version: '0.1.0' });
  });
  it('rejects missing and wrong credentials', async () => {
    const e = env();
    expect((await worker.fetch(new Request(endpoint, { method: 'POST', body: '{}' }), e)).status).toBe(401);
    expect((await worker.fetch(request(validLead, { authorization: 'Bearer wrong' }), e)).status).toBe(401);
  });
  it('fails closed when server key is missing', async () => {
    expect((await worker.fetch(request(validLead), { DB: fakeD1() })).status).toBe(503);
  });
  it('rejects malformed JSON and invalid schemas', async () => {
    expect((await worker.fetch(request('{broken'), env())).status).toBe(400);
    expect((await worker.fetch(request({ source: 'form', external_id: 'x', contact: {}, requirements: {} }), env())).status).toBe(422);
  });
  it('accepts a qualified inbound lead but never autonomously acts', async () => {
    const db = fakeD1();
    const res = await worker.fetch(request(validLead), env(db));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({
      duplicate: false,
      decision: { action: 'READY_FOR_REVIEW', human_approval_required: true },
      crm: { status: 'PENDING_HUMAN_APPROVAL' }
    });
    expect(db.audits).toHaveLength(1);
  });
  it('deduplicates retries using source and external ID', async () => {
    const e = env();
    expect((await worker.fetch(request(validLead), e)).status).toBe(201);
    const res = await worker.fetch(request(validLead), e);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ duplicate: true, status: 'EXISTS' });
    expect(e.DB.audits).toHaveLength(1);
  });
  it('falls back safely when storage is unavailable', async () => {
    const bad = { prepare() { throw new Error('offline'); } };
    expect((await worker.fetch(request(validLead), env(bad))).status).toBe(503);
  });
  it('does not expose a write route to unauthenticated visitors', async () => {
    expect((await worker.fetch(new Request('https://worker.example/unknown'), env())).status).toBe(404);
    expect((await worker.fetch(new Request(endpoint), env())).status).toBe(405);
  });
});
