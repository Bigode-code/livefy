import {spawn,type ChildProcessWithoutNullStreams} from 'node:child_process';
import type {AuthoritativeClock} from './clock.js';

export const AUDIO_SAMPLE_RATE=48_000;
export const AUDIO_CHANNELS=2;
export const AUDIO_BYTES_PER_SAMPLE=2;
export const AUDIO_FRAME_MS=10;
export const AUDIO_FRAME_BYTES=AUDIO_SAMPLE_RATE*AUDIO_CHANNELS*AUDIO_BYTES_PER_SAMPLE*AUDIO_FRAME_MS/1000;

export type AudioSinkSnapshot={installed:boolean;registered:boolean;running:boolean;consumerConnected:boolean;samplesProduced:number;samplesDropped:number;underruns:number;overruns:number;lastSampleAt:string|null};
export interface AudioSink{start():Promise<void>;write(pcm:Buffer):boolean;snapshot():AudioSinkSnapshot;stop():Promise<void>}

/** A bounded local sink. The native Livefy Audio backend replaces write() with its local IPC writer. */
export class NullAudioSink implements AudioSink{
  private produced=0;private dropped=0;private lastSampleAt:string|null=null;
  async start(){} write(pcm:Buffer){this.produced+=pcm.length/(AUDIO_CHANNELS*AUDIO_BYTES_PER_SAMPLE);this.lastSampleAt=new Date().toISOString();return true}
  snapshot():AudioSinkSnapshot{return{installed:false,registered:false,running:false,consumerConnected:false,samplesProduced:this.produced,samplesDropped:this.dropped,underruns:0,overruns:0,lastSampleAt:this.lastSampleAt}}
  async stop(){}
}

export type DuckingOptions={enabled:boolean;level:number;attackMs:number;releaseMs:number};
export type AudioEngineSnapshot=AudioSinkSnapshot&{sampleRate:48000;channels:2;format:'s16le';masterVolume:number;programVolume:number;muted:boolean;responseActive:boolean;audioClockMs:number;videoClockMs:number;avDriftMs:number;ducking:DuckingOptions};

export class AudioEngine{
  private program:ChildProcessWithoutNullStreams|null=null;
  private response:ChildProcessWithoutNullStreams|null=null;
  private programBuffer=Buffer.alloc(0);private responseBuffer=Buffer.alloc(0);
  private timer:NodeJS.Timeout|null=null;private running=false;private paused=false;
  private masterVolume=1;private programVolume=1;private muted=false;private gain=1;
  private audioClockMs=0;private intentionallyStopping=new WeakSet<ChildProcessWithoutNullStreams>();
  private ducking:DuckingOptions={enabled:true,level:.2,attackMs:180,releaseMs:450};
  constructor(private readonly ffmpegPath:string,private readonly clock:AuthoritativeClock,private readonly sink:AudioSink=new NullAudioSink()){}

  async start(mediaPath:string){this.stopProgram();this.running=true;this.paused=false;await this.sink.start();this.spawnProgram(mediaPath);this.ensurePump()}
  pause(){this.paused=true;this.stopProgram();this.ensurePump()}
  resume(mediaPath:string){if(!this.running)return;this.paused=false;this.stopProgram();this.spawnProgram(mediaPath);this.ensurePump()}
  seek(mediaPath:string){if(!this.running||this.paused)return;this.stopProgram();this.programBuffer=Buffer.alloc(0);this.spawnProgram(mediaPath)}
  stop(){this.running=false;this.paused=false;this.stopProgram();this.stopResponse();this.programBuffer=Buffer.alloc(0);this.responseBuffer=Buffer.alloc(0);this.stopPump()}
  setMasterVolume(value:number){this.masterVolume=this.volume(value)} setProgramVolume(value:number){this.programVolume=this.volume(value)} setMuted(value:boolean){this.muted=value}
  configureDucking(value:Partial<DuckingOptions>){this.ducking={...this.ducking,...value,level:this.volume(value.level??this.ducking.level),attackMs:Math.max(0,value.attackMs??this.ducking.attackMs),releaseMs:Math.max(0,value.releaseMs??this.ducking.releaseMs)}}
  playResponse(path:string){if(this.response)throw new Error('A response is already playing.');this.responseBuffer=Buffer.alloc(0);this.response=this.spawnPcm(path,0,false);this.response.stdout.on('data',chunk=>{if(this.response)this.responseBuffer=Buffer.concat([this.responseBuffer,chunk])});this.response.on('exit',()=>{this.response=null;this.responseBuffer=Buffer.alloc(0)});this.ensurePump()}
  stopResponse(){if(this.response){this.intentionallyStopping.add(this.response);this.response.kill();this.response=null}this.responseBuffer=Buffer.alloc(0)}
  snapshot():AudioEngineSnapshot{const video=this.clock.snapshot().positionMs;const sink=this.sink.snapshot();return{...sink,sampleRate:AUDIO_SAMPLE_RATE,channels:AUDIO_CHANNELS,format:'s16le',masterVolume:this.masterVolume,programVolume:this.programVolume,muted:this.muted,responseActive:Boolean(this.response),audioClockMs:this.audioClockMs,videoClockMs:video,avDriftMs:this.audioClockMs-video,ducking:{...this.ducking}}}

  private spawnProgram(path:string){const position=this.clock.snapshot().positionMs/1000;const child=this.spawnPcm(path,position,true);this.program=child;child.stdout.on('data',chunk=>{if(this.program===child)this.programBuffer=Buffer.concat([this.programBuffer,chunk])});child.on('exit',()=>{if(this.program===child)this.program=null})}
  private spawnPcm(path:string,position:number,loop:boolean){return spawn(this.ffmpegPath,['-hide_banner','-loglevel','error','-re',...(loop?['-stream_loop','-1']:[]),...(position>0?['-ss',position.toFixed(3)]:[]),'-i',path,'-map','0:a:0?','-vn','-ac',String(AUDIO_CHANNELS),'-ar',String(AUDIO_SAMPLE_RATE),'-c:a','pcm_s16le','-f','s16le','pipe:1'],{windowsHide:true,stdio:['pipe','pipe','pipe']})}
  private ensurePump(){if(this.timer)return;this.timer=setInterval(()=>this.pump(),AUDIO_FRAME_MS);this.timer.unref()}
  private stopPump(){if(this.timer){clearInterval(this.timer);this.timer=null}}
  private pump(){
    if(!this.running&&!this.response)return;
    const responseActive=Boolean(this.response);const target=responseActive&&this.ducking.enabled?this.ducking.level:1;
    const ramp=target<this.gain?AUDIO_FRAME_MS/Math.max(AUDIO_FRAME_MS,this.ducking.attackMs):AUDIO_FRAME_MS/Math.max(AUDIO_FRAME_MS,this.ducking.releaseMs);this.gain+=Math.sign(target-this.gain)*Math.min(Math.abs(target-this.gain),ramp);
    const program=this.take('program');const response=this.take('response');const output=Buffer.allocUnsafe(AUDIO_FRAME_BYTES);
    const master=this.muted?0:this.masterVolume,programGain=this.programVolume*this.gain;
    for(let i=0;i<AUDIO_FRAME_BYTES;i+=2){const a=program.readInt16LE(i)*programGain,b=response.readInt16LE(i);output.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round((a+b)*master))),i)}
    this.sink.write(output);this.audioClockMs=this.clock.snapshot().positionMs;
  }
  private take(bus:'program'|'response'){const current=bus==='program'?this.programBuffer:this.responseBuffer;if((bus==='program'&&this.paused)||current.length<AUDIO_FRAME_BYTES)return Buffer.alloc(AUDIO_FRAME_BYTES);const frame=current.subarray(0,AUDIO_FRAME_BYTES);if(bus==='program')this.programBuffer=current.subarray(AUDIO_FRAME_BYTES);else this.responseBuffer=current.subarray(AUDIO_FRAME_BYTES);return frame}
  private stopProgram(){if(this.program){this.intentionallyStopping.add(this.program);this.program.kill();this.program=null}this.programBuffer=Buffer.alloc(0)}
  private volume(value:number){if(!Number.isFinite(value)||value<0||value>1)throw new Error('Volume must be between 0 and 1.');return value}
}
