import {randomUUID} from 'node:crypto';
import {MediaEngine} from './media-engine.js';
import type {AgentDiagnostics,AgentMedia,AgentRequest,AgentResponse} from './types.js';

export class LivefyAgent{
  readonly startedAt=Date.now();
  constructor(readonly media=new MediaEngine()){}

  async handle(request:AgentRequest):Promise<AgentResponse>{
    try{
      if(!request||typeof request.id!=='string'||!request.id||typeof request.type!=='string')return this.failure(request?.id||randomUUID(),'INVALID_REQUEST','A valid id and type are required.');
      const payload=request.payload??{};
      switch(request.type){
        case'PING':return this.success(request.id,'PONG',{time:new Date().toISOString(),protocolVersion:1});
        case'GET_STATE':return this.success(request.id,'STATE',this.media.getState());
        case'START':case'PLAY':await this.media.play();return this.success(request.id,'STATE',this.media.getState());
        case'PAUSE':this.media.pause();return this.success(request.id,'STATE',this.media.getState());
        case'STOP':this.media.stop();return this.success(request.id,'STATE',this.media.getState());
        case'LOAD_SESSION':this.media.setSession(this.string(payload.sessionId,'sessionId'));return this.success(request.id,'ACK',{sessionId:payload.sessionId});
        case'LOAD_MEDIA':await this.media.loadMedia(this.mediaPayload(payload));return this.success(request.id,'STATE',this.media.getState());
        case'LOAD_PLAYLIST':{const items=payload.items;if(!Array.isArray(items))throw new Error('items must be an array.');await this.media.loadPlaylist(items.map(item=>this.mediaPayload(item as Record<string,unknown>)));return this.success(request.id,'STATE',this.media.getState())}
        case'SEEK':await this.media.seek(this.number(payload.positionMs,'positionMs'));return this.success(request.id,'STATE',this.media.getState());
        case'SET_VOLUME':this.media.setVolume(this.number(payload.volume,'volume'));return this.success(request.id,'STATE',this.media.getState());
        case'PLAY_RESPONSE_AUDIO':this.media.setResponseAudioPlaying(true);return this.success(request.id,'ACK',{mediaId:this.string(payload.mediaId,'mediaId'),queued:false});
        case'STOP_RESPONSE_AUDIO':this.media.setResponseAudioPlaying(false);return this.success(request.id,'STATE',this.media.getState());
        case'GET_DIAGNOSTICS':return this.success(request.id,'DIAGNOSTICS',this.diagnostics());
        default:return this.failure(request.id,'UNSUPPORTED_COMMAND',`Unsupported command: ${request.type}`);
      }
    }catch(error){return this.failure(request.id,'COMMAND_FAILED',error instanceof Error?error.message:'Command failed.')}
  }

  diagnostics():AgentDiagnostics{
    const state=this.media.getState();const error=this.media.getLastError();
    const camera=this.media.getVirtualCameraState();
    const status=camera.consumerConnected?'running':camera.installed&&camera.registered?'installed':'not_installed';
    return{agent:{status:'online',pid:process.pid,uptimeMs:Date.now()-this.startedAt},mediaEngine:{status:error?'error':state.state==='playing'?'playing':state.state==='paused'?'paused':state.mediaId?'ready':'unavailable',ffmpegPath:this.media.ffmpegPath,ffprobePath:this.media.ffprobePath,lastError:error},virtualCamera:{name:'Livefy Camera',backend:camera.backend,status,installed:camera.installed,registered:camera.registered,running:camera.consumerConnected,consumerConnected:camera.consumerConnected,width:camera.width,height:camera.height,fps:camera.fps,pixelFormat:camera.pixelFormat,framesProduced:camera.framesProduced,framesDropped:camera.framesDropped,lastFrameAt:camera.lastFrameAt,timing:camera.timing},audioOutput:{name:'Livefy Audio',status:'not_configured'},playback:state};
  }

  private mediaPayload(payload:Record<string,unknown>):AgentMedia{return{id:this.string(payload.id,'id'),path:this.string(payload.path,'path'),name:typeof payload.name==='string'?payload.name:undefined,durationMs:typeof payload.durationMs==='number'?payload.durationMs:undefined}}
  private string(value:unknown,name:string){if(typeof value!=='string'||!value.trim())throw new Error(`${name} must be a non-empty string.`);return value.trim()}
  private number(value:unknown,name:string){if(typeof value!=='number'||!Number.isFinite(value))throw new Error(`${name} must be a finite number.`);return value}
  private success(id:string,type:'PONG'|'STATE'|'ACK'|'DIAGNOSTICS',payload:unknown):AgentResponse{return{id,ok:true,type,payload}}
  private failure(id:string,code:string,message:string):AgentResponse{return{id,ok:false,type:'ERROR',error:{code,message}}}
}
