import {Upload} from 'tus-js-client';
import {supabase,supabaseProjectUrl} from './supabase';

type UploadOptions={bucket:string;path:string;file:File;onProgress?:(percentage:number)=>void};

export async function uploadResumable({bucket,path,file,onProgress}:UploadOptions){
  const {data,error}=await supabase.auth.getSession();
  if(error)throw error;
  const token=data.session?.access_token;
  if(!token)throw new Error('Your session expired. Sign in again before uploading.');
  const projectId=new URL(supabaseProjectUrl).hostname.split('.')[0];
  if(!projectId)throw new Error('Supabase Storage is not configured.');
  await new Promise<void>((resolve,reject)=>{
    const upload=new Upload(file,{
      endpoint:`https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`,
      headers:{authorization:`Bearer ${token}`},chunkSize:6*1024*1024,
      retryDelays:[0,1000,3000,5000,10000],uploadDataDuringCreation:true,removeFingerprintOnSuccess:true,
      metadata:{bucketName:bucket,objectName:path,contentType:file.type||'application/octet-stream',cacheControl:'3600'},
      onError:reject,onProgress:(uploaded,total)=>onProgress?.(total?Math.round(uploaded/total*100):0),onSuccess:()=>resolve(),
    });
    upload.findPreviousUploads().then(previous=>{if(previous[0])upload.resumeFromPreviousUpload(previous[0]);upload.start()}).catch(reject);
  });
}
