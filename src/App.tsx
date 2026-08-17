import { useEffect, useMemo, useState } from 'react';
import * as Icon from './icons';
import type { PageId } from './types';
import { Button, Status } from './components';
import { Screens } from './screens';
import AuthSectionTwo, { type AuthMode } from './components/ui/auth-section-2';
import { BrandLogo } from './components/ui/brand-logo';
import { LocaleMenu } from './components/ui/locale-menu';
import { useAuth } from './auth';
import { LivefyDataProvider,useLivefyData } from './livefy-data';

const groups:[string,{id:PageId;label:string;icon:keyof typeof Icon}[]][]=[
 ['Studio',[{id:'overview',label:'Overview',icon:'SquaresFour'},{id:'live',label:'Shop LIVE',icon:'Broadcast'},{id:'games',label:'Game LIVE',icon:'GameController'},{id:'create',label:'Creation studio',icon:'Sparkle'}]],
 ['Production',[{id:'media',label:'Media',icon:'PlayCircle'},{id:'products',label:'Products',icon:'Package'},{id:'automation',label:'Automation',icon:'FlowArrow'},{id:'rules',label:'Rules',icon:'TreeStructure'},{id:'comments',label:'Comments',icon:'ChatsCircle'}]],
 ['Monitor',[{id:'analytics',label:'Analytics',icon:'ChartLineUp'},{id:'events',label:'Event Log',icon:'ListMagnifyingGlass'},{id:'compliance',label:'Compliance',icon:'ShieldCheck'}]],
 ['Account',[{id:'subscription',label:'Subscription',icon:'CreditCard'},{id:'notifications',label:'Notifications',icon:'Bell'},{id:'diagnostics',label:'Diagnostics',icon:'Pulse'},{id:'settings',label:'Settings',icon:'GearSix'}]]
];
type Route=PageId|AuthMode;
const authRoutes:AuthMode[]=['login','signup','forgot-password'];
function isAuthRoute(route:Route):route is AuthMode{return authRoutes.includes(route as AuthMode)}
function readRoute():Route { const value=location.hash.slice(1) as Route; if(isAuthRoute(value))return value;return groups.flatMap(x=>x[1]).some(x=>x.id===value)||value==='components'?value:'overview' }
export function App(){
 const [route,setRoute]=useState<Route>(readRoute); const [sidebar,setSidebar]=useState(false); const [theme,setTheme]=useState<'light'|'dark'>(()=>(localStorage.getItem('theme') as 'light'|'dark')||'light');
 const{user,loading,configured}=useAuth();
 useEffect(()=>{const fn=()=>setRoute(readRoute()); addEventListener('hashchange',fn); return()=>removeEventListener('hashchange',fn)},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('theme',theme)},[theme]);
 useEffect(()=>{document.body.classList.toggle('nav-drawer-open',sidebar);return()=>document.body.classList.remove('nav-drawer-open')},[sidebar]);
 const label=useMemo(()=>groups.flatMap(x=>x[1]).find(x=>x.id===route)?.label||'Component Lab',[route]);
 if(loading)return <div className="app-boot" role="status">Loading Livefy…</div>;
 if(!configured)return <div className="app-boot app-boot-error"><b>Supabase is not configured</b><span>Add the public project variables and reload the application.</span></div>;
 if(!user)return <AuthSectionTwo mode={isAuthRoute(route)?route:'login'}/>;
 const page=isAuthRoute(route)?'overview':route;
 return <LivefyDataProvider><AuthenticatedShell page={page} sidebar={sidebar} setSidebar={setSidebar} theme={theme} setTheme={setTheme} label={label}/></LivefyDataProvider>
}

function AuthenticatedShell({page,sidebar,setSidebar,theme,setTheme,label}:{page:PageId;sidebar:boolean;setSidebar:(value:boolean)=>void;theme:'light'|'dark';setTheme:(value:'light'|'dark')=>void;label:string}){
 const{signOut}=useAuth();
 const{workspace,sessions,comments,events}=useLivefyData();
 const activeSession=sessions.find(session=>session.status==='live');
 const warnings=events.filter(event=>event.severity==='warning'||event.severity==='error').length;
 const elapsed=activeSession?.started_at?formatElapsed(activeSession.started_at):null;
 return <div className="app-shell">
  <header className="toolbar"><button className="icon-button menu-toggle" aria-label="Toggle navigation" onClick={()=>setSidebar(!sidebar)}><Icon.List/></button><div className="brand-lockup"><BrandLogo className="brand-logo-toolbar"/></div><div className="toolbar-spacer"/>{activeSession&&<div className="live-island"><Status label="LIVE" tone="online"/><b>{elapsed}</b><span>{activeSession.viewer_count.toLocaleString()} watching</span></div>}<LocaleMenu/><a className="icon-button notification-button" aria-label="Notifications" href="#notifications"><Icon.Bell/>{warnings>0&&<i>{warnings}</i>}</a><button className="theme-toggle" aria-label="Toggle color theme" onClick={()=>setTheme(theme==='light'?'dark':'light')}><span className={theme==='light'?'active':''}><Icon.Sun/></span><span className={theme==='dark'?'active':''}><Icon.Moon/></span></button>{activeSession&&<Button kind="primary" icon={<Icon.Pause/>}>Pause automation</Button>}</header>
  <aside className={`sidebar ${sidebar?'sidebar-open':''}`}><div className="sidebar-brand"><BrandLogo className="brand-logo-sidebar"/><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={()=>setSidebar(false)}><Icon.X/></button></div><div className="workspace"><span className="workspace-icon">{initials(workspace?.name??'Livefy')}</span><span><small>Workspace</small><b>{workspace?.name??'Livefy'}</b></span></div><nav aria-label="Primary navigation">{groups.map(([name,items])=><div className="nav-group" key={name}><span>{name}</span>{items.map(item=>{const I=Icon[item.icon] as React.ComponentType<{variant?:'Bold'}>;return <a key={item.id} href={`#${item.id}`} className={page===item.id?'active':''} onClick={()=>setSidebar(false)}><I variant={page===item.id?'Bold':undefined}/><span>{item.label}</span>{item.id==='comments'&&comments.length>0&&<em>{comments.length}</em>}</a>})}</div>)}</nav><div className="sidebar-foot"><button className="sidebar-signout" onClick={()=>void signOut()}><Icon.Logout/> Sign out</button></div></aside>
  {sidebar&&<button className="scrim" aria-label="Close navigation" onClick={()=>setSidebar(false)}/>}<main aria-label={label}><Screens page={page}/></main>
 </div>
}

function initials(value:string){return value.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toUpperCase()||'LF'}
function formatElapsed(startedAt:string){const seconds=Math.max(0,Math.floor((Date.now()-new Date(startedAt).getTime())/1000));const hours=Math.floor(seconds/3600);const minutes=Math.floor((seconds%3600)/60);const rest=seconds%60;return [hours,minutes,rest].map(value=>String(value).padStart(2,'0')).join(':')}
