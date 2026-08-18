import{createHash}from'node:crypto';
import{createReadStream,createWriteStream}from'node:fs';
import{mkdir,readFile,rename,rm,stat,statfs,writeFile}from'node:fs/promises';
import{homedir}from'node:os';
import{basename,dirname,join}from'node:path';
import{pipeline}from'node:stream/promises';
import{Transform,Readable}from'node:stream';

export type CachedMedia={mediaId:string;workspaceId:string;localPath:string;sizeBytes:number;hash:string;downloadedAt:string;lastUsedAt:string};
type CacheIndex={version:1;items:CachedMedia[]};
export type AuthorizedMedia={mediaId:string;workspaceId:string;signedUrl:string};

const safeId=(value:string,name:string)=>{if(!/^[a-zA-Z0-9_-]{1,128}$/.test(value))throw new Error(`${name} is invalid.`);return value};
const defaultRoot=()=>join(process.env.LOCALAPPDATA||join(homedir(),'AppData','Local'),'Livefy','cache');

export class MediaCache{
  private readonly indexPath:string;
  constructor(readonly root=defaultRoot(),private readonly fetcher:typeof fetch=fetch){this.indexPath=join(root,'index.json')}

  async resolve(media:AuthorizedMedia,onState?:(state:'checking'|'downloading'|'validating')=>void){
    const workspaceId=safeId(media.workspaceId,'workspaceId'),mediaId=safeId(media.mediaId,'mediaId');onState?.('checking');
    const index=await this.readIndex();const existing=index.items.find(item=>item.workspaceId===workspaceId&&item.mediaId===mediaId);
    if(existing&&await this.valid(existing)){existing.lastUsedAt=new Date().toISOString();await this.writeIndex(index);return existing}
    const url=this.authorizedUrl(media.signedUrl);onState?.('downloading');const target=join(this.root,workspaceId,`${mediaId}.media`);await mkdir(dirname(target),{recursive:true});
    const partial=`${target}.part`;await rm(partial,{force:true});let lastError:unknown;
    for(let attempt=1;attempt<=3;attempt++)try{await this.download(url,partial);lastError=null;break}catch(error){lastError=error;await rm(partial,{force:true});if(attempt<3)await new Promise(resolve=>setTimeout(resolve,attempt*350))}
    if(lastError)throw new Error(`Media download failed after 3 attempts: ${lastError instanceof Error?lastError.message:String(lastError)}`);
    onState?.('validating');await rename(partial,target);const info=await stat(target);const hash=await this.hash(target);const now=new Date().toISOString();const cached:CachedMedia={mediaId,workspaceId,localPath:target,sizeBytes:info.size,hash,downloadedAt:now,lastUsedAt:now};
    index.items=index.items.filter(item=>item.workspaceId!==workspaceId||item.mediaId!==mediaId);index.items.push(cached);await this.writeIndex(index);return cached;
  }

  private authorizedUrl(value:string){let url:URL;try{url=new URL(value)}catch{throw new Error('Signed media URL is invalid.')}if(url.protocol!=='https:'&&!(url.protocol==='http:'&&(url.hostname==='127.0.0.1'||url.hostname==='localhost')))throw new Error('Signed media URL must use HTTPS.');return url}
  private async download(url:URL,target:string){const response=await this.fetcher(url,{redirect:'follow'});if(!response.ok){if(response.status===401||response.status===403)throw new Error('Signed media URL expired or was rejected.');throw new Error(`Download returned HTTP ${response.status}.`)}if(!response.body)throw new Error('Download response had no body.');const expected=Number(response.headers.get('content-length')||0);if(expected>0){const disk=await statfs(dirname(target));if(Number(disk.bavail)*Number(disk.bsize)<expected+64*1024*1024)throw new Error('Insufficient disk space for media cache.')}await pipeline(Readable.fromWeb(response.body as never),createWriteStream(target,{flags:'wx'}));const downloaded=(await stat(target)).size;if(!downloaded)throw new Error('Downloaded media is empty.');if(expected&&downloaded!==expected)throw new Error('Downloaded media size does not match the server response.')}
  private async valid(item:CachedMedia){try{const info=await stat(item.localPath);if(!info.isFile()||info.size!==item.sizeBytes||basename(item.localPath)!==`${safeId(item.mediaId,'mediaId')}.media`)return false;return await this.hash(item.localPath)===item.hash}catch{return false}}
  private async hash(path:string){const hash=createHash('sha256');await pipeline(createReadStream(path),new Transform({transform(chunk,_encoding,callback){hash.update(chunk);callback(null,chunk)}}),new Transform({transform(_chunk,_encoding,callback){callback()}}));return hash.digest('hex')}
  private async readIndex():Promise<CacheIndex>{await mkdir(this.root,{recursive:true});try{const parsed=JSON.parse(await readFile(this.indexPath,'utf8')) as CacheIndex;return parsed?.version===1&&Array.isArray(parsed.items)?parsed:{version:1,items:[]}}catch{return{version:1,items:[]}}}
  private async writeIndex(index:CacheIndex){const partial=`${this.indexPath}.tmp`;await writeFile(partial,JSON.stringify(index,null,2),'utf8');await rename(partial,this.indexPath)}
}
