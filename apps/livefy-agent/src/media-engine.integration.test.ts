import assert from 'node:assert/strict';
import net from 'node:net';
import test from 'node:test';
import {FRAME_HEADER_BYTES,FrameTransport} from './frame-transport.js';
import {MediaEngine} from './media-engine.js';

const ffmpegPath=process.env.LIVEFY_FFMPEG_PATH;
const ffprobePath=process.env.LIVEFY_FFPROBE_PATH;
const mediaPath=process.env.LIVEFY_TEST_MEDIA;

test('FFmpeg decodes a real MP4 continuously while the authoritative clock crosses loops',{
  skip:!ffmpegPath||!ffprobePath||!mediaPath,
},async()=>{
  const pipe=`\\\\.\\pipe\\livefy-camera-integration-${process.pid}-${Date.now()}`;const server=net.createServer();await new Promise<void>(resolve=>server.listen(pipe,resolve));const frames=new FrameTransport(1080,1920,30,pipe);const engine=new MediaEngine(ffmpegPath,ffprobePath,undefined,frames);
  const firstFrame=new Promise<Buffer>((resolve,reject)=>server.once('connection',socket=>{let data=Buffer.alloc(0);socket.on('data',chunk=>{data=Buffer.concat([data,Buffer.from(chunk)]);const required=FRAME_HEADER_BYTES+1080*1920*3/2;if(data.length>=required)resolve(data.subarray(0,required))});socket.on('error',reject)}));
  await engine.loadMedia({id:'integration-video',path:mediaPath!});
  const loaded=engine.getState();
  assert.equal(loaded.durationMs,1000);

  await engine.play();
  const delivered=await firstFrame;assert.equal(delivered.subarray(0,4).toString(),'LFNV');assert.equal(delivered.readUInt32LE(8),1080);assert.equal(delivered.readUInt32LE(12),1920);
  await new Promise(resolve=>setTimeout(resolve,2250));

  const playing=engine.getState();
  assert.equal(playing.state,'playing');
  assert.ok(playing.loopIndex>=2,`expected at least two loops, got ${playing.loopIndex}`);
  assert.ok(playing.absolutePositionMs>=2000);
  assert.equal(engine.getLastError(),null);
  engine.stop();await frames.stop();await new Promise<void>(resolve=>server.close(()=>resolve()));
});
