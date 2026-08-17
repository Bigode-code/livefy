import { lazy,Suspense,useEffect,useRef,useState,type ChangeEvent,type FormEvent } from 'react';
import * as Icon from './icons';
import type { PageId,StatusTone } from './types';
import { Button,EmptyState,Metric,PageHeader,Search,Section,SelectField,Skeleton,Status,Switch,TextField } from './components';
import StudioOverview from './components/ui/studio-overview';
import { ExtensionDevices } from './components/ui/extension-devices';
import { useI18n } from './i18n';
import { useLivefyData,type LiveEvent } from './livefy-data';
import { supabase } from './lib/supabase';

const CreationStudio=lazy(()=>import('./components/ui/creation-studio'));

function Overview(){return <StudioOverview/>}

function Activity(){
  const{events,loading}=useLivefyData();
  return <Section title="Recent activity" meta={<a href="#events">View event log</a>}>{loading?<Skeleton/>:events.length?<EventList events={events.slice(0,4)}/>:<EmptyState/>}</Section>;
}

function Live(){
  const{sessions,products,loading,refresh}=useLivefyData();
  const{formatCurrency}=useI18n();
  const[ending,setEnding]=useState(false);
  const session=sessions.find(item=>item.status==='live');
  const pinned=products.find(product=>product.status.toLowerCase()==='pinned');
  if(loading)return <LoadingPage title="LIVE Control"/>;
  if(!session)return <EmptyPage eyebrow="Operate" title="LIVE Control" description="No live session is active. Start a session after connecting a live provider."/>;
  const endLive=async()=>{setEnding(true);await supabase.from('live_sessions').update({status:'ended',ended_at:new Date().toISOString()}).eq('id',session.id);await refresh();setEnding(false)};
  return <div className="page wide"><PageHeader eyebrow="Operate" title={session.title} description={`${session.platform} · ${session.mode}`} actions={<Button kind="danger" icon={<Icon.Stop/>} disabled={ending} onClick={()=>void endLive()}>{ending?'Ending…':'End LIVE'}</Button>}/>
    <div className="control-strip"><div><Status label="LIVE active" tone="online"/><b>{session.viewer_count.toLocaleString()} viewers</b></div><div><Status label="Session data" tone="online"/><b>Synced from Supabase</b></div><div><Status label="Catalog" tone={products.length?'online':'neutral'}/><b>{products.length} products</b></div></div>
    {pinned?<Section title="Now pinned"><div className="operator-product"><div className="product-image"><Icon.Package/></div><h3>{pinned.name}</h3><b>{formatCurrency(pinned.price,{currency:pinned.currency})}</b><p>{pinned.orders} orders · {formatCurrency(pinned.gmv,{currency:pinned.currency,maximumFractionDigits:0})} GMV</p></div></Section>:<Section title="Now pinned"><EmptyState/></Section>}
  </div>;
}

function Products(){
  const{products,loading,error}=useLivefyData();
  const{formatCurrency}=useI18n();
  const[query,setQuery]=useState('');
  const filtered=products.filter(product=>`${product.name} ${product.sku??''} ${product.external_id??''}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page wide"><PageHeader eyebrow="Catalog" title="Products" description="Products synchronized from connected commerce providers." actions={<Button kind="primary" icon={<Icon.ArrowsClockwise/>} onClick={()=>{location.hash='settings'}}>Configure provider</Button>}/>
    <div className="filterbar"><Search placeholder="Search products" value={query} onChange={setQuery}/><span>{filtered.length} products</span></div>{error&&<DataError message={error}/>}<Section className="table-section">{loading?<Skeleton/>:filtered.length?<div className="table-scroll"><table><thead><tr><th>Product</th><th>Price</th><th>Status</th><th>Rotation</th><th className="num">Orders</th><th className="num">GMV</th></tr></thead><tbody>{filtered.map(product=><tr key={product.id}><td><div className="table-product"><div><Icon.Package/></div><span><b>{product.name}</b><small>{product.sku??product.external_id??'No external identifier'}</small></span></div></td><td>{formatCurrency(product.price,{currency:product.currency})}</td><td><Status label={product.status} tone={product.status.toLowerCase()==='pinned'?'online':'neutral'}/></td><td>{formatDuration(product.rotation_seconds)}</td><td className="num">{product.orders}</td><td className="num">{formatCurrency(product.gmv,{currency:product.currency,maximumFractionDigits:0})}</td></tr>)}</tbody></table></div>:query?<FilteredEmpty/>:<EmptyState/>}</Section>
  </div>;
}

function Media(){
  const{media,loading,workspace,refresh}=useLivefyData();
  const input=useRef<HTMLInputElement>(null);const[uploading,setUploading]=useState(false);const[message,setMessage]=useState('');
  const upload=async(event:ChangeEvent<HTMLInputElement>)=>{const file=event.target.files?.[0];if(!file||!workspace)return;setUploading(true);setMessage('');const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'-');const path=`${workspace.id}/${crypto.randomUUID()}-${safe}`;const stored=await supabase.storage.from('media').upload(path,file,{contentType:file.type,upsert:false});if(stored.error)setMessage(stored.error.message);else{const inserted=await supabase.from('media_items').insert({workspace_id:workspace.id,name:file.name,storage_path:path,status:'ready',position:media.length});if(inserted.error){await supabase.storage.from('media').remove([path]);setMessage(inserted.error.message)}else{setMessage('Media uploaded.');await refresh()}}setUploading(false);event.target.value=''};
  return <div className="page wide"><PageHeader eyebrow="Output" title="Media" description="Files stored in the private Livefy media bucket." actions={<><input ref={input} className="visually-hidden" type="file" accept="video/*,audio/*,image/*" onChange={event=>void upload(event)}/><Button icon={<Icon.Plus/>} disabled={uploading||!workspace} onClick={()=>input.current?.click()}>{uploading?'Uploading…':'Add media'}</Button></>}/>{message&&<ActionMessage message={message}/>}
    <Section title="Playlist" meta={<span>{media.length} items</span>}>{loading?<Skeleton/>:media.length?<div className="playlist">{media.map((item,index)=><div className={item.status==='playing'?'playing':''} key={item.id}><span>{item.status==='playing'?<Icon.SpeakerHigh/>:index+1}</span><div><b>{item.name}</b><small>{item.status} · {formatDuration(item.duration_seconds)}</small></div><Icon.DotsSixVertical/></div>)}</div>:<EmptyState/>}</Section>
  </div>;
}

function Automation(){
  const{rules,events,loading,refresh}=useLivefyData();
  const[toggling,setToggling]=useState('');
  const toggleRule=async(id:string,enabled:boolean)=>{setToggling(id);await supabase.from('automation_rules').update({enabled}).eq('id',id);await refresh();setToggling('')};
  return <div className="page"><PageHeader eyebrow="Automate" title="Automation" description="Rules and decisions persisted in your workspace."/>
    <Section title="Active rules">{loading?<Skeleton/>:rules.length?<div className="settings-list">{rules.map(rule=><Switch key={rule.id} label={rule.name} description="Stored in Supabase" on={rule.enabled} disabled={toggling===rule.id} onChange={enabled=>void toggleRule(rule.id,enabled)}/>)}</div>:<EmptyState/>}</Section>
    <Section title="Recent decisions">{events.length?<EventList events={events.filter(event=>event.type.toLowerCase().includes('automation')||event.type.toLowerCase().includes('rule')).slice(0,10)}/>:<EmptyState/>}</Section>
  </div>;
}

function Rules(){
  const{rules,loading,workspace,refresh}=useLivefyData();
  const[creating,setCreating]=useState(false);const[name,setName]=useState('');const[action,setAction]=useState('');const[saving,setSaving]=useState(false);const[message,setMessage]=useState('');
  const save=async(event:FormEvent)=>{event.preventDefault();if(!workspace||!name.trim()||!action.trim())return;setSaving(true);const result=await supabase.from('automation_rules').insert({workspace_id:workspace.id,name:name.trim(),trigger:{type:'comment'},conditions:[],actions:[{type:'reply',message:action.trim()}],enabled:true});setMessage(result.error?.message??'Rule created.');if(!result.error){setName('');setAction('');setCreating(false);await refresh()}setSaving(false)};
  const toggle=async(id:string,enabled:boolean)=>{await supabase.from('automation_rules').update({enabled}).eq('id',id);await refresh()};
  return <div className="page"><PageHeader eyebrow="Automate" title="Rules" description="Deterministic responses stored for this workspace." actions={<Button kind="primary" icon={<Icon.Plus/>} onClick={()=>setCreating(value=>!value)}>{creating?'Cancel':'New rule'}</Button>}/>{message&&<ActionMessage message={message}/>}
    {creating&&<Section title="Create rule"><form className="inline-action-form" onSubmit={event=>void save(event)}><TextField label="Rule name" value={name} onChange={event=>setName(event.target.value)} placeholder="Shipping questions"/><TextField label="Reply action" value={action} onChange={event=>setAction(event.target.value)} placeholder="Reply with the configured shipping policy" wide/><Button type="submit" kind="primary" disabled={saving||!name.trim()||!action.trim()}>{saving?'Saving…':'Create rule'}</Button></form></Section>}
    <Section title="Rules">{loading?<Skeleton/>:rules.length?<div className="settings-list">{rules.map(rule=><Switch key={rule.id} label={rule.name} description={`${rule.actions.length} actions`} on={rule.enabled} onChange={enabled=>void toggle(rule.id,enabled)}/>)}</div>:<EmptyState/>}</Section>
  </div>;
}

function Comments(){
  const{comments,loading}=useLivefyData();
  const[query,setQuery]=useState('');const[selectedId,setSelectedId]=useState('');
  const filtered=comments.filter(comment=>`${comment.author_name} ${comment.author_handle??''} ${comment.body}`.toLowerCase().includes(query.toLowerCase()));
  const selected=filtered.find(comment=>comment.id===selectedId)??filtered[0];
  return <div className="page wide"><PageHeader eyebrow="Engage" title="Comments" description="Comments received from connected live sessions."/><div className="filterbar"><Search placeholder="Search comments" value={query} onChange={setQuery}/><span>{filtered.length} comments</span></div>
    {loading?<Section><Skeleton/></Section>:filtered.length?<div className="inbox"><Section className="comment-stream">{filtered.map(comment=><div role="button" tabIndex={0} className={comment.id===selected?.id?'selected':''} key={comment.id} onClick={()=>setSelectedId(comment.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelectedId(comment.id)}}}><span className="avatar">{initials(comment.author_name)}</span><div><b>{comment.author_name}</b><p>{comment.body}</p><small>{comment.classification??comment.status}</small></div><time>{relativeTime(comment.created_at)}</time></div>)}</Section>{selected&&<Section title="Comment details" className="inspector"><div className="comment-detail"><span className="avatar">{initials(selected.author_name)}</span><h3>{selected.author_name}</h3><small>{selected.author_handle??'No handle'} · {new Date(selected.created_at).toLocaleString()}</small><blockquote>{selected.body}</blockquote><Status label={selected.status} tone={selected.status==='unanswered'?'warning':'neutral'}/>{selected.reply&&<p>{selected.reply}</p>}</div></Section>}</div>:<Section>{query?<FilteredEmpty/>:<EmptyState/>}</Section>}
  </div>;
}

function Notifications(){
  const{workspace}=useLivefyData();const[url,setUrl]=useState('');const[name,setName]=useState('Livefy');const[saving,setSaving]=useState(false);const[message,setMessage]=useState('');const[loaded,setLoaded]=useState(false);
  useEffect(()=>{if(!workspace)return;supabase.from('workspace_settings').select('settings').eq('workspace_id',workspace.id).maybeSingle().then(({data})=>{const notification=(data?.settings as {notifications?:{url?:string;name?:string}}|undefined)?.notifications;setUrl(notification?.url??'');setName(notification?.name??'Livefy');setLoaded(true)})},[workspace]);
  const save=async()=>{if(!workspace)return;if(url&&!url.startsWith('https://')){setMessage('Use a secure HTTPS webhook URL.');return}setSaving(true);const current=await supabase.from('workspace_settings').select('settings').eq('workspace_id',workspace.id).maybeSingle();const settings={...((current.data?.settings as Record<string,unknown>)??{}),notifications:{url:url.trim(),name:name.trim()||'Livefy'}};const result=await supabase.from('workspace_settings').upsert({workspace_id:workspace.id,settings});setMessage(result.error?.message??'Notification settings saved.');setSaving(false)};
  return <div className="page settings-page"><PageHeader eyebrow="System" title="Notifications" description="Configure a real notification provider for operational alerts." actions={<Button kind="primary" disabled={!loaded||saving} onClick={()=>void save()}>{saving?'Saving…':'Save provider'}</Button>}/>{message&&<ActionMessage message={message}/>}
    <Section title="Provider"><div className="connection-row"><div><Status label={url?'Configured':'Not configured'} tone={url?'online':'neutral'}/><b>{url?'Webhook notifications enabled':'No notification provider connected'}</b><small>{url?'Events can be delivered to this endpoint.':'Add a webhook only when a provider is available.'}</small></div></div><div className="form-grid"><TextField type="url" label="Webhook URL" value={url} onChange={event=>setUrl(event.target.value)} placeholder="https://" description="Stored in workspace settings." wide/><TextField label="Notification name" value={name} onChange={event=>setName(event.target.value)} placeholder="Livefy"/></div></Section>
  </div>
}

function Diagnostics(){
  const{systems,loading}=useLivefyData();
  const[expanded,setExpanded]=useState('');
  const unhealthy=systems.filter(system=>!['healthy','connected','online'].includes(system.status.toLowerCase())).length;
  return <div className="page"><PageHeader eyebrow="System" title="Diagnostics" description="Last persisted health report from each connected subsystem."/>
    <Section className="diagnostic-summary"><Icon.Pulse/><div><h2>{systems.length?'Health data received':'No diagnostic data'}</h2><p>{systems.length?`${systems.length} components reported.`:'Connect the desktop runtime to publish component health.'}</p></div>{systems.length>0&&<Status label={unhealthy?`${unhealthy} need attention`:'Healthy'} tone={unhealthy?'warning':'online'}/>}</Section>
    <Section title="Components">{loading?<Skeleton/>:systems.length?<div className="diagnostics">{systems.map(system=><button key={system.id} aria-expanded={expanded===system.id} onClick={()=>setExpanded(value=>value===system.id?'':system.id)}><span className="diag-icon"><Icon.Processor/></span><div><b>{system.name}</b><small>{expanded===system.id?`${system.detail??'No details reported'} · Checked ${system.checked_at?new Date(system.checked_at).toLocaleString():'not reported'}`:system.detail??'No details reported'}</small></div><Status label={system.status} tone={systemTone(system.status)}/><Icon.CaretRight/></button>)}</div>:<EmptyState/>}</Section>
  </div>;
}

function Settings(){
  const{workspace}=useLivefyData();const[appearance,setAppearance]=useState(()=>localStorage.getItem('theme')==='dark'?'Dark':'Light');const[density,setDensity]=useState(()=>localStorage.getItem('density')??'Comfortable');const[address,setAddress]=useState('');const[heartbeat,setHeartbeat]=useState('30');const[saving,setSaving]=useState(false);const[message,setMessage]=useState('');
  useEffect(()=>{if(!workspace)return;supabase.from('workspace_settings').select('settings').eq('workspace_id',workspace.id).maybeSingle().then(({data})=>{const runtime=(data?.settings as {runtime?:{address?:string;heartbeat?:string}}|undefined)?.runtime;setAddress(runtime?.address??'');setHeartbeat(runtime?.heartbeat??'30')})},[workspace]);
  const changeAppearance=(value:string)=>{setAppearance(value);const theme=value.toLowerCase();localStorage.setItem('theme',theme);window.dispatchEvent(new CustomEvent('livefy-theme',{detail:theme}));};
  const changeDensity=(value:string)=>{setDensity(value);localStorage.setItem('density',value);document.documentElement.dataset.density=value.toLowerCase()};
  const save=async()=>{if(!workspace)return;setSaving(true);const current=await supabase.from('workspace_settings').select('settings').eq('workspace_id',workspace.id).maybeSingle();const settings={...((current.data?.settings as Record<string,unknown>)??{}),runtime:{address:address.trim(),heartbeat}};const result=await supabase.from('workspace_settings').upsert({workspace_id:workspace.id,settings});setMessage(result.error?.message??'Settings saved.');setSaving(false)};
  return <div className="page settings-page"><PageHeader eyebrow="System" title="Settings" description="Application behavior for this browser and workspace." actions={<Button kind="primary" disabled={saving} onClick={()=>void save()}>{saving?'Saving…':'Save settings'}</Button>}/>{message&&<ActionMessage message={message}/>}
    <Section title="Appearance"><div className="form-grid"><SelectField label="Appearance" value={appearance} options={['Light','Dark']} onChange={changeAppearance}/><SelectField label="Interface density" value={density} options={['Comfortable','Compact']} onChange={changeDensity}/></div></Section>
    <Section title="Runtime"><div className="form-grid"><TextField type="url" label="Runtime address" value={address} onChange={event=>setAddress(event.target.value)} placeholder="https://runtime.example.com" description="Secure URL used by the desktop bridge." wide/><TextField type="number" label="Heartbeat interval" value={heartbeat} onChange={event=>setHeartbeat(event.target.value)} placeholder="30" description="Seconds between runtime checks."/></div></Section>
    {workspace&&<ExtensionDevices workspaceId={workspace.id}/>}
  </div>
}

function GameLive(){return <EmptyPage eyebrow="Interactive" title="Game LIVE" description="No game bridge is configured. Connect a runtime before creating interaction mappings." action="Configure runtime" target="settings"/>}
function Subscription(){return <EmptyPage eyebrow="Account" title="Subscription" description="No subscription or billing plan is attached to this workspace." action="Configure workspace" target="settings"/>}

function Generic({page}:{page:PageId}){
  const{events,loading}=useLivefyData();
  if(page==='events')return <div className="page wide"><PageHeader eyebrow="Monitor" title="Event Log" description="Events persisted by connected Livefy services."/><Section>{loading?<Skeleton/>:events.length?<EventList events={events}/>:<EmptyState/>}</Section></div>;
  if(page==='compliance'){
    const compliance=events.filter(event=>event.type.toLowerCase().includes('compliance')||event.severity==='warning'||event.severity==='error');
    return <div className="page"><PageHeader eyebrow="Monitor" title="Compliance" description="Compliance events reported by connected providers."/><Section>{compliance.length?<EventList events={compliance}/>:<EmptyState/>}</Section></div>;
  }
  if(page==='analytics'){
    const successful=events.filter(event=>event.severity==='success').length;
    const successRate=events.length?`${((successful/events.length)*100).toFixed(1)}%`:'—';
    return <div className="page"><PageHeader eyebrow="Monitor" title="Analytics" description="Metrics calculated from persisted workspace events."/><Section title="Operational summary"><div className="metrics metrics-three"><Metric label="Events" value={String(events.length)} context="Persisted records"/><Metric label="Success" value={successRate} context="Successful events"/><Metric label="Latency" value="—" context="No runtime measurement"/></div></Section><Activity/></div>;
  }
  return <EmptyPage eyebrow="Control Center" title={page==='ai'?'AI':'Page unavailable'} description={page==='ai'?'No AI provider or model decision is configured.':'This page has no live data source.'}/>;
}

function EventList({events}:{events:LiveEvent[]}){return <div className="activity-list event-log">{events.map(event=><div key={event.id}><time>{new Date(event.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time><span className="event-type">{event.type}</span><p>{event.message}</p><Status label={event.severity} tone={eventTone(event.severity)}/></div>)}</div>}
function EmptyPage({eyebrow,title,description,action,target}:{eyebrow:string;title:string;description:string;action?:string;target?:PageId}){return <div className="page"><PageHeader eyebrow={eyebrow} title={title} description={description} actions={action&&target?<Button kind="primary" onClick={()=>{location.hash=target}}>{action}</Button>:undefined}/><Section><EmptyState/></Section></div>}
function LoadingPage({title}:{title:string}){return <div className="page"><PageHeader title={title}/><Section><Skeleton/></Section></div>}
function DataError({message}:{message:string}){return <div className="data-error" role="alert">{message}</div>}
function ActionMessage({message}:{message:string}){return <div className="action-message" role="status"><Icon.CheckCircle/><span>{message}</span></div>}
function FilteredEmpty(){return <div className="empty-state"><div className="empty-icon"><Icon.MagnifyingGlass/></div><h3>No matches</h3><p>Try a different search term.</p></div>}
function formatDuration(seconds:number){const minutes=Math.floor(seconds/60);const rest=seconds%60;return `${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`}
function initials(value:string){return value.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'—'}
function relativeTime(value:string){const seconds=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000));if(seconds<60)return `${seconds}s`;if(seconds<3600)return `${Math.floor(seconds/60)}m`;return `${Math.floor(seconds/3600)}h`}
function eventTone(severity:LiveEvent['severity']):StatusTone{return severity==='success'?'online':severity==='warning'?'warning':severity==='error'?'error':'neutral'}
function systemTone(status:string):StatusTone{const normalized=status.toLowerCase();return ['healthy','connected','online'].includes(normalized)?'online':normalized==='degraded'?'warning':normalized==='error'?'error':'neutral'}

export function Screens({page}:{page:PageId}){switch(page){case'overview':return <Overview/>;case'live':return <Live/>;case'games':return <GameLive/>;case'create':return <Suspense fallback={<LoadingPage title="Creation studio"/>}><CreationStudio/></Suspense>;case'media':return <Media/>;case'products':return <Products/>;case'automation':return <Automation/>;case'rules':return <Rules/>;case'comments':return <Comments/>;case'notifications':return <Notifications/>;case'diagnostics':return <Diagnostics/>;case'subscription':return <Subscription/>;case'settings':return <Settings/>;default:return <Generic page={page}/>}}
