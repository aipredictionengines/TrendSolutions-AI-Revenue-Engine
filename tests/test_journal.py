import tempfile
import unittest
from pathlib import Path
from revenue_engine.models import RevenueEvent
from revenue_engine.journal import RevenueJournal, summary

class JournalTests(unittest.TestCase):
    def test_idempotent_and_append_only(self):
        with tempfile.TemporaryDirectory() as tmp:
            journal = RevenueJournal(str(Path(tmp) / "events.jsonl"))
            event = RevenueEvent("evt1", "p1", "won", "2026-10-09T00:00:00Z", 500.0)
            self.assertTrue(journal.append(event))
            self.assertFalse(journal.append(event))
            self.assertEqual(len(journal.read()), 1)
            self.assertEqual(summary(journal.read())["reported_won_revenue_usd"], 500.0)
            with self.assertRaises(ValueError):
                journal.append(RevenueEvent("evt1", "p1", "won", "2026-10-09T00:00:00Z", 501.0))

    def test_missing_journal_is_empty(self):
        with tempfile.TemporaryDirectory() as tmp:
            journal = RevenueJournal(str(Path(tmp) / "missing.jsonl"))
            self.assertEqual(journal.read(), [])

if __name__ == "__main__":
    unittest.main()
