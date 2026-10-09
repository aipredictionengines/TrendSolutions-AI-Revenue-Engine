// Bounded deterministic gate: no autonomous sending, booking, or CRM mutation.
export function decide(lead) {
 const r = lead.requirements || {};
 const missing = [];
 if (!r.location?.trim()) missing.push('location');
 if (typeof r.budget_max !== 'number' && typeof r.budget_min !== 'number') missing.push('budget');
 if (!r.timeline?.trim()) missing.push('timeline');
 if (typeof r.budget_min === 'number' && typeof r.budget_max === 'number' && r.budget_min > r.budget_max)
   return {action:'HUMAN_HANDOFF',confidence:0,reasons:['invalid_budget_range'],human_approval_required:true};
 if (missing.length) return {action:'ASK',confidence:Math.max(0.2,1-missing.length*0.25),reasons:missing.map(x=>'missing_'+x),human_approval_required:true};
 return {action:'READY_FOR_REVIEW',confidence:0.9,reasons:['qualification_fields_present'],human_approval_required:true};
}
