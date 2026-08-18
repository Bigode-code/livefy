/* global chrome, document, window, navigator, LivefyBridge */
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const send=message=>new Promise((resolve,reject)=>{
  try{
    chrome.runtime.sendMessage(message,result=>{
      const runtimeError=chrome.runtime.lastError;
      if(runtimeError){reject(new Error(runtimeError.message));return}
      if(!result?.ok){reject(new Error(result?.error||'Extension request failed.'));return}
      resolve(result.data);
    });
  }catch(error){reject(error)}
});
const message=(key,fallback)=>chrome.i18n.getMessage(key)||fallback;
const icon=id=>`<svg aria-hidden="true"><use href="#${id}"/></svg>`;
let currentState=null;

function localize(){for(const node of $$('[data-msg]')){const value=message(node.dataset.msg,node.textContent);if(value)node.textContent=value}}
function compact(value){return new Intl.NumberFormat(undefined,{notation:value>=10000?'compact':'standard',maximumFractionDigits:1}).format(value||0)}
function relative(value){if(!value)return'—';const seconds=Math.max(0,Math.round((Date.now()-new Date(value).getTime())/1000));if(seconds<60)return`${seconds}s`;if(seconds<3600)return`${Math.floor(seconds/60)}m`;return`${Math.floor(seconds/3600)}h`}
function duration(value){const elapsed=value?Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000)):0;return{hours:String(Math.floor(elapsed/3600)).padStart(2,'0'),minutes:String(Math.floor(elapsed%3600/60)).padStart(2,'0'),seconds:String(elapsed%60).padStart(2,'0')}}
function eventTime(event){return new Date(event.captured_at||Date.now()).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function escape(value){const node=document.createElement('span');node.textContent=String(value||'');return node.innerHTML}
function eventTitle(event){if(event.type==='comment')return event.author||message('viewerFallback','TikTok viewer');if(event.type==='product')return event.name||message('productFallback','TikTok product');if(event.type==='live_metrics')return message('audienceUpdated','Audience updated');return message('pageDetected','TikTok page detected')}
function eventDetail(event){if(event.type==='comment')return event.body;if(event.type==='product')return event.price?new Intl.NumberFormat(undefined,{style:'currency',currency:event.currency||'BRL'}).format(event.price):message('productDetected','Product detected');if(event.type==='live_metrics')return`${compact(event.viewers)} ${message('viewers','viewers').toLowerCase()}`;return event.message||event.page_type||''}
function empty(iconId,title,detail){return`<div class="empty-stream">${icon(iconId)}<b>${escape(title)}</b><span>${escape(detail)}</span></div>`}

function renderEvents(events){
  const activity=[...events].reverse().slice(0,8);$('#activity-list').innerHTML=activity.length?activity.map((event,index)=>`<article class="activity-item" style="--index:${index}"><span class="event-icon">${icon(event.type==='product'?'i-bag':event.type==='comment'?'i-message':'i-notification')}</span><div><b>${escape(eventTitle(event))}</b><span>${escape(eventDetail(event))}</span></div><time>${eventTime(event)}</time></article>`).join(''):empty('i-notification',message('waitingActivity','Waiting for activity'),message('waitingActivityHint','Visible TikTok LIVE events will appear here.'));
  const products=[...new Map(events.filter(event=>event.type==='product').map(event=>[event.product_id||event.name,event])).values()].reverse().slice(0,6);$('#product-list').innerHTML=products.length?products.map((event,index)=>`<article class="product-item" style="--index:${index}"><span class="event-icon">${icon('i-bag')}</span><div><b>${escape(event.name)}</b><span>${escape(eventDetail(event))}</span></div><time>${eventTime(event)}</time></article>`).join(''):empty('i-bag',message('noProducts','No products detected'),message('noProductsHint','Product cards visible in TikTok LIVE will appear here.'));
  const comments=[...events].reverse().filter(event=>event.type==='comment').slice(0,30);$('#comment-list').innerHTML=comments.length?comments.map((event,index)=>`<article class="comment-item" style="--index:${index}"><span class="comment-avatar">${escape((event.author||'T').slice(0,2).toUpperCase())}</span><div><b>${escape(event.author||message('viewerFallback','TikTok viewer'))}</b><span>${escape(event.body)}</span></div></article>`).join(''):empty('i-message',message('noComments','No comments captured'),message('noCommentsHint','Visible comments from the connected LIVE will appear here.'));
}

function render(state){
  currentState=state;const paired=Boolean(state.deviceId);const enabled=paired&&Boolean(state.controllerEnabled)&&Boolean(state.tiktokLoggedIn)&&(state.shopEligible||state.liveEligible);$('#unpaired').hidden=paired;$('#eligibility-gate').hidden=!paired||enabled;$('#controller').hidden=!enabled;$('#connection-dot').className=enabled?'online':'';$('#connection-label').textContent=enabled?message('connected','Connected'):paired?message('accountRequired','Account required'):message('notPaired','Not paired');if(!paired){if(!$('#pair-device-name').value)$('#pair-device-name').value=state.deviceName||`${navigator.platform||'Chrome'} browser`;return}if(!enabled){$('#eligibility-title').textContent=state.tiktokLoggedIn?message('accountNotEligible','Account not eligible'):message('signInTikTok','Sign in to TikTok');$('#eligibility-detail').textContent=state.lastError||(!state.tiktokLoggedIn?message('signInTikTokHint','Open TikTok and sign in. The controller remains off until the login is detected.'):message('eligibilityHint','This account needs TikTok Shop or LIVE access before the controller can be enabled.'));return}
  const events=Array.isArray(state.recentEvents)?state.recentEvents:[];const comments=events.filter(event=>event.type==='comment');const products=new Set(events.filter(event=>event.type==='product').map(event=>event.product_id||event.name));const live=state.sessionStatus==='live'&&state.captureEnabled;const paused=state.sessionStatus==='paused';const stateNode=$('.live-state');stateNode.className=`live-state ${live?'live':paused?'paused':''}`;$('#session-label').textContent=live?message('monitoring','Monitoring'):paused?message('paused','Paused'):message('ready','Ready');$('#viewer-count').textContent=compact(state.viewerCount);$('#comment-count').textContent=compact(comments.length);$('#product-count').textContent=compact(products.size);$('#event-total').textContent=String(events.length);$('#manager-queue').textContent=String(state.queue?.length||0);$('#manager-sync').textContent=relative(state.lastSeenAt);$('#page-type').textContent=state.pageType||'—';$('#page-host').textContent=state.pageHost||'—';const primary=$('#session-primary');primary.querySelector('use').setAttribute('href',live?'#i-pause':'#i-play');primary.querySelector('span').textContent=live?message('pauseMonitoring','Pause monitoring'):paused?message('resumeMonitoring','Resume monitoring'):message('startMonitoring','Start monitoring');$('#end-session').hidden=!(live||paused);renderEvents(events);renderClock();
}
function renderClock(){if(!currentState)return;const value=duration(currentState.sessionStartedAt);$('#clock-hours').textContent=value.hours;$('#clock-minutes').textContent=value.minutes;$('#clock-seconds').textContent=value.seconds}
function showFatal(error){const label=$('#connection-label');if(label)label.textContent=`Erro: ${error instanceof Error?error.message:String(error)}`;const unpaired=$('#unpaired');if(unpaired)unpaired.hidden=false}
async function refresh(){try{render(await send({type:'GET_STATE'}))}catch(error){showFatal(error)}}
function openUrl(url){return chrome.tabs.create({url})}

for(const tab of $$('.tab'))tab.addEventListener('click',()=>{for(const item of $$('.tab'))item.classList.toggle('active',item===tab);for(const panel of $$('.tab-panel'))panel.classList.toggle('active',panel.dataset.panel===tab.dataset.tab)});
$('#session-primary').addEventListener('click',async()=>{const live=currentState?.sessionStatus==='live'&&currentState?.captureEnabled;render(await send({type:live?'PAUSE_SESSION':'START_SESSION'}))});
$('#end-session').addEventListener('click',async()=>{if(window.confirm(message('endMonitoringConfirm','End this Livefy monitoring session?'))){render(await send({type:'END_SESSION'}))}});
$('#clear-events').addEventListener('click',async()=>render(await send({type:'CLEAR_SESSION_EVENTS'})));
$('#pair-code').addEventListener('input',event=>{event.target.value=LivefyBridge.normalizeCode(event.target.value)});
$('#pair-browser').addEventListener('click',async()=>{const button=$('#pair-browser');button.disabled=true;button.textContent=message('connecting','Connecting…');$('#pair-error').hidden=true;try{render(await send({type:'PAIR',code:$('#pair-code').value,name:$('#pair-device-name').value,consent:$('#pair-consent').checked}))}catch(error){$('#pair-error').hidden=false;$('#pair-error').textContent=error.message}finally{button.disabled=false;button.textContent=message('connectButton','Connect browser')}});
$('#eligibility-retry').addEventListener('click',async()=>render(await send({type:'RETRY'})));
$('#open-pairing').addEventListener('click',()=>openUrl('https://livefy-tau.vercel.app/#settings'));
$('#open-dashboard').addEventListener('click',()=>openUrl(currentState?.dashboardUrl||'https://livefy-tau.vercel.app'));
$('#open-options').addEventListener('click',()=>chrome.runtime.openOptionsPage());
window.addEventListener('error',event=>showFatal(event.error||event.message));
window.addEventListener('unhandledrejection',event=>showFatal(event.reason));
chrome.storage.onChanged.addListener(()=>{void refresh()});
try{localize();void refresh();window.setInterval(renderClock,1000);window.setInterval(()=>{void refresh()},5000)}catch(error){showFatal(error)}
