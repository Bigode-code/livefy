const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const vm=require('node:vm');
const context={setTimeout,clearTimeout,Map,Promise,Error,Date};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'native-client.js'),'utf8'),context,{filename:'native-client.js'});
const{LivefyNativeClient}=context;

function event(){const listeners=[];return{addListener(listener){listeners.push(listener)},emit(value){for(const listener of listeners)listener(value)}}}
function fakePort(){return{onMessage:event(),onDisconnect:event(),postMessage(){}}}

test('native client correlates concurrent responses by id',async()=>{
  const port=fakePort();const client=new LivefyNativeClient({connectNative:()=>port});
  port.postMessage=request=>queueMicrotask(()=>port.onMessage.emit({id:request.id,ok:true,type:'ACK',payload:{command:request.type}}));
  const[first,second]=await Promise.all([client.send('PLAY'),client.send('PAUSE')]);
  assert.equal(first.payload.command,'PLAY');assert.equal(second.payload.command,'PAUSE');
});

test('native client rejects pending commands when Agent disconnects',async()=>{
  const port=fakePort();const client=new LivefyNativeClient({connectNative:()=>port});
  const pending=client.send('PLAY',{},1000);queueMicrotask(()=>port.onDisconnect.emit());
  await assert.rejects(pending,/offline/);
});
