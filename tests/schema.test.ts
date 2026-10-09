import {describe,it,expect} from "vitest";
import {prospectSchema,importSchema,normalizeDomain,decide} from "../src/schema";
const base={id:"TSL-DISC-001-001",organization_name:"Example Realty",market:"Dubai",website_url:"https://example.com/",evidence:[]};
describe("DISC-003 data gates",()=>{
 it("normalizes company domains",()=>expect(normalizeDomain("https://www.Example.com/contact")).toBe("example.com"));
 it("rejects invalid market",()=>expect(prospectSchema.safeParse({...base,market:"USA"}).success).toBe(false));
 it("rejects extra unreviewed attributes",()=>expect(prospectSchema.safeParse({...base,auto_send:true}).success).toBe(false));
 it("requires evidence before review",()=>expect(decide([])).toEqual({status:"VERIFY",score:0}));
 it("never auto-qualifies with official evidence",()=>expect(decide([{source_url:"https://example.com",observation:"Contact form found",evidence_type:"OFFICIAL",observed_at:"2026-10-09T10:00:00Z"}])).toEqual({status:"REVIEW",score:60}));
 it("rejects malformed evidence",()=>expect(prospectSchema.safeParse({...base,evidence:[{source_url:"oops",observation:"",evidence_type:"OFFICIAL",observed_at:"2026-10-09"}]}).success).toBe(false));
 it("limits import batches",()=>expect(importSchema.safeParse({prospects:Array(51).fill(base)}).success).toBe(false));
 it("rejects unknown import controls",()=>expect(importSchema.safeParse({prospects:[base],send_emails:true}).success).toBe(false));
});
