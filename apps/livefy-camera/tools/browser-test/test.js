const status=document.querySelector('#status'),video=document.querySelector('#preview');
const log=value=>status.textContent=`${new Date().toISOString()} ${value}\n${status.textContent}`;
async function devices(){const list=await navigator.mediaDevices.enumerateDevices();const cameras=list.filter(item=>item.kind==='videoinput');log(cameras.map(item=>`${item.label||'(sem permissão)'} | ${item.deviceId}`).join('\n')||'Nenhuma câmera enumerada.');return cameras}
document.querySelector('#refresh').onclick=()=>void devices().catch(error=>log(error.message));
document.querySelector('#enumerate').onclick=async()=>{try{const consent=await navigator.mediaDevices.getUserMedia({video:true,audio:false});consent.getTracks().forEach(track=>track.stop());const camera=(await devices()).find(item=>item.label==='Livefy Camera');if(!camera)throw new Error('Livefy Camera não foi enumerada pelo Chrome.');log('B PASS — Livefy Camera enumerada pelo Chrome.')}catch(error){log(`B FAIL — ${error instanceof Error?error.message:String(error)}`)}};
document.querySelector('#open').onclick=async()=>{try{
  const camera=(await devices()).find(item=>item.label==='Livefy Camera');
  if(!camera)throw new Error('Livefy Camera não foi enumerada pelo Chrome.');
  log(`C deviceId=${camera.deviceId} label=${camera.label}`);
  const stream=await navigator.mediaDevices.getUserMedia({video:{deviceId:{exact:camera.deviceId}},audio:false});
  const track=stream.getVideoTracks()[0];
  for(const eventName of ['mute','unmute','ended'])track.addEventListener(eventName,()=>log(`C track.event=${eventName} readyState=${track.readyState} muted=${track.muted} enabled=${track.enabled}`));
  video.srcObject=stream;
  await video.play();
  const settings=track.getSettings();
  const capabilities=typeof track.getCapabilities==='function'?track.getCapabilities():null;
  log(`C track readyState=${track.readyState} muted=${track.muted} enabled=${track.enabled}`);
  log(`C getCapabilities=${JSON.stringify(capabilities)}`);
  log(`C getSettings=${JSON.stringify(settings)}`);
  log(`C PASS — ABERTA name=${camera.label} width=${settings.width} height=${settings.height} fps=${settings.frameRate}`);
}catch(error){
  log(`C FAIL — name=${error?.name||'<unknown>'} message=${error?.message||String(error)} stack=${error?.stack||'<none>'}`);
}};
