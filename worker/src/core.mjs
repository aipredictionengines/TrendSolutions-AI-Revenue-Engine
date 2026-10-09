export function validateProspect(p) {
  if (!p || typeof p !== 'object' || Array.isArray(p)) throw new Error('invalid_body');
  if (typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{3,80}$/.test(p.id)) throw new Error('invalid_id');
  for (const f of ['company','market','niche']) if (typeof p[f] !== 'string' || !p[f].trim()) throw new Error('missing_'+f);
  if (!['SYNTHETIC','UNVERIFIED','VERIFIED'].includes(p.evidence_state)) throw new Error('invalid_evidence_state');
  if (!Number.isInteger(p.score) || p.score < 0 || p.score > 100) throw new Error('invalid_score');
  if (p.evidence_state === 'VERIFIED') {
    if (typeof p.source_url !== 'string' || !/^https?:\/\/[^\s/]+/i.test(p.source_url) || !Number.isFinite(Date.parse(p.checked_at))) throw new Error('evidence_required');
  }
  return {id:p.id,company:p.company.trim(),market:p.market.trim(),niche:p.niche.trim(),evidence_state:p.evidence_state,source_url:p.source_url ?? null,checked_at:p.checked_at ?? null,signal:p.signal ?? null,score:p.score,contact_basis:p.contact_basis ?? null};
}
export function decide(p, approved=false) {
  if (!p || p.evidence_state !== 'VERIFIED') return {action:'VERIFY_FIRST',reason:'evidence_not_verified'};
  if (p.score < 50) return {action:'WATCH',reason:'below_threshold'};
  if (!p.signal) return {action:'RESEARCH',reason:'intent_signal_missing'};
  if (!p.contact_basis) return {action:'COMPLIANCE_REVIEW',reason:'contact_basis_missing'};
  if (!approved) return {action:'HUMAN_APPROVAL',reason:'approval_required'};
  return {action:'MANUAL_CONTACT_ONLY',reason:'autonomous_outreach_disabled'};
}
export function validateEvent(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e) || typeof e.id !== 'string' || !/^[a-zA-Z0-9_-]{3,80}$/.test(e.id) || typeof e.prospect_id !== 'string' || !/^[a-zA-Z0-9_-]{3,80}$/.test(e.prospect_id)) throw new Error('invalid_event_id');
  if (!['discovered','qualified','approved','contacted','replied','booked','proposal','won','lost'].includes(e.event_type)) throw new Error('invalid_event_type');
  if (typeof e.occurred_at !== 'string' || !Number.isFinite(Date.parse(e.occurred_at))) throw new Error('invalid_occurred_at');
  if (e.amount_usd != null && (e.event_type !== 'won' || typeof e.amount_usd !== 'number' || !Number.isFinite(e.amount_usd) || e.amount_usd < 0)) throw new Error('invalid_amount');
  return {id:e.id,prospect_id:e.prospect_id,event_type:e.event_type,occurred_at:e.occurred_at,amount_usd:e.amount_usd ?? null,external_ref:e.external_ref ?? null};
}
