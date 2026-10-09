CREATE TABLE IF NOT EXISTS leads (
 id TEXT PRIMARY KEY,
 source TEXT NOT NULL,
 external_id TEXT NOT NULL,
 contact_json TEXT NOT NULL,
 requirements_json TEXT NOT NULL,
 consent_json TEXT,
 decision_json TEXT NOT NULL,
 crm_status TEXT NOT NULL DEFAULT 'PENDING',
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 UNIQUE(source, external_id)
);
CREATE TABLE IF NOT EXISTS audit_events (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 lead_id TEXT NOT NULL,
 event_type TEXT NOT NULL,
 payload_json TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT (datetime('now')),
 FOREIGN KEY(lead_id) REFERENCES leads(id)
);
CREATE INDEX IF NOT EXISTS audit_by_lead ON audit_events(lead_id, created_at);
