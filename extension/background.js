/* global chrome, importScripts, LivefyBridge, fetch */
importScripts('shared.js');

const DEFAULT_STATE={apiBase:LivefyBridge.API_DEFAULT,dashboardUrl:LivefyBridge.DASHBOARD_DEFAULT,captureEnabled:false,connected:false,lastError:'',lastSeenAt:null,pageHost:'',pageType:'',queue:[],recentEvents:[],viewerCount:0,sessionStartedAt:null,sessionStatus:'idle'};
let flushing=false;

async function state(){return{...DEFAULT_STATE,...await chrome.storage.local.get(Object.keys(DEFAULT_STATE)),...await chrome.storage.local.get(['deviceId','deviceSecret','deviceName'])}}
async function patch(values){await chrome.storage.local.set(values);return state()}
async function api(payload){
  const current=await state();const response=await fetch(current.apiBase,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const body=await response.json().catch(()=>({error:'Invalid bridge response.'}));if(!response.ok||!body.ok)throw new Error(body.error||'Livefy bridge request failed.');return body.data;
}
async function pair({code,name,consent}){
  if(!consent)throw new Error('You must accept the data disclosure before connecting.');
  const data=await api({action:'pair',code:LivefyBridge.normalizeCode(code),name:String(name||'Chrome').trim().slice(0,80),version:chrome.runtime.getManifest().version});
  await patch({deviceId:data.device_id,deviceSecret:data.device_secret,deviceName:String(name||'Chrome').trim(),connected:true,captureEnabled:false,sessionStatus:'idle',sessionStartedAt:null,recentEvents:[],viewerCount:0,lastError:'',lastSeenAt:new Date().toISOString()});
  await heartbeat();return state();
}
async function heartbeat(){
  const current=await state();if(!current.deviceId||!current.deviceSecret)return current;
  try{await api({action:'heartbeat',device_id:current.deviceId,device_secret:current.deviceSecret,page_host:current.pageHost,page_type:current.pageType,version:chrome.runtime.getManifest().version});return patch({connected:true,lastError:'',lastSeenAt:new Date().toISOString()})}
  catch(error){return patch({connected:false,lastError:error instanceof Error?error.message:'Heartbeat failed.'})}
}
async function enqueue(events){
  const current=await state();if(!current.captureEnabled||!current.deviceId)return current;
  const queue=[...current.queue,...events].slice(-500);const recentEvents=[...current.recentEvents,...events].slice(-100);const metric=[...events].reverse().find(event=>event.type==='live_metrics');const pageType=events.at(-1)?.page_type||current.pageType;const isLive=pageType==='live-room'||pageType==='live-center';await patch({queue,recentEvents,viewerCount:metric?.viewers??current.viewerCount,pageHost:events.at(-1)?.page_host||current.pageHost,pageType,sessionStartedAt:current.sessionStartedAt||(isLive?new Date().toISOString():null),sessionStatus:isLive?'live':current.sessionStatus});void flush();return state();
}
async function flush(){
  if(flushing)return;flushing=true;
  let continueFlush=false;
  try{const current=await state();if(!current.deviceId||!current.deviceSecret||!current.captureEnabled||!current.queue.length)return;const batch=current.queue.slice(0,64);await api({action:'events',device_id:current.deviceId,device_secret:current.deviceSecret,events:batch});await patch({queue:current.queue.slice(batch.length),connected:true,lastError:'',lastSeenAt:new Date().toISOString()});continueFlush=(await state()).queue.length>0}
  catch(error){await patch({connected:false,lastError:error instanceof Error?error.message:'Could not send captured events.'})}
  finally{flushing=false;if(continueFlush)void flush()}
}

async function configure(){const current=await chrome.storage.local.get(Object.keys(DEFAULT_STATE));await chrome.storage.local.set({...DEFAULT_STATE,...current});await chrome.alarms.create('livefy-heartbeat',{periodInMinutes:1});await chrome.alarms.create('livefy-flush',{periodInMinutes:1});await chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true})}
chrome.runtime.onInstalled.addListener(()=>{void configure()});
void chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true});
chrome.runtime.onStartup.addListener(()=>{void heartbeat();void flush()});
chrome.alarms.onAlarm.addListener(alarm=>{if(alarm.name==='livefy-heartbeat')void heartbeat();if(alarm.name==='livefy-flush')void flush()});
chrome.runtime.onMessage.addListener((message,_sender,sendResponse)=>{
  const run=async()=>{switch(message?.type){case'GET_STATE':return state();case'PAIR':return pair(message);case'DISCONNECT':await chrome.storage.local.remove(['deviceId','deviceSecret','deviceName']);return patch({connected:false,captureEnabled:false,queue:[],recentEvents:[],viewerCount:0,sessionStartedAt:null,sessionStatus:'idle',lastError:'',lastSeenAt:null});case'SET_CAPTURE':return patch({captureEnabled:Boolean(message.enabled),sessionStatus:message.enabled?'live':'paused',sessionStartedAt:message.enabled?(await state()).sessionStartedAt||new Date().toISOString():(await state()).sessionStartedAt});case'START_SESSION':return patch({captureEnabled:true,sessionStatus:'live',sessionStartedAt:(await state()).sessionStartedAt||new Date().toISOString()});case'PAUSE_SESSION':return patch({captureEnabled:false,sessionStatus:'paused'});case'END_SESSION':return patch({captureEnabled:false,sessionStatus:'ended',sessionStartedAt:null});case'CLEAR_SESSION_EVENTS':return patch({recentEvents:[],viewerCount:0});case'BRIDGE_EVENTS':return enqueue(Array.isArray(message.events)?message.events.slice(0,64):[]);case'SAVE_OPTIONS':{const apiBase=String(message.apiBase||'').trim();const dashboardUrl=String(message.dashboardUrl||'').trim();if(!apiBase.startsWith('https://')&&!apiBase.startsWith('http://127.0.0.1'))throw new Error('Bridge URL must use HTTPS.');return patch({apiBase,dashboardUrl})}case'RETRY':await heartbeat();await flush();return state();default:throw new Error('Unknown extension message.')}};
  run().then(value=>sendResponse({ok:true,data:value})).catch(error=>sendResponse({ok:false,error:error instanceof Error?error.message:'Extension error.'}));return true;
});
