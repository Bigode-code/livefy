export type PreparationState='idle'|'checking_camera'|'preparing_media'|'downloading'|'loading'|'ready'|'error';
export type PlaybackState={state:string;mediaId:string|null;positionMs:number;durationMs:number;absolutePositionMs:number;loopIndex:number;volume:number};
export type AgentDiagnostics={agent:{status:string;pid:number;uptimeMs:number};mediaEngine:{status:string;lastError:string|null};virtualCamera:{installed:boolean;registered:boolean;running:boolean;consumerConnected:boolean;fps:number;framesProduced:number;framesDropped:number;timing?:{sent?:{fps:number}}};playback:PlaybackState;preparation:{state:PreparationState;sessionId:string|null;workspaceId:string|null;mediaTotal:number;mediaPrepared:number;error:string|null}};
export type ExtensionWebState={agentConnected:boolean;agentLastError:string;pageHost:string;pageType:string;tiktokDetected:boolean;controllerEnabled:boolean};

type BridgeResponse<T>={ok:boolean;data?:{ok?:boolean;payload?:T}|T;error?:string};
const CHANNEL_OUT='livefy:web-to-extension',CHANNEL_IN='livefy:extension-to-web';

export class AgentBridge{
  private pending=new Map<string,{resolve:(value:unknown)=>void;reject:(error:Error)=>void;timer:number}>();
  constructor(){window.addEventListener('message',this.receive)}
  destroy(){window.removeEventListener('message',this.receive);for(const entry of this.pending.values()){clearTimeout(entry.timer);entry.reject(new Error('Agent bridge closed.'))}this.pending.clear()}
  extensionState(){return this.request<ExtensionWebState>({type:'GET_EXTENSION_STATE'},4000)}
  command<T>(command:string,payload:Record<string,unknown>={},timeoutMs=10000){return this.request<T>({type:'AGENT_COMMAND',command,payload,timeoutMs},timeoutMs+1000)}
  private request<T>(message:Record<string,unknown>,timeoutMs:number){const requestId=crypto.randomUUID();return new Promise<T>((resolve,reject)=>{const timer=window.setTimeout(()=>{this.pending.delete(requestId);reject(new Error('Livefy Agent não foi encontrado. Verifique se a extensão e o Agent estão instalados.'))},timeoutMs);this.pending.set(requestId,{resolve:value=>resolve(value as T),reject,timer});window.postMessage({channel:CHANNEL_OUT,requestId,...message},location.origin)})}
  private receive=(event:MessageEvent<BridgeResponse<unknown>&{channel?:string;requestId?:string}>)=>{if(event.source!==window||event.origin!==location.origin||event.data?.channel!==CHANNEL_IN||!event.data.requestId)return;const entry=this.pending.get(event.data.requestId);if(!entry)return;clearTimeout(entry.timer);this.pending.delete(event.data.requestId);if(!event.data.ok){entry.reject(new Error(event.data.error||'Falha na comunicação com o Livefy Agent.'));return}const nested=event.data.data as {ok?:boolean;payload?:unknown;error?:{message?:string}}|undefined;if(nested&&nested.ok===false){entry.reject(new Error(nested.error?.message||'O Livefy Agent recusou o comando.'));return}entry.resolve(nested?.payload??event.data.data)};
}
