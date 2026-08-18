import assert from'node:assert/strict';
import{mkdtemp,readFile,rm,writeFile}from'node:fs/promises';
import{createServer}from'node:http';
import{tmpdir}from'node:os';
import{join}from'node:path';
import test from'node:test';
import{MediaCache}from'./media-cache.js';

async function fixture(status=200){let requests=0;const body=Buffer.from('fake-mp4-payload');const server=createServer((_request,response)=>{requests++;response.writeHead(status,{'content-length':String(body.length)});response.end(body)});await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();if(!address||typeof address==='string')throw new Error('server failed');return{url:`http://127.0.0.1:${address.port}/media`,body,requests:()=>requests,close:()=>new Promise<void>(resolve=>server.close(()=>resolve()))}}

test('cache miss downloads and cache hit reuses the verified local file',async()=>{const root=await mkdtemp(join(tmpdir(),'livefy-cache-'));const remote=await fixture();try{const cache=new MediaCache(root);const input={workspaceId:'workspace-1',mediaId:'media-1',signedUrl:remote.url};const first=await cache.resolve(input);const second=await cache.resolve(input);assert.equal(remote.requests(),1);assert.equal(first.localPath,second.localPath);assert.deepEqual(await readFile(first.localPath),remote.body)}finally{await remote.close();await rm(root,{recursive:true,force:true})}});

test('corrupted cache entry is downloaded again',async()=>{const root=await mkdtemp(join(tmpdir(),'livefy-cache-'));const remote=await fixture();try{const cache=new MediaCache(root);const input={workspaceId:'workspace-1',mediaId:'media-1',signedUrl:remote.url};const first=await cache.resolve(input);await writeFile(first.localPath,'corrupt');await cache.resolve(input);assert.equal(remote.requests(),2)}finally{await remote.close();await rm(root,{recursive:true,force:true})}});

test('expired signed URL reports a useful error after bounded retries',async()=>{const root=await mkdtemp(join(tmpdir(),'livefy-cache-'));const remote=await fixture(403);try{const cache=new MediaCache(root);await assert.rejects(()=>cache.resolve({workspaceId:'workspace-1',mediaId:'media-1',signedUrl:remote.url}),/expired or was rejected/);assert.equal(remote.requests(),3)}finally{await remote.close();await rm(root,{recursive:true,force:true})}});
