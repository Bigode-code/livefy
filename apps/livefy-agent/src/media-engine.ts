import {access} from 'node:fs/promises';
import{existsSync,readdirSync}from'node:fs';
import{join}from'node:path';
import {spawn,execFile,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {promisify} from 'node:util';
import {AuthoritativeClock} from './clock.js';
import {defaultFrameTransport,FrameTransport} from './frame-transport.js';
import{defaultVirtualCameraProbe,VirtualCameraProbe}from'./virtual-camera-probe.js';
import type {AgentMedia,AgentPlaybackState,PlaybackStatus} from './types.js';
import {AudioEngine,type AudioSink} from './audio-engine.js';
import {defaultAudioTransport}from'./audio-transport.js';

const execFileAsync=promisify(execFile);
function resolveTool(name:'ffmpeg'|'ffprobe'){const configured=process.env[name==='ffmpeg'?'LIVEFY_FFMPEG_PATH':'LIVEFY_FFPROBE_PATH'];if(configured)return configured;const root=join(process.env.LOCALAPPDATA||'','Livefy','tools','ffmpeg');if(existsSync(root))for(const entry of readdirSync(root,{withFileTypes:true})){if(!entry.isDirectory())continue;const candidate=join(root,entry.name,'bin',`${name}.exe`);if(existsSync(candidate))return candidate}return name}

export class MediaEngine{
  private readonly clock:AuthoritativeClock;
  private playlist:AgentMedia[]=[];
  private index=-1;
  private process:ChildProcessWithoutNullStreams|null=null;
  private status:PlaybackStatus='idle';
  private sessionId:string|null=null;
  private volume=1;
  private responseAudioPlaying=false;
  private lastError:string|null=null;
  private intentionallyStopping=false;
  private frameBuffer=Buffer.alloc(0);
  private frameOffset=0;
  readonly audio:AudioEngine;

  constructor(readonly ffmpegPath=resolveTool('ffmpeg'),readonly ffprobePath=resolveTool('ffprobe'),now?:()=>number,readonly frames:FrameTransport=defaultFrameTransport,readonly cameraProbe:VirtualCameraProbe=defaultVirtualCameraProbe,audioSink:AudioSink=defaultAudioTransport){this.clock=new AuthoritativeClock(now);this.audio=new AudioEngine(ffmpegPath,this.clock,audioSink);void this.frames.start().catch(error=>{this.lastError=error instanceof Error?error.message:'Frame transport failed'})}

  setSession(sessionId:string|null){this.sessionId=sessionId}

  async loadMedia(media:AgentMedia){await this.loadPlaylist([media])}
  async loadPlaylist(items:AgentMedia[]){
    if(!items.length)throw new Error('Playlist cannot be empty.');
    this.stopProcess();this.audio.stop();this.status='loading';
    const resolved:AgentMedia[]=[];
    for(const item of items){await access(item.path);const durationMs=item.durationMs??await this.probeDuration(item.path);resolved.push({...item,durationMs})}
    this.playlist=resolved;this.index=0;this.clock.load(resolved[0]!.durationMs!);this.status='ready';this.lastError=null;
  }

  async play(){if(this.index<0)throw new Error('No media loaded.');if(this.status==='playing')return;this.clock.play();this.status='playing';this.spawnDecoder();if(this.playlist[this.index])await this.audio.start(this.playlist[this.index]!.path)}
  pause(){if(this.status!=='playing')return;this.clock.pause();this.status='paused';this.stopProcess();this.audio.pause()}
  stop(){this.clock.stop();this.status=this.index>=0?'ready':'idle';this.stopProcess();this.audio.stop()}
  async seek(positionMs:number){this.clock.seek(positionMs);if(this.status==='playing'){this.stopProcess();this.spawnDecoder();this.audio.seek(this.playlist[this.index]!.path)}}
  async next(){if(!this.playlist.length)return;this.index=(this.index+1)%this.playlist.length;const playing=this.status==='playing';this.stopProcess();this.audio.stop();this.clock.load(this.playlist[this.index]!.durationMs!);this.status=playing?'playing':'ready';if(playing){this.clock.play();this.spawnDecoder();await this.audio.start(this.playlist[this.index]!.path)}}
  async previous(){if(!this.playlist.length)return;this.index=(this.index-1+this.playlist.length)%this.playlist.length;const playing=this.status==='playing';this.stopProcess();this.audio.stop();this.clock.load(this.playlist[this.index]!.durationMs!);this.status=playing?'playing':'ready';if(playing){this.clock.play();this.spawnDecoder();await this.audio.start(this.playlist[this.index]!.path)}}
  setVolume(volume:number){if(!Number.isFinite(volume)||volume<0||volume>1)throw new Error('Volume must be between 0 and 1.');this.volume=volume;this.audio.setMasterVolume(volume)}
  setResponseAudioPlaying(value:boolean){this.responseAudioPlaying=value}

  getState():AgentPlaybackState{const clock=this.clock.snapshot();return{sessionId:this.sessionId,state:this.status,mediaId:this.playlist[this.index]?.id??null,positionMs:clock.positionMs,durationMs:clock.durationMs,absolutePositionMs:clock.absolutePositionMs,loopIndex:clock.loopIndex,volume:this.volume,responseAudioPlaying:this.responseAudioPlaying}}
  getLastError(){return this.lastError}
  getVirtualCameraState(){return{...this.cameraProbe.snapshot(),...this.frames.snapshot()}}
  getVirtualAudioState(){return this.audio.snapshot()}
  playResponseAudio(path:string){this.audio.playResponse(path);this.responseAudioPlaying=true}
  stopResponseAudio(){this.audio.stopResponse();this.responseAudioPlaying=false}

  private async probeDuration(path:string){
    try{const{stdout}=await execFileAsync(this.ffprobePath,['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',path],{windowsHide:true});const duration=Number(stdout.trim());if(!Number.isFinite(duration)||duration<=0)throw new Error('Invalid media duration.');return Math.round(duration*1000)}catch(error){this.status='error';this.lastError=error instanceof Error?error.message:'ffprobe failed';throw new Error(`Could not inspect media. Install FFmpeg or configure LIVEFY_FFPROBE_PATH. ${this.lastError}`)}
  }

  private spawnDecoder(){
    const media=this.playlist[this.index];if(!media)return;
    const position=(this.clock.snapshot().positionMs/1000).toFixed(3);
    this.intentionallyStopping=false;
    const frameBytes=this.frames.width*this.frames.height*3/2;
    this.frameBuffer=Buffer.allocUnsafe(frameBytes);
    this.frameOffset=0;
    const decoder=spawn(this.ffmpegPath,['-hide_banner','-loglevel','error','-re','-stream_loop','-1','-ss',position,'-i',media.path,'-map','0:v:0?','-vf','fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=nv12','-an','-pix_fmt','nv12','-f','rawvideo','pipe:1'],{windowsHide:true,stdio:['pipe','pipe','pipe']});
    this.process=decoder;
    decoder.stdout.on('data',chunk=>{if(this.process!==decoder)return;let sourceOffset=0;while(sourceOffset<chunk.length){const bytes=Math.min(frameBytes-this.frameOffset,chunk.length-sourceOffset);chunk.copy(this.frameBuffer,this.frameOffset,sourceOffset,sourceOffset+bytes);this.frameOffset+=bytes;sourceOffset+=bytes;if(this.frameOffset===frameBytes){this.frames.recordDecoded();this.frames.push(this.frameBuffer);this.frameOffset=0}}});
    decoder.stderr.on('data',chunk=>{if(this.process!==decoder)return;const text=String(chunk).trim();if(text)this.lastError=text.slice(-1000)});
    decoder.on('error',error=>{if(this.process!==decoder)return;this.lastError=error.message;this.clock.pause();this.status='error'});
    decoder.on('exit',code=>{if(this.process!==decoder)return;this.process=null;if(this.intentionallyStopping)return;if(this.status==='playing'&&code!==0){this.clock.pause();this.status='error';this.lastError=this.lastError??`FFmpeg exited with code ${code}`}});
  }

  private stopProcess(){if(!this.process)return;this.intentionallyStopping=true;const decoder=this.process;this.process=null;decoder.kill()}
}
