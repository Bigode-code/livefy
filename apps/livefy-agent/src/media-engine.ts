import {access} from 'node:fs/promises';
import {spawn,execFile,type ChildProcessWithoutNullStreams} from 'node:child_process';
import {promisify} from 'node:util';
import {AuthoritativeClock} from './clock.js';
import {defaultFrameTransport,FrameTransport} from './frame-transport.js';
import{defaultVirtualCameraProbe,VirtualCameraProbe}from'./virtual-camera-probe.js';
import type {AgentMedia,AgentPlaybackState,PlaybackStatus} from './types.js';

const execFileAsync=promisify(execFile);

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

  constructor(readonly ffmpegPath=process.env.LIVEFY_FFMPEG_PATH||'ffmpeg',readonly ffprobePath=process.env.LIVEFY_FFPROBE_PATH||'ffprobe',now?:()=>number,readonly frames:FrameTransport=defaultFrameTransport,readonly cameraProbe:VirtualCameraProbe=defaultVirtualCameraProbe){this.clock=new AuthoritativeClock(now);void this.frames.start().catch(error=>{this.lastError=error instanceof Error?error.message:'Frame transport failed'})}

  setSession(sessionId:string|null){this.sessionId=sessionId}

  async loadMedia(media:AgentMedia){await this.loadPlaylist([media])}
  async loadPlaylist(items:AgentMedia[]){
    if(!items.length)throw new Error('Playlist cannot be empty.');
    this.stopProcess();this.status='loading';
    const resolved:AgentMedia[]=[];
    for(const item of items){await access(item.path);const durationMs=item.durationMs??await this.probeDuration(item.path);resolved.push({...item,durationMs})}
    this.playlist=resolved;this.index=0;this.clock.load(resolved[0]!.durationMs!);this.status='ready';this.lastError=null;
  }

  async play(){if(this.index<0)throw new Error('No media loaded.');if(this.status==='playing')return;this.clock.play();this.status='playing';this.spawnDecoder()}
  pause(){if(this.status!=='playing')return;this.clock.pause();this.status='paused';this.stopProcess()}
  stop(){this.clock.stop();this.status=this.index>=0?'ready':'idle';this.stopProcess()}
  async seek(positionMs:number){this.clock.seek(positionMs);if(this.status==='playing'){this.stopProcess();this.spawnDecoder()}}
  setVolume(volume:number){if(!Number.isFinite(volume)||volume<0||volume>1)throw new Error('Volume must be between 0 and 1.');this.volume=volume}
  setResponseAudioPlaying(value:boolean){this.responseAudioPlaying=value}

  getState():AgentPlaybackState{const clock=this.clock.snapshot();return{sessionId:this.sessionId,state:this.status,mediaId:this.playlist[this.index]?.id??null,positionMs:clock.positionMs,durationMs:clock.durationMs,absolutePositionMs:clock.absolutePositionMs,loopIndex:clock.loopIndex,volume:this.volume,responseAudioPlaying:this.responseAudioPlaying}}
  getLastError(){return this.lastError}
  getVirtualCameraState(){return{...this.cameraProbe.snapshot(),...this.frames.snapshot()}}

  private async probeDuration(path:string){
    try{const{stdout}=await execFileAsync(this.ffprobePath,['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',path],{windowsHide:true});const duration=Number(stdout.trim());if(!Number.isFinite(duration)||duration<=0)throw new Error('Invalid media duration.');return Math.round(duration*1000)}catch(error){this.status='error';this.lastError=error instanceof Error?error.message:'ffprobe failed';throw new Error(`Could not inspect media. Install FFmpeg or configure LIVEFY_FFPROBE_PATH. ${this.lastError}`)}
  }

  private spawnDecoder(){
    const media=this.playlist[this.index];if(!media)return;
    const position=(this.clock.snapshot().positionMs/1000).toFixed(3);
    this.intentionallyStopping=false;
    this.frameBuffer=Buffer.alloc(0);
    this.process=spawn(this.ffmpegPath,['-hide_banner','-loglevel','error','-re','-stream_loop','-1','-ss',position,'-i',media.path,'-map','0:v:0?','-vf','fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=nv12','-an','-pix_fmt','nv12','-f','rawvideo','pipe:1'],{windowsHide:true,stdio:['pipe','pipe','pipe']});
    const frameBytes=this.frames.width*this.frames.height*3/2;
    this.process.stdout.on('data',chunk=>{this.frameBuffer=Buffer.concat([this.frameBuffer,chunk]);while(this.frameBuffer.length>=frameBytes){this.frames.push(this.frameBuffer.subarray(0,frameBytes));this.frameBuffer=this.frameBuffer.subarray(frameBytes)}});
    this.process.stderr.on('data',chunk=>{const text=String(chunk).trim();if(text)this.lastError=text.slice(-1000)});
    this.process.on('error',error=>{this.lastError=error.message;this.clock.pause();this.status='error'});
    this.process.on('exit',code=>{this.process=null;if(this.intentionallyStopping)return;if(this.status==='playing'&&code!==0){this.clock.pause();this.status='error';this.lastError=this.lastError??`FFmpeg exited with code ${code}`}});
  }

  private stopProcess(){if(!this.process)return;this.intentionallyStopping=true;this.process.kill();this.process=null}
}
