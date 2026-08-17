import type { MediaItem,Product } from '../livefy-data';

export type MediaKind='video'|'audio'|'image';
export type RuntimeStatus='idle'|'loading'|'ready'|'playing'|'paused'|'ended'|'error';
export type BroadcastPreset='vertical'|'horizontal'|'square';
export type ResolvedMedia=MediaItem&{kind:MediaKind;url:string;urlExpiresAt:number};
export type BroadcastState={items:ResolvedMedia[];status:RuntimeStatus;current:ResolvedMedia|null;next:ResolvedMedia|null;currentTime:number;duration:number;volume:number;muted:boolean;loopPlaylist:boolean;loopItem:boolean;resolution:{width:number;height:number};fps:number;videoTrack:boolean;audioTrack:boolean;errors:string[]};
export type SceneLayer={id:string;type:'media'|'camera'|'text'|'image'|'product';x:number;y:number;width:number;height:number;scale:number;zIndex:number;visible:boolean;opacity:number;source?:CanvasImageSource;text?:string;product?:Product|null};

export const PRESETS:Record<BroadcastPreset,{width:number;height:number}>={vertical:{width:1080,height:1920},horizontal:{width:1920,height:1080},square:{width:1080,height:1080}};
export function mediaKind(name:string):MediaKind{const ext=name.split('.').pop()?.toLowerCase();if(['mp3','wav','ogg','aac','m4a','flac'].includes(ext??''))return'audio';if(['jpg','jpeg','png','webp','gif','avif'].includes(ext??''))return'image';return'video'}
