"""Append-only, idempotent JSONL event journal. No hidden attribution assumptions."""
import json
from pathlib import Path
from .models import RevenueEvent

class RevenueJournal:
    def __init__(self, path: str):
        self.path = Path(path)

    def read(self) -> list[RevenueEvent]:
        if not self.path.exists():
            return []
        with self.path.open(encoding="utf-8") as f:
            return [RevenueEvent(**json.loads(line)) for line in f if line.strip()]

    def append(self, event: RevenueEvent) -> bool:
        events = self.read()
        previous = {e.event_id: e for e in events}
        if event.event_id in previous:
            if previous[event.event_id] != event:
                raise ValueError("Conflicting event_id; refusing overwrite")
            return False
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(event.__dict__, ensure_ascii=False, sort_keys=True) + "\n")
        return True

def summary(events: list[RevenueEvent]) -> dict:
    ids = {}
    for e in events:
        ids.setdefault(e.prospect_id, set()).add(e.event_type)
    return {
        "unique_prospects": len(ids),
        "replied": sum("replied" in stages for stages in ids.values()),
        "booked": sum("booked" in stages for stages in ids.values()),
        "won": sum("won" in stages for stages in ids.values()),
        "reported_won_revenue_usd": round(sum((e.amount_usd or 0) for e in events if e.event_type == "won"), 2),
        "attribution_status": "self-reported events only; no verified causal attribution",
    }
