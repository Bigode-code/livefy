import assert from'node:assert/strict';
import net from'node:net';
import test from'node:test';
import{FRAME_HEADER_BYTES,FrameTransport}from'./frame-transport.js';

test('frame transport emits framed NV12 and keeps the last frame',async()=>{
  const pipe=`\\\\.\\pipe\\livefy-camera-test-${process.pid}-${Date.now()}`;const server=net.createServer();await new Promise<void>(resolve=>server.listen(pipe,resolve));const transport=new FrameTransport(4,4,30,pipe);await transport.start();
  const expected=Buffer.alloc(24,77);transport.push(expected);const received=await new Promise<Buffer>((resolve,reject)=>server.once('connection',socket=>{let data=Buffer.alloc(0);socket.on('data',chunk=>{data=Buffer.concat([data,Buffer.from(chunk)]);if(data.length>=FRAME_HEADER_BYTES+expected.length)resolve(data)});socket.on('error',reject)}));
  assert.equal(received.subarray(0,4).toString(),'LFNV');assert.equal(received.readUInt32LE(8),4);assert.equal(received.readUInt32LE(12),4);assert.equal(received.readUInt32LE(20),24);assert.deepEqual(received.subarray(FRAME_HEADER_BYTES,FRAME_HEADER_BYTES+24),expected);assert.equal(transport.snapshot().consumerConnected,true);await transport.stop();await new Promise<void>(resolve=>server.close(()=>resolve()));
});

test('placeholder is valid NV12 before media is loaded',async()=>{
  const pipe=`\\\\.\\pipe\\livefy-camera-placeholder-${process.pid}-${Date.now()}`;const server=net.createServer();await new Promise<void>(resolve=>server.listen(pipe,resolve));const transport=new FrameTransport(4,4,30,pipe);await transport.start();const received=await new Promise<Buffer>((resolve,reject)=>server.once('connection',socket=>{let data=Buffer.alloc(0);socket.on('data',chunk=>{data=Buffer.concat([data,Buffer.from(chunk)]);if(data.length>=FRAME_HEADER_BYTES+24)resolve(data)});socket.on('error',reject)}));const frame=received.subarray(FRAME_HEADER_BYTES,FRAME_HEADER_BYTES+24);assert.deepEqual([...frame.subarray(0,16)],Array(16).fill(16));assert.deepEqual([...frame.subarray(16)],Array(8).fill(128));await transport.stop();await new Promise<void>(resolve=>server.close(()=>resolve()));
});
