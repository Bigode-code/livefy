import net,{type Socket}from'node:net';
import{release}from'node:os';

export const CAMERA_PIPE_PATH=Number(release().split('.')[2]??0)<22000?'\\\\.\\pipe\\livefy-camera-frames-v2':'\\\\.\\pipe\\livefy-camera-frames-v1';
export const FRAME_HEADER_BYTES=40;
type TimingSummary={frames:number;fps:number;averageIntervalMs:number;p95IntervalMs:number};
export type FrameTransportSnapshot={running:boolean;consumerConnected:boolean;width:number;height:number;fps:number;pixelFormat:'NV12';framesProduced:number;framesDropped:number;lastFrameAt:string|null;sequence:number;timing:{decoded:TimingSummary;ready:TimingSummary;sent:TimingSummary}};

class TimingProbe{private frames=0;private last=0;private intervals:number[]=[];mark(){const now=performance.now();this.frames++;if(this.last){this.intervals.push(now-this.last);if(this.intervals.length>900)this.intervals.shift()}this.last=now}summary():TimingSummary{if(!this.intervals.length)return{frames:this.frames,fps:0,averageIntervalMs:0,p95IntervalMs:0};const average=this.intervals.reduce((sum,value)=>sum+value,0)/this.intervals.length;const sorted=[...this.intervals].sort((a,b)=>a-b);return{frames:this.frames,fps:1000/average,averageIntervalMs:average,p95IntervalMs:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]!}}}

export class FrameTransport{
  private consumer:Socket|null=null;
  private timer:NodeJS.Timeout|null=null;
  private reconnectTimer:NodeJS.Timeout|null=null;
  private latest:Buffer;
  private sequence=0;
  private framesProduced=0;
  private framesDropped=0;
  private lastFrameAt:string|null=null;
  private writePending=false;
  private connected=false;
  private nextPublishAt=0;
  private decodedTiming=new TimingProbe();private readyTiming=new TimingProbe();private sentTiming=new TimingProbe();

  constructor(readonly width=1080,readonly height=1920,readonly fps=30,readonly pipePath=CAMERA_PIPE_PATH){this.latest=this.placeholder()}

  async start(){
    if(this.timer)return;this.connect();this.nextPublishAt=performance.now();this.schedulePublish();this.reconnectTimer=setInterval(()=>this.connect(),500);this.reconnectTimer.unref();
  }
  async stop(){if(this.timer)clearInterval(this.timer);if(this.reconnectTimer)clearInterval(this.reconnectTimer);this.timer=null;this.reconnectTimer=null;this.consumer?.destroy();this.consumer=null}
  recordDecoded(){this.decodedTiming.mark()}
  push(frame:Buffer){const expected=this.width*this.height*3/2;if(frame.length!==expected)throw new Error(`Invalid NV12 frame length: expected ${expected}, got ${frame.length}.`);this.latest=Buffer.from(frame);this.readyTiming.mark()}
  snapshot():FrameTransportSnapshot{return{running:Boolean(this.timer),consumerConnected:this.connected,width:this.width,height:this.height,fps:this.fps,pixelFormat:'NV12',framesProduced:this.framesProduced,framesDropped:this.framesDropped,lastFrameAt:this.lastFrameAt,sequence:this.sequence,timing:{decoded:this.decodedTiming.summary(),ready:this.readyTiming.summary(),sent:this.sentTiming.summary()}}}

  private connect(){if(this.consumer)return;const socket=net.connect(this.pipePath);this.consumer=socket;socket.setNoDelay(true);socket.on('connect',()=>{if(this.consumer===socket)this.connected=true});const clear=()=>{if(this.consumer===socket){this.consumer=null;this.connected=false;this.writePending=false}};socket.on('close',clear);socket.on('error',clear)}
  private schedulePublish(){const interval=1000/this.fps;this.nextPublishAt+=interval;const delay=Math.max(0,this.nextPublishAt-performance.now());this.timer=setTimeout(()=>{this.publish();this.schedulePublish()},delay);this.timer.unref()}
  private publish(){const socket=this.consumer;if(!socket||socket.destroyed)return;if(this.writePending){this.framesDropped++;return}const frame=this.latest;const header=Buffer.allocUnsafe(FRAME_HEADER_BYTES);header.write('LFNV',0,'ascii');header.writeUInt16LE(1,4);header.writeUInt16LE(0,6);header.writeUInt32LE(this.width,8);header.writeUInt32LE(this.height,12);header.writeUInt32LE(this.width,16);header.writeUInt32LE(frame.length,20);header.writeBigUInt64LE(BigInt(++this.sequence),24);header.writeBigUInt64LE(process.hrtime.bigint(),32);this.writePending=true;socket.cork();socket.write(header);socket.write(frame,error=>{if(this.consumer===socket)this.writePending=false;if(error){this.framesDropped++;return}this.framesProduced++;this.sentTiming.mark();this.lastFrameAt=new Date().toISOString()});socket.uncork()}
  private placeholder(){const size=this.width*this.height;const frame=Buffer.alloc(size*3/2);frame.fill(16,0,size);frame.fill(128,size);return frame}
}

export const defaultFrameTransport=new FrameTransport();
