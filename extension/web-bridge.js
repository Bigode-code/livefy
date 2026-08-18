/* global chrome, location, window */
(()=>{
  const allowedOrigins=new Set(['https://livefy-tau.vercel.app','http://127.0.0.1:3000','http://127.0.0.1:4173']);
  const commands=new Set(['GET_AGENT_STATUS','GET_PREPARATION_STATE','GET_PLAYBACK_STATE','PREPARE_SESSION','PLAY','PAUSE','STOP','SEEK','NEXT','PREVIOUS','SET_VOLUME']);
  if(!allowedOrigins.has(location.origin))return;
  window.addEventListener('message',event=>{
    const request=event.data;if(event.source!==window||event.origin!==location.origin||request?.channel!=='livefy:web-to-extension'||typeof request.requestId!=='string')return;
    const run=request.type==='GET_EXTENSION_STATE'?chrome.runtime.sendMessage({type:'GET_WEB_STATE'}):commands.has(request.command)?chrome.runtime.sendMessage({type:'AGENT_COMMAND',command:request.command,payload:request.payload||{},timeoutMs:request.timeoutMs}):Promise.resolve({ok:false,error:'Command is not allowed.'});
    run.then(response=>window.postMessage({channel:'livefy:extension-to-web',requestId:request.requestId,...response},location.origin)).catch(error=>window.postMessage({channel:'livefy:extension-to-web',requestId:request.requestId,ok:false,error:error instanceof Error?error.message:'Extension bridge failed.'},location.origin));
  });
  window.postMessage({channel:'livefy:extension-to-web',type:'READY'},location.origin);
})();
