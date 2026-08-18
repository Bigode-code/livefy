/* global module, setTimeout, clearTimeout */
(function(root,factory){
  const exported=factory();
  if(typeof module==='object'&&module.exports)module.exports=exported;
  else root.LivefyNativeClient=exported.LivefyNativeClient;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const HOST_NAME='com.livefy.agent';
  class LivefyNativeClient{
    constructor({connectNative,onStatus=()=>{},hostName=HOST_NAME}){this.connectNative=connectNative;this.onStatus=onStatus;this.hostName=hostName;this.port=null;this.pending=new Map();this.sequence=0}
    async connect(){if(this.port)return true;try{const port=this.connectNative(this.hostName);this.port=port;port.onMessage.addListener(message=>this.receive(message));port.onDisconnect.addListener(()=>this.disconnect('Livefy Agent is offline or the Native Messaging host is not installed.'));this.onStatus({connected:true,error:''});return true}catch(error){this.disconnect(error instanceof Error?error.message:'Could not connect to Livefy Agent.');return false}}
    async send(type,payload={},timeoutMs=10000){if(!type)throw new Error('Agent command is required.');if(!this.port&&!await this.connect())throw new Error('Livefy Agent is offline.');const id=`extension-${Date.now()}-${++this.sequence}`;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(id);reject(new Error(`Livefy Agent timed out after ${timeoutMs} ms.`))},timeoutMs);this.pending.set(id,{resolve,reject,timer});try{this.port.postMessage({id,type,payload})}catch(error){clearTimeout(timer);this.pending.delete(id);this.disconnect(error instanceof Error?error.message:'Could not send command to Livefy Agent.');reject(error)}})}
    receive(message){const pending=this.pending.get(message?.id);if(!pending)return;clearTimeout(pending.timer);this.pending.delete(message.id);if(message.ok)pending.resolve(message);else pending.reject(new Error(message?.error?.message||'Livefy Agent command failed.'))}
    disconnect(reason){this.port=null;for(const pending of this.pending.values()){clearTimeout(pending.timer);pending.reject(new Error(reason))}this.pending.clear();this.onStatus({connected:false,error:reason})}
  }
  return{LivefyNativeClient,HOST_NAME};
});
