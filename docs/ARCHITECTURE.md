# Minimal architecture v0.1

- `models.py`: evidence states, prospect schema, revenue-event validation
- `engine.py`: deterministic qualification and human-approval boundary
- `journal.py`: append-only local JSONL event log with duplicate-ID rejection
- `cli.py`: offline demonstration and decision JSON output
- `data/synthetic/`: explicitly fake testing fixtures
- `data/verified/`: documentation only until evidence is collected
- `tests/`: workflow safeguards; CI on PR and push

## Future adapters — interfaces, not implemented features

`DiscoveryAdapter` → `EvidenceVerifier` → `DecisionEngine` → `DraftAdapter` → `ApprovalQueue` → `ManualContact` → `CalendarAdapter` → `CRMAdapter` → `RevenueJournal`.

Add auth, suppression/consent ledger, tenant isolation, encrypted durable storage and retry/idempotency controls before any production integrations. The current file-based journal is intended for single-process demonstration and is not concurrency-safe.
