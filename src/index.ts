import { importSchema, normalizeDomain, decide } from "./schema";
import { z } from "zod";
type Env={DB:D1Database; API_TOKEN:string};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});
const fail=(error:string,status:number)=>json({error},status);
const uuid=()=>crypto.randomUUID();
export default {
 async fetch(req:Request,env:Env):Promise<Response>{
  const url=new URL(req.url);
  if(url.pathname==="/health" && req.method==="GET") return json({ok:true,service:"discovery",version:"0.1"});
  if(!env.API_TOKEN || req.headers.get("authorization")!==`Bearer ${env.API_TOKEN}`) return fail("unauthorized",401);
  try {
   if(url.pathname==="/api/v1/prospects/import" && req.method==="POST"){
    const contentLength=Number(req.headers.get("content-length")||"0");
    if(contentLength>250000) return fail("payload_too_large",413);
    let body:unknown;try{body=await req.json();}catch{return fail("invalid_json",400);}
    const parsed=importSchema.safeParse(body);
    if(!parsed.success) return json({error:"validation_failed",issues:parsed.error.issues},422);
    const rows=parsed.data.prospects, ids=new Set<string>(), domains=new Set<string>();
    const prepared=[];
    for(const p of rows){
      const domain=normalizeDomain(p.website_url);
      if(ids.has(p.id)||domains.has(`${p.market}:${domain}`))return fail("duplicate_in_payload",409);
      ids.add(p.id);domains.add(`${p.market}:${domain}`);
      const d=decide(p.evidence);
      prepared.push({p,domain,d});
    }
    // Conflict must fail rather than silently overwrite evidence or validation decisions.
    const statements=prepared.flatMap(({p,domain,d})=>[
      env.DB.prepare("INSERT INTO prospects (id,organization_name,market,website_url,domain,status,score) VALUES (?,?,?,?,?,?,?)").bind(p.id,p.organization_name,p.market,p.website_url,domain,d.status,d.score),
      ...p.evidence.map(e=>env.DB.prepare("INSERT INTO evidence (id,prospect_id,source_url,observation,evidence_type,observed_at) VALUES (?,?,?,?,?,?)").bind(uuid(),p.id,e.source_url,e.observation,e.evidence_type,e.observed_at))
    ]);
    const runId=uuid();
    statements.push(env.DB.prepare("INSERT INTO import_runs (id,submitted_count,accepted_count) VALUES (?,?,?)").bind(runId,rows.length,rows.length));
    try{await env.DB.batch(statements);}catch{return fail("import_conflict_or_database_error",409);}
    return json({run_id:runId,accepted:rows.length,status:"recorded_not_verified"},201);
   }
   const match=url.pathname.match(/^\/api\/v1\/prospects\/(TSL-DISC-001-\d{3})\/evidence$/);
   if(match && req.method==="GET"){
      const row=await env.DB.prepare("SELECT id,organization_name,market,website_url,status,score,problem_verified,outreach_approved FROM prospects WHERE id=?").bind(match[1]).first();
      if(!row)return fail("not_found",404);
      const evidence=await env.DB.prepare("SELECT id,source_url,observation,evidence_type,observed_at FROM evidence WHERE prospect_id=? ORDER BY observed_at DESC").bind(match[1]).all();
      return json({prospect:row,evidence:evidence.results});
   }
   if(url.pathname==="/api/v1/prospects" && req.method==="GET"){
      const limit=Math.min(100,Math.max(1,Number(url.searchParams.get("limit")||20)||20));
      const result=await env.DB.prepare("SELECT id,organization_name,market,website_url,status,score,problem_verified,outreach_approved FROM prospects ORDER BY score DESC,id ASC LIMIT ?").bind(limit).all();
      return json({prospects:result.results});
   }
   return fail("not_found",404);
  }catch(e){if(e instanceof z.ZodError)return fail("invalid_payload",422);return fail("internal_error",500);}
 }
} satisfies ExportedHandler<Env>;
