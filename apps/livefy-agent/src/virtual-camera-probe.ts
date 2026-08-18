import{execFile}from'node:child_process';import{promisify}from'node:util';
import{release}from'node:os';
const execFileAsync=promisify(execFile);const backend=Number(release().split('.')[2]??0)>=22000?'media-foundation'as const:'directshow'as const;const REGISTRY_KEY=backend==='media-foundation'?'HKLM\\Software\\Classes\\CLSID\\{A51F16A4-88C1-4D8D-9E39-3A2E8EE65F2B}\\InProcServer32':'HKLM\\Software\\Classes\\CLSID\\{B8A1DA92-D00F-4EEA-85EC-91017B657A55}\\InProcServer32';
export class VirtualCameraProbe{
  private installed=false;private registered=false;private timer:NodeJS.Timeout;
  constructor(){void this.refresh();this.timer=setInterval(()=>void this.refresh(),5000);this.timer.unref()}
  snapshot(){return{backend,installed:this.installed,registered:this.registered}}
  async refresh(){try{const{stdout}=await execFileAsync('reg.exe',['query',REGISTRY_KEY,'/ve'],{windowsHide:true});this.registered=stdout.includes('REG_SZ');this.installed=this.registered&&stdout.toLowerCase().includes(backend==='media-foundation'?'livefycameramediasource.dll':'livefycameradirectshow.dll')}catch{this.installed=false;this.registered=false}return this.snapshot()}
}
export const defaultVirtualCameraProbe=new VirtualCameraProbe();
