# BUILD-002 — Cloudflare Workers + D1 foundation

Status: implementation proposed in an isolated GitHub branch. No Cloudflare deployment yet.

## Local verification
```sh
cd worker
npm install
npm run check
npm test
```

## Deployment preparation (requires Cloudflare access)

1. `npx wrangler login`
2. `npx wrangler d1 create revenue_engine`
3. Replace `REPLACE_WITH_REAL_D1_DATABASE_ID` in `wrangler.toml` with the returned ID.
4. `npx wrangler d1 migrations apply revenue_engine --remote`
5. `npx wrangler secret put API_KEY` (long random value, **never commit it**).
6. `npm run deploy`.
7. Test authenticated API and migration in a controlled environment before production claims.

### Endpoints

- `GET /health` — health metadata only
- `POST /v1/prospects` — insert prospect with evidence state
- `GET /v1/prospects/:id` — inspect stored record
- `GET /v1/prospects/:id/decision` — safe decision
- `POST /v1/prospects/:id/approve` — human approval *assertion* (authenticated service key, not verified personal identity)
- `POST /v1/events` — append idempotent revenue event
- `GET /v1/revenue/summary` — reported revenue only, not causal proof

All /v1 endpoints require `X-Revenue-API-Key`. There is NO messaging endpoint and NO live CRM adapter.

### Production blockers

Tenant isolation, per-user identities/roles, signed approval attribution, audit-grade immutable storage, event-state integrity, rate limits, opt-out/suppression controls, threat-model review, rate limiting and true D1 integration tests remain open. Current tests are local unit and HTTP contract smoke tests only.
