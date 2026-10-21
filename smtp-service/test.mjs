import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {makeHandler} from './src/handler.js';
const env={SMTP_USER:'d.stoyanov@eu-speed.com',SMTP_PASS:'test-only',MAIL_WEBHOOK_SECRET:'test-signing-key'};
const data={id:'00000000-0000-4000-8000-000000000000:candidate',kind:'candidate',to:'candidate@example.com',subject:'Thanks',body:'Received',timestamp:Date.now()};
async function call(options={},changes={}){
 let result;let sends=0;
 const handler=makeHandler({env,sendMail:async m=>{sends++;assert.equal(m.from.address,env.SMTP_USER);if(options.error)throw options.error;return {accepted:[m.to]}}});
 const payload=JSON.stringify({...data,...changes});
 await handler({method:'POST',body:{payload,signature:options.signature||createHmac('sha256',env.MAIL_WEBHOOK_SECRET).update(payload).digest('hex')}},{status(status){return {json(body){result={status,...body}}}}});
 return {...result,sends};
}
test('signed candidate mail sends from fixed owner',async()=>{const r=await call();assert.equal(r.ok,true);assert.equal(r.sends,1)});
test('rejects forged requests, old requests, wrong owner and injected headers',async()=>{
 for(const [opts,changes] of [[{signature:'0'.repeat(64)},{}],[{}, {timestamp:Date.now()-360000}],[{}, {kind:'owner',id:data.id.replace('candidate','owner')}],[{}, {subject:'Hi\r\nBcc: other@example.com'}]]){const r=await call(opts,changes);assert.ok(r.status>=400);assert.equal(r.sends,0)}
});
test('ambiguous failures never claim success',async()=>{const r=await call({error:{code:'ETIMEDOUT'}});assert.equal(r.state,'uncertain')});
test('auth failure is explicit and contains no password',async()=>{const r=await call({error:{code:'EAUTH',message:'secret server response'}});assert.equal(r.error,'smtp_authentication_failed');assert.ok(!JSON.stringify(r).includes('secret server response'))});

test('accepts signed invitation mail',async()=>{const r=await call({}, {id:data.id.replace('candidate','invite'),kind:'invite'});assert.equal(r.ok,true);assert.equal(r.sends,1)});
