"""Deterministic qualification, approval gates and next-best-action decisions."""
from dataclasses import dataclass
from .models import Prospect, EvidenceState, Stage

@dataclass(frozen=True)
class Decision:
    action: str
    reasons: tuple[str, ...]
    needs_human_approval: bool = True

def qualify(p: Prospect) -> Decision:
    if p.evidence_state != EvidenceState.VERIFIED:
        return Decision("VERIFY_FIRST", ("Evidence not independently verified",))
    if p.score < 50:
        return Decision("WATCH", ("Below ICP threshold",))
    if not p.signal:
        return Decision("RESEARCH", ("No documented intent signal",))
    return Decision("DRAFT_PERSONALIZATION", ("Verified source", "Intent signal recorded",))

def next_action(p: Prospect, stage: Stage, approved: bool = False) -> Decision:
    if stage == Stage.DISCOVERED:
        return qualify(p)
    if stage == Stage.QUALIFIED:
        if p.evidence_state != EvidenceState.VERIFIED:
            return Decision("VERIFY_FIRST", ("Not verified",))
        if not p.consent_or_basis:
            return Decision("COMPLIANCE_REVIEW", ("Contact basis is absent",))
        return Decision("READY_FOR_HUMAN_REVIEW", ("Outreach draft requires approval",))
    if stage == Stage.APPROVED:
        if not approved:
            return Decision("WAIT_FOR_APPROVAL", ("No human approval recorded",))
        if p.evidence_state != EvidenceState.VERIFIED or not p.consent_or_basis:
            return Decision("BLOCK", ("Evidence or contact basis missing",))
        return Decision("MANUAL_SEND_ONLY", ("Pilot disables automated delivery",))
    if stage == Stage.REPLIED:
        return Decision("HUMAN_HANDOFF", ("Conversation needs review",))
    if stage == Stage.BOOKED:
        return Decision("PREPARE_MEETING", ("Human handles negotiation and closing",))
    if stage == Stage.PROPOSAL:
        return Decision("HUMAN_FOLLOW_UP", ("Proposal must be handled by human",))
    return Decision("RECORD_OUTCOME", ("Log the latest observable stage",))
