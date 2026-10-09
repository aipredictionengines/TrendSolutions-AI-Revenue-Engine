import unittest
from revenue_engine.models import Prospect, EvidenceState, Stage, RevenueEvent
from revenue_engine.engine import qualify, next_action

def prospect(**changes):
    values = dict(prospect_id="p_001", company="Example Agency", market="Dubai", niche="Real estate",
                  evidence_state=EvidenceState.VERIFIED, source_url="https://example.com",
                  checked_at="2026-10-09T00:00:00Z", signal="Documented hiring signal",
                  score=80, consent_or_basis="Reviewed by operator")
    values.update(changes)
    return Prospect(**values)

class QualificationTests(unittest.TestCase):
    def test_synthetic_cannot_qualify(self):
        p = prospect(evidence_state=EvidenceState.SYNTHETIC, source_url=None, checked_at=None)
        self.assertEqual(qualify(p).action, "VERIFY_FIRST")

    def test_verified_requires_url_and_timestamp(self):
        with self.assertRaises(ValueError):
            prospect(source_url=None)
        with self.assertRaises(ValueError):
            prospect(checked_at="invalid")

    def test_low_score_is_watch(self):
        self.assertEqual(qualify(prospect(score=35)).action, "WATCH")

    def test_verified_signal_can_be_drafted(self):
        self.assertEqual(qualify(prospect()).action, "DRAFT_PERSONALIZATION")

    def test_no_legal_basis_blocks_outreach(self):
        self.assertEqual(next_action(prospect(consent_or_basis=None), Stage.QUALIFIED).action, "COMPLIANCE_REVIEW")

    def test_human_approval_required(self):
        self.assertEqual(next_action(prospect(), Stage.APPROVED, approved=False).action, "WAIT_FOR_APPROVAL")
        self.assertEqual(next_action(prospect(), Stage.APPROVED, approved=True).action, "MANUAL_SEND_ONLY")

    def test_replied_handoff(self):
        self.assertEqual(next_action(prospect(), Stage.REPLIED).action, "HUMAN_HANDOFF")

    def test_amount_only_on_won(self):
        with self.assertRaises(ValueError):
            RevenueEvent("e1", "p1", "booked", "2026-10-09T00:00:00Z", 200)

if __name__ == "__main__":
    unittest.main()
