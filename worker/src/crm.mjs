/** CRM Adapter interface — safe v0.1 implementation does not send or sync. */
export class NoopCrmAdapter {
  async syncProspect(_prospect) { return {status:'NOT_CONFIGURED',external_id:null}; }
  async logActivity(_event) { return {status:'NOT_CONFIGURED',external_id:null}; }
}
