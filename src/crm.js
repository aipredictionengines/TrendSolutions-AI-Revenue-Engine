// Adapter contract. A real CRM integration requires separate credentials and approval.
export function createCrmAdapter() {
 return { async prepare(lead, decision) {
  return {status:'PENDING_HUMAN_APPROVAL',external_record_id:null,lead_id:lead.id,decision:decision.action};
 }};
}
