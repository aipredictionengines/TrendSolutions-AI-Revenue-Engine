import Ajv from 'ajv';
import leadSchema from '../schemas/lead.schema.json';
import { decide } from './decision.js';
import { createCrmAdapter } from './crm.js';
const ajv=new Ajv({allErrors:true,strict:false});
// JSON Schema format validation is deliberately limited to core types in this build.
const valid=ajv.compile(leadSchema);
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json','cache-control':'no-store'}});
async function keyFor(source,id){const bytes=new TextEncoder().encode(source+'|'+id);const hash=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(request.method==='GET'&&url.pathname==='/health') return json({ok:true,service:'revenue-core',version:'0.1.0'});
 if(url.pathname!=='/v1/leads')return json({error:'not_found'},404);
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 if(!env.INGEST_API_KEY)return json({error:'server_not_configured'},503);
 if(request.headers.get('authorization')!=='Bearer '+env.INGEST_API_KEY)return json({error:'unauthorized'},401);
 if(Number(request.headers.get('content-length')||0)>16384)return json({error:'payload_too_large'},413);
 let body;try{const raw=await request.text();if(raw.length>16384)return json({error:'payload_too_large'},413);body=JSON.parse(raw);}catch{return json({error:'invalid_json'},400);}
 if(!valid(body))return json({error:'invalid_lead',details:valid.errors?.map(e=>({path:e.instancePath,keyword:e.keyword}))},422);
 const id=await keyFor(body.source,body.external_id), decision=decide(body);
 try {
  const result=await env.DB.prepare('INSERT OR IGNORE INTO leads(id,source,external_id,contact_json,requirements_json,consent_json,decision_json) VALUES (?,?,?,?,?,?,?)')
   .bind(id,body.source,body.external_id,JSON.stringify(body.contact),JSON.stringify(body.requirements),JSON.stringify(body.consent||null),JSON.stringify(decision)).run();
  if(result.meta.changes===0)return json({id,duplicate:true,status:'EXISTS'},200);
  await env.DB.prepare('INSERT INTO audit_events(lead_id,event_type,payload_json) VALUES(?,?,?)').bind(id,'LEAD_CAPTURED',JSON.stringify({decision:decision.action,source:body.source})).run();
  const crm=await createCrmAdapter().prepare({id},decision);
  return json({id,duplicate:false,decision,crm},201);
 } catch {return json({error:'storage_unavailable'},503);}
}};
