import assert from 'node:assert/strict';
import worker,{handleEnrich} from './cloudflare/worker.mjs';
const env={ENRICH_ACCESS_TOKEN:'test-access',ASSETS:{fetch:async()=>new Response('asset')}};
let response=await worker.fetch(new Request('https://example.com/'),env);assert.equal(await response.text(),'asset');
response=await handleEnrich(new Request('https://example.com/api/enrich',{method:'POST',body:'{}'}),env);assert.equal(response.status,401);
response=await handleEnrich(new Request('https://example.com/api/enrich',{method:'POST',headers:{'x-enrich-token':'test-access'},body:'{"items":[{"text":"Delegate","translation":"代表"}]}'}),env,{enrich:async(items,options)=>{assert.equal(options.config,undefined);return items;}});assert.equal(response.status,200);assert.equal((await response.json()).items[0].translation,'代表');
response=await handleEnrich(new Request('https://example.com/api/enrich',{method:'POST',headers:{'x-enrich-token':'test-access'},body:'invalid'}),env);assert.equal(response.status,400);
console.log('PASS: Cloudflare assets, protected API, enrichment and malformed input.');
