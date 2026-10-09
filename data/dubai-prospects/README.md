# Dubai Real Estate Discovery Pilot #001

Target: 50 distinct verified **companies**, not 50 invented contacts. Current dataset: **0 verified records**.

Store only approved public business data with sources and observation dates. Avoid personal phone numbers, direct personal emails, scraped restricted sources and automated mass outreach. Before contacting, verify applicable local law and opt-out preferences.

## Evidence record (one per company)
- company_id, company_name, official_website, city, service_category
- business_contact_url, intake_url, observed_channels
- opportunity_hypothesis (never presented as a proven loss)
- evidence_url, evidence_observed_at, evidence_excerpt_or_summary
- evidence_status = VERIFIED | NEEDS_REVIEW | REJECTED
- scores (fit, indicators, opportunity, accessibility, evidence_confidence)
- total_score, reviewer, reviewed_at, outreach_permission_status

Acceptance: 50 VERIFIED unique company websites; every claimed fact has URL/date; duplicates rejected; uncertain assertions labelled UNKNOWN. No customer personal data committed to Git.
