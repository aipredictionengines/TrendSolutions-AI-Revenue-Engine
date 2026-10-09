# Revenue Recovery Pilot v0.1 — Execution Contract

**Objective:** prove that evidence-based opportunity research plus compliant, human-approved follow-up can lead to meaningful sales conversations. This is not a completed customer test.

## Target acquisition dataset

Discovery Pilot #001: **50 real, independently checkable B2B real-estate agencies**, initially Dubai, Bali and Thailand. No real prospects have been imported yet. `data/synthetic/` contains strictly fictional records.

## Journey

Intent signal → discovery → evidence verification → ICP qualification → personalization draft → compliance review → explicit human approval → manual email/contact → logged reply → booked conversation → CRM/human handoff → proposal → recorded won/lost outcome.

**Not built in v0.1:** email sending, SMS, WhatsApp, voice, production CRM sync, automated calendar booking, payments, authenticated SaaS dashboard or causal revenue attribution.

## Minimum observable metrics

- Verified companies / discovered companies
- Human-approved outreaches / proposed outreaches
- Replies / actual sent outreaches
- Qualified booked meetings / actual sent outreaches
- Proposals, won deals and self-reported closed revenue

Do not divide by proposed contacts when reporting send conversion; never infer causal lift without a proper comparison group.

## Data quality and compliance gates

1. Evidence `VERIFIED` requires a traceable URL and check timestamp; researchers must assess whether claimed signals actually follow from the source.
2. Every outreach requires a justified, documented jurisdiction/channel-specific contact basis and operator review.
3. No scraping behind logins, evasion of rate limits, harvested private contacts, misleading claims or unsupervised bulk outreach.
4. Opt-outs and suppression lists belong in a secure production CRM before any campaign is sent.
5. Secrets, personal identifiers, message contents and real prospect CRM data must not be committed to Git.
6. Humans approve content and conduct negotiations, pricing, contracts and closing.
7. `RevenueJournal` records **reported** events; it is not by itself proof of causation.

## Pilot acceptance gate

- Unit tests + offline smoke test pass in GitHub Actions.
- 50 real company records evidence-checked, with VERIFIED/UNVERIFIED split disclosed.
- At least one consenting pilot operator runs a controlled customer test.
- Logged sequence from source → decision → approved contact → response → outcome.
- v0.2 requires observed customer evidence, not just successful unit tests.
