import {randomUUID} from 'node:crypto';
import {MediaEngine} from './media-engine.js';
import {MediaCache} from './media-cache.js';
import type {AgentDiagnostics,AgentMedia,AgentRequest,AgentResponse} from './types.js';

export class LivefyAgent{
  readonly startedAt=Date.now();
  private preparation:AgentDiagnostics['preparation']={state:'idle',sessionId:null,workspaceId:null,mediaTotal:0,mediaPrepared:0,error:null};
  constructor(readonly media=new MediaEngine(),readonly cache=new MediaCache()){}

  async handle(request:AgentRequest):Promise<AgentResponse>{
    try{
      if(!request||typeof request.id!=='string'||!request.id||typeof request.type!=='string')return this.failure(request?.id||randomUUID(),'INVALID_REQUEST','A valid id and type are required.');
      const payload=request.payload??{};
      switch(request.type){
        case'PING':return this.success(request.id,'PONG',{time:new Date().toISOString(),protocolVersion:2});
        case'GET_STATE':case'GET_PLAYBACK_STATE':return this.success(request.id,'STATE',this.media.getState());
        case'GET_AGENT_STATUS':case'GET_DIAGNOSTICS':return this.success(request.id,'DIAGNOSTICS',this.diagnostics());
        case'GET_PREPARATION_STATE':return this.success(request.id,'ACK',this.preparation);
        case'PREPARE_SESSION':return this.success(request.id,'ACK',await this.prepare(payload));
        case'START':case'PLAY':await this.media.play();return this.success(request.id,'STATE',this.media.getState());
        case'PAUSE':this.media.pause();return this.success(request.id,'STATE',this.media.getState());
        case'STOP':this.media.stop();return this.success(request.id,'STATE',this.media.getState());
        case'LOAD_SESSION':this.media.setSession(this.string(payload.sessionId,'sessionId'));return this.success(request.id,'ACK',{sessionId:payload.sessionId});
        case'LOAD_MEDIA':await this.media.loadMedia(this.mediaPayload(payload));return this.success(request.id,'STATE',this.media.getState());
        case'LOAD_PLAYLIST':{const items=payload.items;if(!Array.isArray(items))throw new Error('items must be an array.');await this.media.loadPlaylist(items.map(item=>this.mediaPayload(item as Record<string,unknown>)));return this.success(request.id,'STATE',this.media.getState())}
        case'SEEK':await this.media.seek(this.number(payload.positionMs,'positionMs'));return this.success(request.id,'STATE',this.media.getState());
        case'NEXT':await this.media.next();return this.success(request.id,'STATE',this.media.getState());
        case'PREVIOUS':await this.media.previous();return this.success(request.id,'STATE',this.media.getState());
        case'SET_VOLUME':this.media.setVolume(this.number(payload.volume,'volume'));return this.success(request.id,'STATE',this.media.getState());
        case'PLAY_RESPONSE_AUDIO':this.media.setResponseAudioPlaying(true);return this.success(request.id,'ACK',{mediaId:this.string(payload.mediaId,'mediaId'),queued:false});
        case'STOP_RESPONSE_AUDIO':this.media.setResponseAudioPlaying(false);return this.success(request.id,'STATE',this.media.getState());
        default:return this.failure(request.id,'UNSUPPORTED_COMMAND',`Unsupported command: ${request.type}`);
      }
    }catch(error){return this.failure(request.id,'COMMAND_FAILED',error instanceof Error?error.message:'Command failed.')}
  }

  diagnostics():AgentDiagnostics{
    const state=this.media.getState();const error=this.media.getLastError();
    const camera=this.media.getVirtualCameraState();
    const status=camera.consumerConnected?'running':camera.installed&&camera.registered?'installed':'not_installed';
    return{agent:{status:'online',pid:process.pid,uptimeMs:Date.now()-this.startedAt},mediaEngine:{status:error?'error':state.state==='playing'?'playing':state.state==='paused'?'paused':state.mediaId?'ready':'unavailable',ffmpegPath:this.media.ffmpegPath,ffprobePath:this.media.ffprobePath,lastError:error},virtualCamera:{name:'Livefy Camera',backend:camera.backend,status,installed:camera.installed,registered:camera.registered,running:camera.consumerConnected,consumerConnected:camera.consumerConnected,width:camera.width,height:camera.height,fps:camera.fps,pixelFormat:camera.pixelFormat,framesProduced:camera.framesProduced,framesDropped:camera.framesDropped,lastFrameAt:camera.lastFrameAt,timing:camera.timing},audioOutput:{name:'Livefy Audio',status:'not_configured'},playback:state,preparation:this.preparation};
  }

  private async prepare(payload:Record<string,unknown>){
    const sessionId=this.string(payload.sessionId,'sessionId'),workspaceId=this.string(payload.workspaceId,'workspaceId');const playlist=payload.playlist;
    if(!Array.isArray(playlist)||!playlist.length)throw new Error('playlist must contain at least one media item.');
    this.preparation={state:'checking_camera',sessionId,workspaceId,mediaTotal:playlist.length,mediaPrepared:0,error:null};
    try{
      const camera=await this.media.cameraProbe.refresh();if(!camera.installed||!camera.registered)throw new Error('Livefy Camera is not installed or registered.');
      this.preparation={...this.preparation,state:'preparing_media'};const prepared:AgentMedia[]=[];
      for(const raw of playlist){const item=raw as Record<string,unknown>;const mediaId=this.string(item.mediaId,'mediaId'),signedUrl=this.string(item.signedUrl,'signedUrl');const cached=await this.cache.resolve({mediaId,workspaceId,signedUrl},state=>{this.preparation={...this.preparation,state:state==='downloading'?'downloading':'preparing_media'}});prepared.push({id:mediaId,path:cached.localPath,name:typeof item.name==='string'?item.name:undefined});this.preparation={...this.preparation,mediaPrepared:prepared.length}}
      this.preparation={...this.preparation,state:'loading'};this.media.setSession(sessionId);await this.media.loadPlaylist(prepared);await this.media.play();this.preparation={...this.preparation,state:'ready',error:null};return{preparation:this.preparation,playback:this.media.getState(),camera:this.media.getVirtualCameraState()}
    }catch(error){this.preparation={...this.preparation,state:'error',error:error instanceof Error?error.message:'Preparation failed.'};throw error}
  }

  private mediaPayload(payload:Record<string,unknown>):AgentMedia{return{id:this.string(payload.id,'id'),path:this.string(payload.path,'path'),name:typeof payload.name==='string'?payload.name:undefined,durationMs:typeof payload.durationMs==='number'?payload.durationMs:undefined}}
  private string(value:unknown,name:string){if(typeof value!=='string'||!value.trim())throw new Error(`${name} must be a non-empty string.`);return value.trim()}
  private number(value:unknown,name:string){if(typeof value!=='number'||!Number.isFinite(value))throw new Error(`${name} must be a finite number.`);return value}
  private success(id:string,type:'PONG'|'STATE'|'ACK'|'DIAGNOSTICS',payload:unknown):AgentResponse{return{id,ok:true,type,payload}}
  private failure(id:string,code:string,message:string):AgentResponse{return{id,ok:false,type:'ERROR',error:{code,message}}}
}
