/* global chrome, LivefyBridge, document, navigator, window */
const byId=id=>document.getElementById(id);
LivefyBridge.localizePage();
const msg=(key,fallback)=>chrome.i18n.getMessage(key)||fallback;
const send=message=>chrome.runtime.sendMessage(message).then(result=>{if(!result?.ok)throw new Error(result?.error||'Extension request failed.');return result.data});
const formatTime=value=>value?new Intl.RelativeTimeFormat(undefined,{numeric:'auto'}).format(-Math.max(0,Math.round((Date.now()-new Date(value).getTime())/60000)),'minute'):msg('never','Never');
async function render(){
  const state=await send({type:'GET_STATE'});byId('loading').hidden=true;const paired=Boolean(state.deviceId);byId('pair-panel').hidden=paired;byId('connected-panel').hidden=!paired;
  if(!paired){byId('device-name').value=state.deviceName||`${navigator.platform||'Chrome'} browser`;return}
  byId('capture').checked=Boolean(state.captureEnabled);byId('queue-count').textContent=String(state.queue?.length||0);byId('status-dot').className=`status-dot ${state.connected?'online':'offline'}`;byId('status-title').textContent=state.connected?msg('connected','Connected'):msg('connectionInterrupted','Connection interrupted');byId('status-detail').textContent=state.connected?`${msg('lastSync','Last sync')} ${formatTime(state.lastSeenAt)}`:msg('eventsRemainQueued','Events remain queued locally.');byId('error').hidden=!state.lastError;byId('error').textContent=state.lastError||'';
}
byId('pair-code').addEventListener('input',event=>{event.target.value=LivefyBridge.normalizeCode(event.target.value)});
byId('pair').addEventListener('click',async()=>{const button=byId('pair');button.disabled=true;button.textContent=msg('connecting','Connecting…');byId('pair-error').hidden=true;try{await send({type:'PAIR',code:byId('pair-code').value,name:byId('device-name').value,consent:byId('consent').checked});await render()}catch(error){byId('pair-error').hidden=false;byId('pair-error').textContent=error.message}finally{button.disabled=false;button.textContent=msg('connectButton','Connect browser')}});
byId('capture').addEventListener('change',async event=>{await send({type:'SET_CAPTURE',enabled:event.target.checked});await render()});
byId('retry').addEventListener('click',async()=>{await send({type:'RETRY'});await render()});
byId('disconnect').addEventListener('click',async()=>{if(window.confirm(msg('disconnectConfirm','Disconnect this browser from Livefy?'))){await send({type:'DISCONNECT'});await render()}});
byId('dashboard').addEventListener('click',async()=>{const state=await send({type:'GET_STATE'});await chrome.tabs.create({url:state.dashboardUrl||LivefyBridge.DASHBOARD_DEFAULT})});
byId('options').addEventListener('click',()=>chrome.runtime.openOptionsPage());
void render().catch(error=>{byId('loading').textContent=error.message});
