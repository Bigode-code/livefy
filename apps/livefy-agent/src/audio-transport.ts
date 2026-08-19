import net,{type Socket}from'node:net';
import type{AudioSink,AudioSinkSnapshot}from'./audio-engine.js';

export const AUDIO_PIPE_PATH='\\\\.\\pipe\\livefy-audio-pcm-v1';
export const AUDIO_HEADER_BYTES=32;

export class AudioTransport implements AudioSink{
  private consumer:Socket|null=null;private reconnectTimer:NodeJS.Timeout|null=null;
  private connected=false;private writePending=false;private sequence=0;
  private samplesProduced=0;private samplesDropped=0;private overruns=0;private lastSampleAt:string|null=null;
  constructor(readonly pipePath=AUDIO_PIPE_PATH){}
  async start(){if(this.reconnectTimer)return;this.connect();this.reconnectTimer=setInterval(()=>this.connect(),500);this.reconnectTimer.unref()}
  write(pcm:Buffer){const socket=this.consumer;if(!socket||socket.destroyed){this.samplesDropped+=pcm.length/4;return false}if(this.writePending){this.samplesDropped+=pcm.length/4;this.overruns++;return false}const header=Buffer.allocUnsafe(AUDIO_HEADER_BYTES);header.write('LFPA',0,'ascii');header.writeUInt16LE(1,4);header.writeUInt16LE(1,6);header.writeUInt32LE(48_000,8);header.writeUInt16LE(2,12);header.writeUInt16LE(16,14);header.writeUInt32LE(pcm.length,16);header.writeUInt32LE(++this.sequence,20);header.writeBigUInt64LE(process.hrtime.bigint(),24);this.writePending=true;socket.cork();socket.write(header);socket.write(pcm,error=>{this.writePending=false;if(error){this.samplesDropped+=pcm.length/4;return}this.samplesProduced+=pcm.length/4;this.lastSampleAt=new Date().toISOString()});socket.uncork();return true}
  snapshot():AudioSinkSnapshot{return{installed:this.connected,registered:this.connected,running:Boolean(this.reconnectTimer),consumerConnected:this.connected,samplesProduced:this.samplesProduced,samplesDropped:this.samplesDropped,underruns:0,overruns:this.overruns,lastSampleAt:this.lastSampleAt}}
  async stop(){if(this.reconnectTimer)clearInterval(this.reconnectTimer);this.reconnectTimer=null;this.consumer?.destroy();this.consumer=null;this.connected=false}
  private connect(){if(this.consumer)return;const socket=net.connect(this.pipePath);this.consumer=socket;socket.setNoDelay(true);socket.on('connect',()=>{if(this.consumer===socket)this.connected=true});const clear=()=>{if(this.consumer===socket){this.consumer=null;this.connected=false;this.writePending=false}};socket.on('close',clear);socket.on('error',clear)}
}

export const defaultAudioTransport=new AudioTransport();
