# BUILD-001 — Revenue Core v0.1

## Goal
Capture inbound real-estate enquiries, validate schema, deduplicate, decide ASK/HUMAN_HANDOFF/READY_FOR_REVIEW, store audit event, prepare CRM adapter payload. No outbound messaging, voice calls, payments or booking execution in this build.

## Workflow
POST /v1/leads (Bearer INGEST_API_KEY) -> JSON schema validation -> SHA-256 idempotency key (source + external_id) -> D1 -> decision -> audit journal -> mock CRM adapter (PENDING_HUMAN_APPROVAL).

## Human control
Every decision requires human approval; no auto-send or CRM mutations. Do not infer consent from contact availability. Consent records are evidence, not permission to override legal restrictions.

## Setup
npm install; npm test; create D1 database with wrangler; replace placeholder D1 ID in wrangler.toml; apply migrations to local/remote D1; set INGEST_API_KEY via Wrangler secret; deploy only after CI and privacy/security review.

## Next gates
- Integration tests with Miniflare/D1 and authentication/idempotency/error paths
- Verified live D1 migrations and Worker deployment
- CRM adapter implementation, retries, DLQ, trace IDs, rate limits, request-body redaction and structured observability
- Actual booking integration, notification and handoff
- 50 evidence-verified Dubai prospect companies; currently zero verified
- Explicit legal review before outbound messaging or calling
