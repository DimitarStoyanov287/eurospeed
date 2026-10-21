/** Deploy as a web app: Execute as Me (d.stoyanov@eu-speed.com), access Anyone.
 * Set Script Property MAIL_WEBHOOK_SECRET to the key shown in the admin mail setup.
 * No real email is sent by merely saving/deploying this project.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return result_({ok:false,error:'busy'});
  try {
    var props=PropertiesService.getScriptProperties();
    var secret=props.getProperty('MAIL_WEBHOOK_SECRET');
    if (!secret) return result_({ok:false,error:'configuration_missing'});
    if (!e || !e.postData || e.postData.contents.length>50000) return result_({ok:false,error:'invalid_payload'});
    var envelope=JSON.parse(e.postData.contents);
    if (typeof envelope.payload!=='string'||typeof envelope.signature!=='string') return result_({ok:false,error:'invalid_payload'});
    var expected=Utilities.computeHmacSha256Signature(envelope.payload,secret).map(function(b){return ('0'+((b+256)%256).toString(16)).slice(-2)}).join('');
    if (!equal_(expected,envelope.signature)) return result_({ok:false,error:'unauthorized'});
    var p=JSON.parse(envelope.payload);
    if (!p.id || !/^[a-f0-9-]{36}:(owner|candidate)$/.test(p.id) || !['owner','candidate'].includes(p.kind) || !p.id.endsWith(':'+p.kind) || typeof p.to!=='string' || !/^[^\s,;<>@]+@[^\s,;<>@]+\.[^\s,;<>@]+$/.test(p.to) || p.to.length>254 || typeof p.subject!=='string'||p.subject.length>250 || /[\r\n]/.test(p.subject) || typeof p.body!=='string'||p.body.length>20000 || typeof p.timestamp!=='number'||Math.abs(Date.now()-p.timestamp)>300000) return result_({ok:false,error:'invalid_payload'});
    var sender='d.stoyanov@eu-speed.com';
    if (Session.getEffectiveUser().getEmail().toLowerCase()!==sender) return result_({ok:false,error:'wrong_sender'});
    if (p.kind==='owner'&&p.to.toLowerCase()!==sender) return result_({ok:false,error:'invalid_payload'});
    var key='mail:'+p.id;
    var previous=props.getProperty(key);
    if(previous){var saved=JSON.parse(previous);return result_({ok:saved.state==='sent',id:p.id,state:saved.state==='sent'?'sent':'uncertain'});}
    if(MailApp.getRemainingDailyQuota()<1)return result_({ok:false,error:'quota_exceeded'});
    props.setProperty(key,JSON.stringify({state:'sending',at:Date.now()}));
    try {
      MailApp.sendEmail({to:p.to,subject:p.subject,body:p.body,name:'Димитър Стоянов | EUROSPEED',replyTo:sender});
      props.setProperty(key,JSON.stringify({state:'sent',at:Date.now()}));
      return result_({ok:true,id:p.id,state:'sent'});
    } catch(err) {
      props.setProperty(key,JSON.stringify({state:'uncertain',at:Date.now()}));
      return result_({ok:false,id:p.id,state:'uncertain',error:'delivery_uncertain'});
    }
  } catch(err) {return result_({ok:false,error:'invalid_payload'});}
  finally {lock.releaseLock();}
}
function equal_(a,b){if(a.length!==b.length)return false;var d=0;for(var i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function result_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
/** Optional: run manually to clear only successful delivery markers older than 90 days.
 * Leave uncertain markers until checked against Sent mail. Do not retry old jobs after cleanup.
 */
function cleanupSentMarkers(){var props=PropertiesService.getScriptProperties(),all=props.getProperties();Object.keys(all).forEach(function(k){if(!k.startsWith('mail:'))return;var v=JSON.parse(all[k]);if(v.state==='sent'&&v.at<Date.now()-90*86400000)props.deleteProperty(k);});}
