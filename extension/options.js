/* global chrome, document, LivefyBridge, URL */
LivefyBridge.localizePage();
const optionSend=message=>chrome.runtime.sendMessage(message).then(result=>{if(!result?.ok)throw new Error(result?.error||'Extension request failed.');return result.data});
async function load(){const state=await optionSend({type:'GET_STATE'});document.getElementById('api-base').value=state.apiBase;document.getElementById('dashboard-url').value=state.dashboardUrl}
document.getElementById('save-options').addEventListener('click',async()=>{const message=document.getElementById('options-message');try{const apiBase=document.getElementById('api-base').value;const origin=`${new URL(apiBase).origin}/*`;const granted=await chrome.permissions.request({origins:[origin]});if(!granted)throw new Error('Permission for this bridge origin was not granted.');await optionSend({type:'SAVE_OPTIONS',apiBase,dashboardUrl:document.getElementById('dashboard-url').value});message.textContent=chrome.i18n.getMessage('settingsSaved')||'Settings saved.';message.hidden=false}catch(error){message.textContent=error.message;message.hidden=false}});
void load();
