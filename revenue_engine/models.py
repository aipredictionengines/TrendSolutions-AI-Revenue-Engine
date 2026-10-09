"""Validated boundaries between sourced opportunities and synthetic fixtures."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from urllib.parse import urlparse
import re

class EvidenceState(str, Enum):
    SYNTHETIC = "SYNTHETIC"
    UNVERIFIED = "UNVERIFIED"
    VERIFIED = "VERIFIED"

class Stage(str, Enum):
    DISCOVERED = "discovered"
    QUALIFIED = "qualified"
    APPROVED = "approved"
    CONTACTED = "contacted"
    REPLIED = "replied"
    BOOKED = "booked"
    PROPOSAL = "proposal"
    WON = "won"
    LOST = "lost"

@dataclass(frozen=True)
class Prospect:
    prospect_id: str
    company: str
    market: str
    niche: str
    evidence_state: EvidenceState
    source_url: Optional[str] = None
    checked_at: Optional[str] = None
    signal: Optional[str] = None
    score: int = 0
    contact_channel: Optional[str] = None
    consent_or_basis: Optional[str] = None

    def __post_init__(self):
        if not re.fullmatch(r"[A-Za-z0-9_-]{3,80}", self.prospect_id):
            raise ValueError("Invalid prospect_id")
        if not self.company.strip() or not self.market.strip() or not self.niche.strip():
            raise ValueError("Company, market and niche are required")
        if not 0 <= self.score <= 100:
            raise ValueError("Score must be 0..100")
        if self.evidence_state == EvidenceState.VERIFIED:
            if not self.source_url or urlparse(self.source_url).scheme not in ("http", "https") or not self.checked_at:
                raise ValueError("VERIFIED requires a source URL and checked_at")
            datetime.fromisoformat(self.checked_at.replace("Z", "+00:00"))

@dataclass(frozen=True)
class RevenueEvent:
    event_id: str
    prospect_id: str
    event_type: str
    occurred_at: str
    amount_usd: Optional[float] = None
    note: str = ""
    external_reference: Optional[str] = None

    def __post_init__(self):
        if not self.event_id or not self.prospect_id:
            raise ValueError("Event and prospect IDs required")
        if self.event_type not in {"discovered", "qualified", "approved", "contacted", "replied", "booked", "proposal", "won", "lost"}:
            raise ValueError("Invalid revenue event type")
        datetime.fromisoformat(self.occurred_at.replace("Z", "+00:00"))
        if self.amount_usd is not None and (self.amount_usd < 0 or self.event_type != "won"):
            raise ValueError("Revenue is only allowed on won events, nonnegative")
