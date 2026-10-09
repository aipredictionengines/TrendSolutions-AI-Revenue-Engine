import { z } from "zod";
export const evidenceSchema = z.object({
  source_url: z.string().url().max(2048),
  observation: z.string().trim().min(3).max(1500),
  evidence_type: z.enum(["OFFICIAL","NETWORK","THIRD_PARTY"]),
  observed_at: z.string().datetime({ offset: true })
}).strict();
export const prospectSchema = z.object({
  id: z.string().regex(/^TSL-DISC-001-\d{3}$/),
  organization_name: z.string().trim().min(2).max(200),
  market: z.enum(["Dubai","Bali","Thailand"]),
  website_url: z.string().url().max(2048),
  evidence: z.array(evidenceSchema).max(12).default([])
}).strict();
export const importSchema = z.object({ prospects: z.array(prospectSchema).min(1).max(50) }).strict();
export type ProspectInput = z.infer<typeof prospectSchema>;
export function normalizeDomain(url: string): string {
  const parsed = new URL(url);
  if (!["http:","https:"].includes(parsed.protocol)) throw new Error("invalid_scheme");
  return parsed.hostname.toLowerCase().replace(/^www\./,"");
}
export function decide(evidence: ProspectInput["evidence"]): { status: "VERIFY"|"REVIEW"; score: number } {
  if (!evidence.length) return {status:"VERIFY",score:0};
  const official = evidence.some(e=>e.evidence_type==="OFFICIAL");
  const network = evidence.some(e=>e.evidence_type==="NETWORK");
  return {status:official?"REVIEW":"VERIFY",score:official?60:network?35:20};
}
