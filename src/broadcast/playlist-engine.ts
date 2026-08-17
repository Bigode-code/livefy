import { RuntimeEventBus } from './event-bus';
import type { ResolvedMedia,RuntimeStatus } from './types';

type Events={'state':PlaylistSnapshot;'media:duration':{id:string;duration:number};'media:error':Error};
export type PlaylistSnapshot={items:ResolvedMedia[];index:number;status:RuntimeStatus;currentTime:number;duration:number;loopPlaylist:boolean;loopItem:boolean};

export class PlaylistEngine{
  readonly events=new RuntimeEventBus<Events>();
  readonly element:HTMLVideoElement;
  private image=new Image();private imageTimer=0;private imageStarted=0;private items:ResolvedMedia[]=[];private index=-1;private status:RuntimeStatus='idle';private loopPlaylist=true;private loopItem=false;private raf=0;
  constructor(){this.element=document.createElement('video');this.element.crossOrigin='anonymous';this.element.playsInline=true;this.element.preload='auto';this.element.addEventListener('loadedmetadata',this.onMetadata);this.element.addEventListener('canplay',this.onReady);this.element.addEventListener('play',this.onPlay);this.element.addEventListener('pause',this.onPause);this.element.addEventListener('ended',this.onEnded);this.element.addEventListener('error',this.onError)}
  load(items:ResolvedMedia[]){this.items=items;this.index=items.length?Math.min(Math.max(this.index,0),items.length-1):-1;this.status=items.length?'ready':'idle';if(this.index>=0)this.prepare(this.index);this.emit()}
  get snapshot():PlaylistSnapshot{return{items:[...this.items],index:this.index,status:this.status,currentTime:this.currentTime,duration:this.duration,loopPlaylist:this.loopPlaylist,loopItem:this.loopItem}}
  get current(){return this.items[this.index]??null}get nextItem(){return this.items[this.index+1]??(this.loopPlaylist?this.items[0]:null)??null}get visualSource():CanvasImageSource|null{return this.current?.kind==='image'?this.image:this.current?.kind==='video'?this.element:null}
  get currentTime(){return this.current?.kind==='image'?(this.status==='playing'?(performance.now()-this.imageStarted)/1000:0):this.element.currentTime||0}get duration(){return this.current?.kind==='image'?Math.max(this.current.duration_seconds||5,1):Number.isFinite(this.element.duration)?this.element.duration:0}
  async play(){if(!this.current)return;if(this.current.kind==='image'){this.status='playing';this.imageStarted=performance.now();this.scheduleImage();this.tick();this.emit();return}await this.element.play();this.tick()}
  pause(){if(this.current?.kind==='image'){clearTimeout(this.imageTimer);this.status='paused';this.emit()}else this.element.pause()}
  stop(){clearTimeout(this.imageTimer);this.element.pause();this.element.currentTime=0;this.status=this.current?'ready':'idle';cancelAnimationFrame(this.raf);this.emit()}
  seek(seconds:number){if(this.current?.kind!=='image')this.element.currentTime=Math.min(Math.max(seconds,0),this.duration||0);this.emit()}
  async select(index:number,autoplay=false){if(index<0||index>=this.items.length)return;const wasPlaying=autoplay||this.status==='playing';this.stop();this.index=index;this.prepare(index);this.emit();if(wasPlaying)await this.play()}
  next(){const target=this.index+1<this.items.length?this.index+1:this.loopPlaylist?0:-1;if(target<0){this.status='ended';this.emit();return Promise.resolve()}return this.select(target,true)}
  previous(){return this.select(this.index>0?this.index-1:this.loopPlaylist?this.items.length-1:0,true)}
  restart(){return this.select(0,true)} setLoopPlaylist(value:boolean){this.loopPlaylist=value;this.emit()}setLoopItem(value:boolean){this.loopItem=value;this.emit()}
  reorder(from:number,to:number){if(from===to||from<0||to<0||from>=this.items.length||to>=this.items.length)return;const currentId=this.current?.id;const copy=[...this.items];const[item]=copy.splice(from,1);copy.splice(to,0,item);this.items=copy;this.index=copy.findIndex(entry=>entry.id===currentId);this.emit()}
  remove(index:number){if(index<0||index>=this.items.length)return;const wasCurrent=index===this.index;this.items.splice(index,1);if(!this.items.length){this.index=-1;this.stop()}else if(wasCurrent){this.index=Math.min(index,this.items.length-1);this.prepare(this.index)}else if(index<this.index)this.index--;this.emit()}
  destroy(){this.stop();this.element.removeEventListener('loadedmetadata',this.onMetadata);this.element.removeEventListener('canplay',this.onReady);this.element.removeEventListener('play',this.onPlay);this.element.removeEventListener('pause',this.onPause);this.element.removeEventListener('ended',this.onEnded);this.element.removeEventListener('error',this.onError);this.element.removeAttribute('src');this.element.load();this.events.clear()}
  private prepare(index:number){const item=this.items[index];this.status='loading';if(item.kind==='image'){this.image.crossOrigin='anonymous';this.image.onload=()=>{this.status='ready';this.emit()};this.image.onerror=()=>this.fail(new Error(`Could not load ${item.name}`));this.image.src=item.url}else{this.element.src=item.url;this.element.load()}this.preloadNext()}
  private preloadNext(){const next=this.nextItem;if(!next)return;if(next.kind==='image'){const image=new Image();image.src=next.url}else{const preload=document.createElement('video');preload.preload='auto';preload.muted=true;preload.src=next.url}}
  private scheduleImage(){clearTimeout(this.imageTimer);this.imageTimer=window.setTimeout(()=>void(this.loopItem?this.play():this.next()),this.duration*1000)}
  private tick=()=>{cancelAnimationFrame(this.raf);const run=()=>{this.emit();if(this.status==='playing')this.raf=requestAnimationFrame(run)};this.raf=requestAnimationFrame(run)}
  private emit(){this.events.emit('state',this.snapshot)}private fail(error:Error){this.status='error';this.events.emit('media:error',error);this.emit()}
  private onMetadata=()=>{const item=this.current;if(item&&this.element.duration)this.events.emit('media:duration',{id:item.id,duration:Math.round(this.element.duration)});this.emit()};private onReady=()=>{this.status='ready';this.emit()};private onPlay=()=>{this.status='playing';this.emit()};private onPause=()=>{if(this.status==='playing')this.status='paused';this.emit()};private onEnded=()=>void(this.loopItem?this.select(this.index,true):this.next());private onError=()=>this.fail(new Error(`Could not play ${this.current?.name??'media'}`));
}
