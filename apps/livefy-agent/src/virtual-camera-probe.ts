import{execFile}from'node:child_process';import{promisify}from'node:util';
const execFileAsync=promisify(execFile);const REGISTRY_KEY='HKLM\\Software\\Classes\\CLSID\\{A51F16A4-88C1-4D8D-9E39-3A2E8EE65F2B}\\InProcServer32';
export class VirtualCameraProbe{
  private installed=false;private registered=false;private timer:NodeJS.Timeout;
  constructor(){void this.refresh();this.timer=setInterval(()=>void this.refresh(),5000);this.timer.unref()}
  snapshot(){return{installed:this.installed,registered:this.registered}}
  async refresh(){try{const{stdout}=await execFileAsync('reg.exe',['query',REGISTRY_KEY,'/ve'],{windowsHide:true});this.registered=stdout.includes('REG_SZ');this.installed=this.registered&&stdout.toLowerCase().includes('livefycameramediasource.dll')}catch{this.installed=false;this.registered=false}return this.snapshot()}
}
export const defaultVirtualCameraProbe=new VirtualCameraProbe();
