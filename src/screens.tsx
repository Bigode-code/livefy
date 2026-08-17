import { lazy,Suspense } from 'react';
import * as Icon from './icons';
import type { PageId,StatusTone } from './types';
import { Button,EmptyState,Metric,PageHeader,Search,Section,SelectField,Skeleton,Status,Switch,TextField } from './components';
import StudioOverview from './components/ui/studio-overview';
import { useI18n } from './i18n';
import { useLivefyData,type LiveEvent } from './livefy-data';

const CreationStudio=lazy(()=>import('./components/ui/creation-studio'));

function Overview(){return <StudioOverview/>}

function Activity(){
  const{events,loading}=useLivefyData();
  return <Section title="Recent activity" meta={<a href="#events">View event log</a>}>{loading?<Skeleton/>:events.length?<EventList events={events.slice(0,4)}/>:<EmptyState/>}</Section>;
}

function Live(){
  const{sessions,products,loading}=useLivefyData();
  const{formatCurrency}=useI18n();
  const session=sessions.find(item=>item.status==='live');
  const pinned=products.find(product=>product.status.toLowerCase()==='pinned');
  if(loading)return <LoadingPage title="LIVE Control"/>;
  if(!session)return <EmptyPage eyebrow="Operate" title="LIVE Control" description="No live session is active. Start a session after connecting a live provider."/>;
  return <div className="page wide"><PageHeader eyebrow="Operate" title={session.title} description={`${session.platform} · ${session.mode}`} actions={<Button kind="danger" icon={<Icon.Stop/>}>End LIVE</Button>}/>
    <div className="control-strip"><div><Status label="LIVE active" tone="online"/><b>{session.viewer_count.toLocaleString()} viewers</b></div><div><Status label="Session data" tone="online"/><b>Synced from Supabase</b></div><div><Status label="Catalog" tone={products.length?'online':'neutral'}/><b>{products.length} products</b></div></div>
    {pinned?<Section title="Now pinned"><div className="operator-product"><div className="product-image"><Icon.Package/></div><h3>{pinned.name}</h3><b>{formatCurrency(pinned.price,{currency:pinned.currency})}</b><p>{pinned.orders} orders · {formatCurrency(pinned.gmv,{currency:pinned.currency,maximumFractionDigits:0})} GMV</p></div></Section>:<Section title="Now pinned"><EmptyState/></Section>}
  </div>;
}

function Products(){
  const{products,loading,error}=useLivefyData();
  const{formatCurrency}=useI18n();
  return <div className="page wide"><PageHeader eyebrow="Catalog" title="Products" description="Products synchronized from connected commerce providers." actions={<Button kind="primary" icon={<Icon.ArrowsClockwise/>} disabled>Connect provider</Button>}/>
    <div className="filterbar"><Search placeholder="Search products"/><span>{products.length} products</span></div>{error&&<DataError message={error}/>}<Section className="table-section">{loading?<Skeleton/>:products.length?<div className="table-scroll"><table><thead><tr><th>Product</th><th>Price</th><th>Status</th><th>Rotation</th><th className="num">Orders</th><th className="num">GMV</th></tr></thead><tbody>{products.map(product=><tr key={product.id}><td><div className="table-product"><div><Icon.Package/></div><span><b>{product.name}</b><small>{product.sku??product.external_id??'No external identifier'}</small></span></div></td><td>{formatCurrency(product.price,{currency:product.currency})}</td><td><Status label={product.status} tone={product.status.toLowerCase()==='pinned'?'online':'neutral'}/></td><td>{formatDuration(product.rotation_seconds)}</td><td className="num">{product.orders}</td><td className="num">{formatCurrency(product.gmv,{currency:product.currency,maximumFractionDigits:0})}</td></tr>)}</tbody></table></div>:<EmptyState/>}</Section>
  </div>;
}

function Media(){
  const{media,loading}=useLivefyData();
  return <div className="page wide"><PageHeader eyebrow="Output" title="Media" description="Files stored in the private Livefy media bucket." actions={<Button icon={<Icon.Plus/>}>Add media</Button>}/>
    <Section title="Playlist" meta={<span>{media.length} items</span>}>{loading?<Skeleton/>:media.length?<div className="playlist">{media.map((item,index)=><div className={item.status==='playing'?'playing':''} key={item.id}><span>{item.status==='playing'?<Icon.SpeakerHigh/>:index+1}</span><div><b>{item.name}</b><small>{item.status} · {formatDuration(item.duration_seconds)}</small></div><Icon.DotsSixVertical/></div>)}</div>:<EmptyState/>}</Section>
  </div>;
}

function Automation(){
  const{rules,events,loading}=useLivefyData();
  return <div className="page"><PageHeader eyebrow="Automate" title="Automation" description="Rules and decisions persisted in your workspace."/>
    <Section title="Active rules">{loading?<Skeleton/>:rules.length?<div className="settings-list">{rules.map(rule=><Switch key={rule.id} label={rule.name} description="Stored in Supabase" on={rule.enabled}/>)}</div>:<EmptyState/>}</Section>
    <Section title="Recent decisions">{events.length?<EventList events={events.filter(event=>event.type.toLowerCase().includes('automation')||event.type.toLowerCase().includes('rule')).slice(0,10)}/>:<EmptyState/>}</Section>
  </div>;
}

function Rules(){
  const{rules,loading}=useLivefyData();
  return <div className="page"><PageHeader eyebrow="Automate" title="Rules" description="Deterministic responses stored for this workspace." actions={<Button kind="primary" icon={<Icon.Plus/>}>New rule</Button>}/>
    <Section title="Rules">{loading?<Skeleton/>:rules.length?<div className="settings-list">{rules.map(rule=><Switch key={rule.id} label={rule.name} description={`${rule.actions.length} actions`} on={rule.enabled}/>)}</div>:<EmptyState/>}</Section>
  </div>;
}

function Comments(){
  const{comments,loading}=useLivefyData();
  const selected=comments[0];
  return <div className="page wide"><PageHeader eyebrow="Engage" title="Comments" description="Comments received from connected live sessions."/><div className="filterbar"><Search placeholder="Search comments"/><span>{comments.length} comments</span></div>
    {loading?<Section><Skeleton/></Section>:comments.length?<div className="inbox"><Section className="comment-stream">{comments.map((comment,index)=><div className={index===0?'selected':''} key={comment.id}><span className="avatar">{initials(comment.author_name)}</span><div><b>{comment.author_name}</b><p>{comment.body}</p><small>{comment.classification??comment.status}</small></div><time>{relativeTime(comment.created_at)}</time></div>)}</Section>{selected&&<Section title="Comment details" className="inspector"><div className="comment-detail"><span className="avatar">{initials(selected.author_name)}</span><h3>{selected.author_name}</h3><small>{selected.author_handle??'No handle'} · {new Date(selected.created_at).toLocaleString()}</small><blockquote>{selected.body}</blockquote><Status label={selected.status} tone={selected.status==='unanswered'?'warning':'neutral'}/>{selected.reply&&<p>{selected.reply}</p>}</div></Section>}</div>:<Section><EmptyState/></Section>}
  </div>;
}

function Notifications(){return <div className="page settings-page"><PageHeader eyebrow="System" title="Notifications" description="Configure a real notification provider for operational alerts."/>
  <Section title="Provider"><div className="connection-row"><div><Status label="Not configured" tone="neutral"/><b>No notification provider connected</b><small>Add a webhook only when a provider is available.</small></div></div><div className="form-grid"><TextField label="Webhook URL" placeholder="https://" description="No webhook is stored." wide/><TextField label="Notification name" placeholder="Livefy"/></div></Section>
</div>}

function Diagnostics(){
  const{systems,loading}=useLivefyData();
  const unhealthy=systems.filter(system=>!['healthy','connected','online'].includes(system.status.toLowerCase())).length;
  return <div className="page"><PageHeader eyebrow="System" title="Diagnostics" description="Last persisted health report from each connected subsystem."/>
    <Section className="diagnostic-summary"><Icon.Pulse/><div><h2>{systems.length?'Health data received':'No diagnostic data'}</h2><p>{systems.length?`${systems.length} components reported.`:'Connect the desktop runtime to publish component health.'}</p></div>{systems.length>0&&<Status label={unhealthy?`${unhealthy} need attention`:'Healthy'} tone={unhealthy?'warning':'online'}/>}</Section>
    <Section title="Components">{loading?<Skeleton/>:systems.length?<div className="diagnostics">{systems.map(system=><button key={system.id}><span className="diag-icon"><Icon.Processor/></span><div><b>{system.name}</b><small>{system.detail??'No details reported'}</small></div><Status label={system.status} tone={systemTone(system.status)}/><Icon.CaretRight/></button>)}</div>:<EmptyState/>}</Section>
  </div>;
}

function Settings(){return <div className="page settings-page"><PageHeader eyebrow="System" title="Settings" description="Application behavior for this browser and workspace."/>
  <Section title="Appearance"><div className="form-grid"><SelectField label="Appearance" value="System"/><SelectField label="Interface density" value="Comfortable"/></div></Section>
  <Section title="Runtime"><div className="form-grid"><TextField label="Runtime address" placeholder="Not configured" description="No desktop runtime is connected." wide/><TextField label="Heartbeat interval" placeholder="Not configured"/></div></Section>
</div>}

function GameLive(){return <EmptyPage eyebrow="Interactive" title="Game LIVE" description="No game bridge is configured. Connect a runtime before creating interaction mappings."/>}
function Subscription(){return <EmptyPage eyebrow="Account" title="Subscription" description="No subscription or billing plan is attached to this workspace."/>}

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
function EmptyPage({eyebrow,title,description}:{eyebrow:string;title:string;description:string}){return <div className="page"><PageHeader eyebrow={eyebrow} title={title} description={description}/><Section><EmptyState/></Section></div>}
function LoadingPage({title}:{title:string}){return <div className="page"><PageHeader title={title}/><Section><Skeleton/></Section></div>}
function DataError({message}:{message:string}){return <div className="data-error" role="alert">{message}</div>}
function formatDuration(seconds:number){const minutes=Math.floor(seconds/60);const rest=seconds%60;return `${String(minutes).padStart(2,'0')}:${String(rest).padStart(2,'0')}`}
function initials(value:string){return value.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'—'}
function relativeTime(value:string){const seconds=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000));if(seconds<60)return `${seconds}s`;if(seconds<3600)return `${Math.floor(seconds/60)}m`;return `${Math.floor(seconds/3600)}h`}
function eventTone(severity:LiveEvent['severity']):StatusTone{return severity==='success'?'online':severity==='warning'?'warning':severity==='error'?'error':'neutral'}
function systemTone(status:string):StatusTone{const normalized=status.toLowerCase();return ['healthy','connected','online'].includes(normalized)?'online':normalized==='degraded'?'warning':normalized==='error'?'error':'neutral'}

export function Screens({page}:{page:PageId}){switch(page){case'overview':return <Overview/>;case'live':return <Live/>;case'games':return <GameLive/>;case'create':return <Suspense fallback={<LoadingPage title="Creation studio"/>}><CreationStudio/></Suspense>;case'media':return <Media/>;case'products':return <Products/>;case'automation':return <Automation/>;case'rules':return <Rules/>;case'comments':return <Comments/>;case'notifications':return <Notifications/>;case'diagnostics':return <Diagnostics/>;case'subscription':return <Subscription/>;case'settings':return <Settings/>;default:return <Generic page={page}/>}}
