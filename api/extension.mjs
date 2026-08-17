/* global process, fetch, Buffer */
const ALLOWED_WEB_ORIGINS=new Set(['https://livefy-tau.vercel.app','http://127.0.0.1:3000','http://localhost:3000']);
const CHROME_ORIGIN=/^chrome-extension:\/\/[a-p]{32}$/;
const MAX_BODY_BYTES=160_000;

function allowedOrigin(value=''){return ALLOWED_WEB_ORIGINS.has(value)||CHROME_ORIGIN.test(value)}
function cors(request,response){
  const origin=String(request.headers.origin||'');
  if(allowedOrigin(origin))response.setHeader('Access-Control-Allow-Origin',origin);
  response.setHeader('Vary','Origin');
  response.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers','Content-Type');
  response.setHeader('Access-Control-Max-Age','86400');
}
function json(response,status,payload){response.status(status).setHeader('Content-Type','application/json; charset=utf-8').send(JSON.stringify(payload))}
function clean(value,max=120){return typeof value==='string'?value.trim().slice(0,max):''}
function credentials(body){
  const deviceId=clean(body?.device_id,40);const secret=clean(body?.device_secret,80);
  if(!/^[0-9a-f-]{36}$/i.test(deviceId)||!/^[0-9a-f]{64}$/i.test(secret))throw Object.assign(new Error('Invalid device credentials.'),{status:401});
  return{deviceId,secret};
}
async function rpc(name,body){
  const url=process.env.VITE_SUPABASE_URL;const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)throw Object.assign(new Error('Extension bridge is not configured.'),{status:503});
  const result=await fetch(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const payload=await result.json().catch(()=>({message:'Invalid database response.'}));
  if(!result.ok)throw Object.assign(new Error(payload?.message||'Extension bridge request failed.'),{status:result.status});
  return payload;
}

export default async function handler(request,response){
  cors(request,response);response.setHeader('Cache-Control','no-store');response.setHeader('X-Content-Type-Options','nosniff');
  if(request.method==='OPTIONS')return response.status(204).send('');
  if(request.method==='GET')return json(response,200,{ok:true,service:'livefy-extension-bridge',version:1});
  if(request.method!=='POST'){response.setHeader('Allow','GET, POST, OPTIONS');return json(response,405,{ok:false,error:'Method not allowed.'})}
  const origin=String(request.headers.origin||'');
  if(origin&&!allowedOrigin(origin))return json(response,403,{ok:false,error:'Origin is not allowed.'});
  const body=request.body||{};
  if(Buffer.byteLength(JSON.stringify(body),'utf8')>MAX_BODY_BYTES)return json(response,413,{ok:false,error:'Request is too large.'});
  try{
    const action=clean(body.action,32);
    if(action==='pair'){
      const code=clean(body.code,32).toUpperCase();const name=clean(body.name,80);const version=clean(body.version,24);
      if(!/^(?:[A-Z2-9]{4}-){3}[A-Z2-9]{4}$/.test(code))return json(response,400,{ok:false,error:'Enter the 16-character pairing code shown in Livefy.'});
      const data=await rpc('claim_extension_pairing',{p_code:code,p_name:name,p_version:version,p_consent_version:'2026-08-17'});
      return json(response,200,{ok:true,data});
    }
    const{deviceId,secret}=credentials(body);
    if(action==='heartbeat'){
      const data=await rpc('extension_heartbeat_v2',{p_device_id:deviceId,p_device_secret:secret,p_page_host:clean(body.page_host,120),p_page_type:clean(body.page_type,40),p_version:clean(body.version,24),p_tiktok_logged_in:Boolean(body.tiktok_logged_in),p_tiktok_account_key:clean(body.tiktok_account_key,160),p_tiktok_username:clean(body.tiktok_username,120),p_shop_eligible:Boolean(body.shop_eligible),p_live_eligible:Boolean(body.live_eligible)});
      return json(response,200,{ok:true,data});
    }
    if(action==='events'){
      if(!Array.isArray(body.events)||body.events.length>64)return json(response,400,{ok:false,error:'Invalid event batch.'});
      const data=await rpc('ingest_extension_events',{p_device_id:deviceId,p_device_secret:secret,p_events:body.events});
      return json(response,200,{ok:true,data});
    }
    return json(response,400,{ok:false,error:'Unsupported action.'});
  }catch(error){return json(response,Number(error?.status)||500,{ok:false,error:error instanceof Error?error.message:'Unexpected extension bridge error.'})}
}
