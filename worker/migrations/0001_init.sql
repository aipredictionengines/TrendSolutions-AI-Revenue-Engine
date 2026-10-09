CREATE TABLE IF NOT EXISTS prospects (
  id TEXT PRIMARY KEY,
  company TEXT NOT NULL,
  market TEXT NOT NULL,
  niche TEXT NOT NULL,
  evidence_state TEXT NOT NULL CHECK(evidence_state IN ('SYNTHETIC','UNVERIFIED','VERIFIED')),
  source_url TEXT,
  checked_at TEXT,
  signal TEXT,
  score INTEGER NOT NULL DEFAULT 0 CHECK(score BETWEEN 0 AND 100),
  contact_basis TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (evidence_state <> 'VERIFIED' OR (source_url IS NOT NULL AND checked_at IS NOT NULL))
);
CREATE TABLE IF NOT EXISTS approvals (
  prospect_id TEXT PRIMARY KEY REFERENCES prospects(id),
  reviewer TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  approved_action TEXT NOT NULL CHECK(approved_action='MANUAL_CONTACT'),
  rationale TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS revenue_events (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id),
  event_type TEXT NOT NULL CHECK(event_type IN ('discovered','qualified','approved','contacted','replied','booked','proposal','won','lost')),
  occurred_at TEXT NOT NULL,
  amount_usd REAL CHECK(amount_usd >= 0),
  external_ref TEXT,
  recorded_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (amount_usd IS NULL OR event_type = 'won')
);
CREATE INDEX IF NOT EXISTS idx_events_prospect ON revenue_events(prospect_id,occurred_at);
