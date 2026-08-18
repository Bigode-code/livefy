import net,{type Socket}from'node:net';
import{release}from'node:os';

export const CAMERA_PIPE_PATH=Number(release().split('.')[2]??0)<22000?'\\\\.\\pipe\\livefy-camera-frames-v2':'\\\\.\\pipe\\livefy-camera-frames-v1';
export const FRAME_HEADER_BYTES=40;
export type FrameTransportSnapshot={running:boolean;consumerConnected:boolean;width:number;height:number;fps:number;pixelFormat:'NV12';framesProduced:number;framesDropped:number;lastFrameAt:string|null;sequence:number};

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

  constructor(readonly width=1080,readonly height=1920,readonly fps=30,readonly pipePath=CAMERA_PIPE_PATH){this.latest=this.placeholder()}

  async start(){
    if(this.timer)return;this.connect();this.timer=setInterval(()=>this.publish(),Math.round(1000/this.fps));this.timer.unref();this.reconnectTimer=setInterval(()=>this.connect(),500);this.reconnectTimer.unref();
  }
  async stop(){if(this.timer)clearInterval(this.timer);if(this.reconnectTimer)clearInterval(this.reconnectTimer);this.timer=null;this.reconnectTimer=null;this.consumer?.destroy();this.consumer=null}
  push(frame:Buffer){const expected=this.width*this.height*3/2;if(frame.length!==expected)throw new Error(`Invalid NV12 frame length: expected ${expected}, got ${frame.length}.`);this.latest=Buffer.from(frame)}
  snapshot():FrameTransportSnapshot{return{running:Boolean(this.timer),consumerConnected:this.connected,width:this.width,height:this.height,fps:this.fps,pixelFormat:'NV12',framesProduced:this.framesProduced,framesDropped:this.framesDropped,lastFrameAt:this.lastFrameAt,sequence:this.sequence}}

  private connect(){if(this.consumer)return;const socket=net.connect(this.pipePath);this.consumer=socket;socket.setNoDelay(true);socket.on('connect',()=>{if(this.consumer===socket)this.connected=true});const clear=()=>{if(this.consumer===socket){this.consumer=null;this.connected=false;this.writePending=false}};socket.on('close',clear);socket.on('error',clear)}
  private publish(){const socket=this.consumer;if(!socket||socket.destroyed)return;if(this.writePending){this.framesDropped++;return}const header=Buffer.allocUnsafe(FRAME_HEADER_BYTES);header.write('LFNV',0,'ascii');header.writeUInt16LE(1,4);header.writeUInt16LE(0,6);header.writeUInt32LE(this.width,8);header.writeUInt32LE(this.height,12);header.writeUInt32LE(this.width,16);header.writeUInt32LE(this.latest.length,20);header.writeBigUInt64LE(BigInt(++this.sequence),24);header.writeBigUInt64LE(process.hrtime.bigint(),32);this.writePending=true;socket.write(Buffer.concat([header,this.latest]),error=>{if(this.consumer===socket)this.writePending=false;if(error){this.framesDropped++;return}this.framesProduced++;this.lastFrameAt=new Date().toISOString()})}
  private placeholder(){const size=this.width*this.height;const frame=Buffer.alloc(size*3/2);frame.fill(16,0,size);frame.fill(128,size);return frame}
}

export const defaultFrameTransport=new FrameTransport();
