# DISC-003 · Discovery foundation

Scope: Discovery Pilot #001 (Dubai / Bali / Thailand), inside TrendSolutions AI Revenue Engine.

## Status boundary
- Research spreadsheet is **not** verified buyer demand, contact permission, or proof of lost leads.
- Import only reviewed, evidence-backed company records. Do not put personal leads, tokens, or scraped bulk contacts in Git.
- No outbound sending endpoint exists. `QUALIFIED` cannot be reached from import.
- Evidence is an observation with source URL and timestamp, not independent verification of claimed response time.

## Setup
1. `npm install && npm run typecheck && npm test`
2. Create Cloudflare D1 database `trend-revenue`, replace placeholder database ID in `wrangler.toml`.
3. Set API token as secret: `npx wrangler secret put API_TOKEN`.
4. Apply migrations locally, then remotely only with approval: `npx wrangler d1 migrations apply trend-revenue --remote`.
5. Deploy using `npx wrangler deploy` once ready.

## API
- GET /health (public)
- POST /api/v1/prospects/import (Bearer API_TOKEN; max 50 per batch; JSON, not raw Excel/CSV)
- GET /api/v1/prospects (Bearer)
- GET /api/v1/prospects/:id/evidence (Bearer)

Example payload (synthetic, not a real prospect):
```json
{"prospects":[{"id":"TSL-DISC-001-001","organization_name":"Example Realty","market":"Dubai","website_url":"https://example.com","evidence":[{"source_url":"https://example.com/contact","observation":"Public contact page (synthetic fixture)","evidence_type":"OFFICIAL","observed_at":"2026-10-09T10:00:00Z"}]}]}
```

## Remaining gates
Actual spreadsheet-to-JSON review and import, 15 secondary-source reverifications, D1 provisioning, remote migration, deployment, runtime smoke test and customer validation are **not complete**.
