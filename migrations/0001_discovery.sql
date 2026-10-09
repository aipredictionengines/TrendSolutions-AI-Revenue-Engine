PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS prospects (
  id TEXT PRIMARY KEY,
  organization_name TEXT NOT NULL,
  market TEXT NOT NULL CHECK(market IN ('Dubai','Bali','Thailand')),
  website_url TEXT NOT NULL,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'VERIFY' CHECK(status IN ('VERIFY','REVIEW','QUALIFIED','REJECT')),
  score INTEGER NOT NULL DEFAULT 0 CHECK(score BETWEEN 0 AND 100),
  problem_verified INTEGER NOT NULL DEFAULT 0 CHECK(problem_verified IN (0,1)),
  outreach_approved INTEGER NOT NULL DEFAULT 0 CHECK(outreach_approved IN (0,1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(market,domain)
);
CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  prospect_id TEXT NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  observation TEXT NOT NULL,
  evidence_type TEXT NOT NULL CHECK(evidence_type IN ('OFFICIAL','NETWORK','THIRD_PARTY')),
  observed_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_evidence_prospect ON evidence(prospect_id);
CREATE TABLE IF NOT EXISTS import_runs (
  id TEXT PRIMARY KEY,
  submitted_count INTEGER NOT NULL,
  accepted_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
