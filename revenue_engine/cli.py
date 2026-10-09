"""Offline demonstration only. Does not contact prospects."""
import json
import argparse
from pathlib import Path
from dataclasses import asdict
from .models import Prospect, EvidenceState
from .engine import qualify
from .journal import RevenueJournal, summary

def main() -> None:
    parser = argparse.ArgumentParser(description="TrendSolutions Revenue Engine v0.1")
    parser.add_argument("--dataset", default="data/synthetic/discovery_001.json")
    parser.add_argument("--journal", default=None)
    args = parser.parse_args()
    data = json.loads(Path(args.dataset).read_text(encoding="utf-8"))
    prospects = [Prospect(**{**row, "evidence_state": EvidenceState(row["evidence_state"])}) for row in data]
    decisions = [{"prospect_id": p.prospect_id, **asdict(qualify(p))} for p in prospects]
    result = {"dataset": args.dataset, "prospect_count": len(prospects), "decisions": decisions}
    if args.journal:
        result["journal"] = summary(RevenueJournal(args.journal).read())
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
