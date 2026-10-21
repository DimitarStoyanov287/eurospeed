import {createHmac,timingSafeEqual} from 'node:crypto';
const owner='d.stoyanov@eu-speed.com';
const email=s=>typeof s==='string'&&s.length<=254&&/^[^\s,;<>@]+@[^\s,;<>@]+\.[^\s,;<>@]+$/.test(s);
export function makeHandler({env,sendMail,now=Date.now}){
 return async(req,res)=>{
  const reply=(status,body)=>res.status(status).json(body);
  if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
  if(!env.SMTP_PASS||!env.MAIL_WEBHOOK_SECRET||env.SMTP_USER!==owner)return reply(503,{error:'configuration_missing'});
  let data;
  try{
   const {payload,signature}=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
   if(typeof payload!=='string'||payload.length>30000||typeof signature!=='string'||!/^[a-f0-9]{64}$/.test(signature))throw Error();
   const expected=createHmac('sha256',env.MAIL_WEBHOOK_SECRET).update(payload).digest();
   if(!timingSafeEqual(expected,Buffer.from(signature,'hex')))return reply(401,{error:'unauthorized'});
   data=JSON.parse(payload);
   if(!Number.isFinite(data.timestamp)||Math.abs(now()-data.timestamp)>300000)return reply(401,{error:'unauthorized'});
   if(!/^[a-f0-9-]{36}:(owner|candidate|invite)$/.test(data.id)||!['owner','candidate','invite'].includes(data.kind)||!data.id.endsWith(':'+data.kind)||!email(data.to)||(data.kind==='owner'&&data.to!==owner)||typeof data.subject!=='string'||data.subject.length>300||/[\r\n]/.test(data.subject)||typeof data.body!=='string'||data.body.length>25000)throw Error();
  }catch{return reply(400,{error:'invalid_payload'});}
  try{
   const result=await sendMail({from:{name:'Димитър Стоянов | EUROSPEED',address:owner},to:data.to,replyTo:owner,subject:data.subject,text:data.body,messageId:`<${data.id.replace(':','.') }@eu-speed.com>`,disableFileAccess:true,disableUrlAccess:true});
   if(!result.accepted?.some(value=>String(value).toLowerCase()===data.to.toLowerCase()))return reply(502,{error:'smtp_rejected'});
   return reply(200,{ok:true,id:data.id});
  }catch(error){
   if(error.code==='EAUTH')return reply(502,{error:'smtp_authentication_failed'});
   if(error.responseCode>=400&&error.responseCode<600)return reply(502,{error:'smtp_rejected'});
   return reply(502,{state:'uncertain',error:'delivery_uncertain_check_sent_mail'});
  }
 };
}
