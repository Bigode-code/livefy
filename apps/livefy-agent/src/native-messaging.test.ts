import test from 'node:test';
import assert from 'node:assert/strict';
import {PassThrough} from 'node:stream';
import {encodeNativeMessage,runNativeMessaging} from './native-messaging.js';
import {LivefyAgent} from './agent.js';

test('native messaging preserves request id and returns pong',async()=>{const input=new PassThrough();const output=new PassThrough();const chunks:Buffer[]=[];output.on('data',chunk=>chunks.push(Buffer.from(chunk)));const agent=new LivefyAgent();const running=runNativeMessaging(input,output,request=>agent.handle(request));input.end(encodeNativeMessage({id:'ping-1',type:'PING',payload:{}}));await running;const response=Buffer.concat(chunks);const size=response.readUInt32LE(0);const body=JSON.parse(response.subarray(4,4+size).toString('utf8'));assert.equal(body.id,'ping-1');assert.equal(body.ok,true);assert.equal(body.type,'PONG')});
test('invalid commands fail without crashing the agent',async()=>{const agent=new LivefyAgent();const response=await agent.handle({id:'bad-1',type:'UNKNOWN' as never,payload:{}});assert.equal(response.ok,false);if(!response.ok)assert.equal(response.error.code,'UNSUPPORTED_COMMAND')});
