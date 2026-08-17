import { useCallback,useEffect,useState } from 'react';
import * as Icon from '../../icons';
import { Button,Section,Status } from '../../components';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../i18n';

type ExtensionDevice={id:string;name:string;browser:string;extension_version:string;status:'connected'|'offline'|'revoked';last_page_host:string|null;last_page_type:string|null;last_seen_at:string|null;revoked_at:string|null;created_at:string};
const ALPHABET='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateCode(){const bytes=crypto.getRandomValues(new Uint8Array(16));const raw=[...bytes].map(value=>ALPHABET[value%ALPHABET.length]).join('');return raw.match(/.{1,4}/g)!.join('-')}
async function sha256(value:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value.replace(/-/g,'')));return[...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('')}
function isOnline(device:ExtensionDevice){return !device.revoked_at&&Boolean(device.last_seen_at)&&Date.now()-new Date(device.last_seen_at!).getTime()<125_000}
function relative(value:string|null){if(!value)return'Never connected';const seconds=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000));if(seconds<60)return `${seconds}s ago`;if(seconds<3600)return `${Math.floor(seconds/60)}m ago`;return `${Math.floor(seconds/3600)}h ago`}
function extensionError(error:{code?:string;message:string}){return error.code==='42P01'||error.code==='PGRST205'||/extension_(devices|pairing_codes)|schema cache/i.test(error.message)?'The extension database migration still needs to be applied.':error.message}

export function ExtensionDevices({workspaceId}:{workspaceId:string}){
  const{t}=useI18n();
  const[devices,setDevices]=useState<ExtensionDevice[]>([]);const[loading,setLoading]=useState(true);const[generating,setGenerating]=useState(false);const[code,setCode]=useState('');const[expiresAt,setExpiresAt]=useState('');const[message,setMessage]=useState('');const[copied,setCopied]=useState(false);
  const load=useCallback(async()=>{const result=await supabase.from('extension_devices').select('id,name,browser,extension_version,status,last_page_host,last_page_type,last_seen_at,revoked_at,created_at').eq('workspace_id',workspaceId).order('created_at',{ascending:false});if(result.error)setMessage(extensionError(result.error));else{setDevices((result.data??[]) as ExtensionDevice[]);setMessage('')}setLoading(false)},[workspaceId]);
  useEffect(()=>{void load();const timer=window.setInterval(()=>void load(),15_000);return()=>window.clearInterval(timer)},[load]);
  const createPairing=async()=>{setGenerating(true);setMessage('');const next=generateCode();const hash=await sha256(next);const expiry=new Date(Date.now()+10*60_000).toISOString();await supabase.from('extension_pairing_codes').delete().eq('workspace_id',workspaceId);const result=await supabase.from('extension_pairing_codes').insert({workspace_id:workspaceId,code_hash:hash,expires_at:expiry});if(result.error)setMessage(extensionError(result.error));else{setCode(next);setExpiresAt(expiry)}setGenerating(false)};
  const copyCode=async()=>{await navigator.clipboard.writeText(code);setCopied(true);window.setTimeout(()=>setCopied(false),1800)};
  const revoke=async(device:ExtensionDevice)=>{const result=await supabase.from('extension_devices').update({status:'revoked',revoked_at:new Date().toISOString()}).eq('id',device.id);if(result.error)setMessage(result.error.message);else await load()};
  return <Section title="Chrome extension" meta={<a href="https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked" target="_blank" rel="noreferrer">Installation guide</a>}>
    <div className="extension-connect-grid"><div className="extension-connect-copy"><span className="diag-icon"><Icon.Browser/></span><div><h3>Connect a Chrome browser</h3><p>Generate a one-time code, then enter it in Livefy Live Bridge. The code expires after 10 minutes and can only be claimed once.</p></div></div><Button kind="primary" icon={<Icon.Link/>} disabled={generating} onClick={()=>void createPairing()}>{generating?'Generating…':'Generate pairing code'}</Button></div>
    {message&&<div className="data-error" role="alert">{message}</div>}
    {code&&<div className="pairing-code" role="status"><div><small>ONE-TIME PAIRING CODE</small><strong>{code}</strong><span>Expires {new Date(expiresAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div><Button icon={copied?<Icon.CheckCircle/>:<Icon.Copy/>} onClick={()=>void copyCode()}>{copied?'Copied':'Copy code'}</Button></div>}
    <div className="extension-disclosure"><Icon.ShieldCheck/><p><b>Capture is explicit and limited.</b><br/>The extension reads only visible TikTok LIVE comments, products and audience metrics while enabled. It does not access passwords, cookies, private messages or other websites.</p></div>
    <div className="extension-device-list"><div className="extension-list-head"><b>Connected browsers</b><span>{devices.filter(device=>!device.revoked_at).length} {t(devices.filter(device=>!device.revoked_at).length===1?'active device':'active devices')}</span></div>{loading?<div className="extension-device-skeleton"/>:devices.length?devices.map(device=>{const online=isOnline(device);return <div className="extension-device" key={device.id}><span className="diag-icon"><Icon.Browser/></span><div><b>{device.name}</b><small>{device.browser} · v{device.extension_version}{device.last_page_type?` · ${device.last_page_type}`:''}</small><span>{device.last_page_host??'No TikTok page detected'} · {relative(device.last_seen_at)}</span></div><Status label={device.revoked_at?'Revoked':online?'Connected':'Offline'} tone={device.revoked_at?'neutral':online?'online':'warning'}/>{!device.revoked_at&&<Button kind="quiet" onClick={()=>void revoke(device)}>Revoke</Button>}</div>}):<div className="extension-empty"><Icon.Browser/><div><b>No browser connected</b><span>Install the extension and generate a pairing code to begin.</span></div></div>}</div>
  </Section>
}
