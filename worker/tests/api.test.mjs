import test from 'node:test';import assert from 'node:assert/strict';import worker from '../src/index.mjs';
const request=(url,headers={})=>new Request('https://api.example.test'+url,{headers});
test('health route has no secrets',async()=>{const r=await worker.fetch(request('/health'),{});assert.equal(r.status,200);assert.equal((await r.json()).storage,'missing');});
test('unauthenticated rejected',async()=>{const r=await worker.fetch(request('/v1/revenue/summary'),{API_KEY:'test_secret'});assert.equal(r.status,401);});
test('database required',async()=>{const r=await worker.fetch(request('/v1/revenue/summary',{'X-Revenue-API-Key':'test_secret'}),{API_KEY:'test_secret'});assert.equal(r.status,503);});
