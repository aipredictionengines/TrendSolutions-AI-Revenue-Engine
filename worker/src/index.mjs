import { validateProspect, validateEvent, decide } from './core.mjs';
import { NoopCrmAdapter } from './crm.mjs';
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const safeEqual=(a,b)=>{if(typeof a!=='string'||typeof b!=='string') return false;const x=new TextEncoder().encode(a),y=new TextEncoder().encode(b);let mismatch=x.length^y.length;for(let i=0;i<Math.max(x.length,y.length);i++)mismatch|=(x[i]??0)^(y[i]??0);return mismatch===0;};
const get=async(db,id)=>db.prepare('SELECT * FROM prospects WHERE id = ?').bind(id).first();
const dbReady=env=>env.DB && typeof env.DB.prepare==='function';
export default {
 async fetch(req,env){
  const url=new URL(req.url);
  if(url.pathname==='/health' && req.method==='GET') return json({status:'ok',service:'revenue-recovery-v0.1',storage:dbReady(env)?'bound':'missing'});
  if(!env.API_KEY || !safeEqual(req.headers.get('X-Revenue-API-Key'),env.API_KEY)) return json({error:'unauthorized'},401);
  if(!dbReady(env)) return json({error:'database_not_configured'},503);
  if(!['GET','POST'].includes(req.method)) return json({error:'method_not_allowed'},405);
  try {
   if(url.pathname==='/v1/prospects' && req.method==='POST'){
    const p=validateProspect(await req.json());
    const stmt=env.DB.prepare('INSERT INTO prospects(id,company,market,niche,evidence_state,source_url,checked_at,signal,score,contact_basis) VALUES (?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING').bind(p.id,p.company,p.market,p.niche,p.evidence_state,p.source_url,p.checked_at,p.signal,p.score,p.contact_basis);
    const result=await stmt.run();
    if(!result.meta?.changes) return json({error:'prospect_id_exists'},409);
    return json({id:p.id,evidence_state:p.evidence_state},201);
   }
   const match=url.pathname.match(/^\/v1\/prospects\/([A-Za-z0-9_-]{3,80})(\/decision|\/approve)?$/);
   if(match){
    const p=await get(env.DB,match[1]);
    if(!p)return json({error:'not_found'},404);
    if(match[2]==='/decision'&&req.method==='GET'){
     const approval=await env.DB.prepare('SELECT prospect_id FROM approvals WHERE prospect_id=?').bind(p.id).first();
     return json({prospect_id:p.id,...decide(p,Boolean(approval))});
    }
    if(match[2]==='/approve'&&req.method==='POST'){
     // Approval is an explicit operator assertion authenticated by API key; NOT an independent identity proof.
     const body=await req.json();
     if(typeof body.reviewer!=='string'||body.reviewer.trim().length<3||typeof body.rationale!=='string'||body.rationale.trim().length<8)return json({error:'approval_metadata_required'},400);
     if(decide(p).action!=='HUMAN_APPROVAL') return json({error:'decision_gate_blocked',decision:decide(p)},409);
     const approved_at=new Date().toISOString();
     await env.DB.prepare("INSERT INTO approvals(prospect_id,reviewer,approved_at,approved_action,rationale) VALUES (?,?,?,'MANUAL_CONTACT',?) ON CONFLICT(prospect_id) DO NOTHING").bind(p.id,body.reviewer.trim(),approved_at,body.rationale.trim()).run();
     return json({prospect_id:p.id,action:'MANUAL_CONTACT_ONLY'});
    }
    if(!match[2]&&req.method==='GET')return json(p);
   }
   if(url.pathname==='/v1/events'&&req.method==='POST'){
    const e=validateEvent(await req.json());
    if(!await get(env.DB,e.prospect_id))return json({error:'prospect_not_found'},404);
    const existing=await env.DB.prepare('SELECT id,prospect_id,event_type,occurred_at,amount_usd,external_ref FROM revenue_events WHERE id=?').bind(e.id).first();
    if(existing) return JSON.stringify(existing)===JSON.stringify(e)?json({id:e.id,duplicate:true}):json({error:'event_id_conflict'},409);
    // Events are user-reported, not causal proof. No automatic sending or CRM writes.
    await env.DB.prepare('INSERT INTO revenue_events(id,prospect_id,event_type,occurred_at,amount_usd,external_ref) VALUES (?,?,?,?,?,?)').bind(e.id,e.prospect_id,e.event_type,e.occurred_at,e.amount_usd,e.external_ref).run();
    const crm=await new NoopCrmAdapter().logActivity(e);
    return json({id:e.id,crm:crm.status},201);
   }
   if(url.pathname==='/v1/revenue/summary'&&req.method==='GET'){
    const x=await env.DB.prepare("SELECT COUNT(DISTINCT prospect_id) prospects_with_events, SUM(CASE WHEN event_type='won' THEN COALESCE(amount_usd,0) ELSE 0 END) reported_won_revenue_usd FROM revenue_events").first();
    return json({prospects_with_events:x.prospects_with_events,reported_won_revenue_usd:x.reported_won_revenue_usd??0,attribution:'reported_only_not_causal'});
   }
   return json({error:'not_found'},404);
  } catch(e){
   if(e instanceof SyntaxError) return json({error:'invalid_json'},400);
   if(e instanceof Error && /^(invalid_|missing_|evidence_required)/.test(e.message))return json({error:e.message},400);
   return json({error:'internal_error'},500);
  }
 }
};
