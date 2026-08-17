/* global process, fetch */
const API_BASE='https://api.unifically.com/v1';

function json(response,status,payload){
  response.status(status).setHeader('Content-Type','application/json; charset=utf-8').send(JSON.stringify(payload));
}

async function authenticate(request){
  const authorization=request.headers.authorization||'';
  if(!authorization.startsWith('Bearer '))return false;
  const url=process.env.VITE_SUPABASE_URL;
  const key=process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return false;
  const result=await fetch(`${url}/auth/v1/user`,{headers:{Authorization:authorization,apikey:key}});
  return result.ok;
}

async function callUnifically(path,options={}){
  const apiKey=process.env.UNIFICALLY_API_KEY;
  if(!apiKey){
    const error=new Error('UNIFICALLY_API_KEY is not configured on the server.');
    error.status=503;
    throw error;
  }
  const result=await fetch(`${API_BASE}${path}`,{
    ...options,
    headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json',...(options.headers||{})}
  });
  const payload=await result.json().catch(()=>({success:false,data:{message:'Invalid provider response.'}}));
  if(!result.ok){
    const error=new Error(payload?.data?.message||payload?.error_message||'Unifically request failed.');
    error.status=result.status;
    throw error;
  }
  return payload;
}

export default async function handler(request,response){
  response.setHeader('Cache-Control','no-store');
  try{
    if(!await authenticate(request))return json(response,401,{success:false,error:'Authentication required.'});
    if(request.method==='GET'){
      const action=String(request.query?.action||'models');
      if(action==='models')return json(response,200,await callUnifically('/models'));
      if(action==='account')return json(response,200,await callUnifically('/account'));
      if(action==='task'){
        const taskId=String(request.query?.taskId||'');
        if(!/^[\w-]{4,200}$/.test(taskId))return json(response,400,{success:false,error:'Invalid task ID.'});
        return json(response,200,await callUnifically(`/tasks/${encodeURIComponent(taskId)}`));
      }
      return json(response,400,{success:false,error:'Unsupported action.'});
    }
    if(request.method==='POST'){
      const{model,input,callback_url}=request.body||{};
      if(typeof model!=='string'||!model.includes('/')||!input||typeof input!=='object')return json(response,400,{success:false,error:'Model and input are required.'});
      const body={model,input};
      if(typeof callback_url==='string'&&callback_url.startsWith('https://'))body.callback_url=callback_url;
      return json(response,200,await callUnifically('/tasks',{method:'POST',body:JSON.stringify(body)}));
    }
    response.setHeader('Allow','GET, POST');
    return json(response,405,{success:false,error:'Method not allowed.'});
  }catch(error){
    return json(response,Number(error?.status)||500,{success:false,error:error instanceof Error?error.message:'Unexpected server error.'});
  }
}
