import { useEffect, useMemo, useState } from 'react';
import * as Icon from './icons';
import type { PageId } from './types';
import { Button, Status } from './components';
import { Screens } from './screens';
import AuthSectionTwo, { type AuthMode } from './components/ui/auth-section-2';
import { BrandLogo } from './components/ui/brand-logo';
import { LocaleMenu } from './components/ui/locale-menu';

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
 useEffect(()=>{const fn=()=>setRoute(readRoute()); addEventListener('hashchange',fn); return()=>removeEventListener('hashchange',fn)},[]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;localStorage.setItem('theme',theme)},[theme]);
 useEffect(()=>{document.body.classList.toggle('nav-drawer-open',sidebar);return()=>document.body.classList.remove('nav-drawer-open')},[sidebar]);
 const label=useMemo(()=>groups.flatMap(x=>x[1]).find(x=>x.id===route)?.label||'Component Lab',[route]);
 if(isAuthRoute(route))return <AuthSectionTwo mode={route}/>;
 const page=route;
 return <div className="app-shell">
  <header className="toolbar"><button className="icon-button menu-toggle" aria-label="Toggle navigation" onClick={()=>setSidebar(!sidebar)}><Icon.List/></button><div className="brand-lockup"><BrandLogo className="brand-logo-toolbar"/></div><button className="command-trigger"><Icon.MagnifyingGlass/><span>Search or run a command</span><kbd>⌘ K</kbd></button><div className="toolbar-spacer"/><div className="live-island"><Status label="LIVE" tone="online"/><b>01:43:22</b><span>1,284 watching</span></div><LocaleMenu/><button className="icon-button notification-button" aria-label="Notifications"><Icon.Bell/><i>3</i></button><button className="theme-toggle" aria-label="Toggle color theme" onClick={()=>setTheme(theme==='light'?'dark':'light')}><span className={theme==='light'?'active':''}><Icon.Sun/></span><span className={theme==='dark'?'active':''}><Icon.Moon/></span></button><Button kind="primary" icon={<Icon.Pause/>}>Pause automation</Button></header>
  <aside className={`sidebar ${sidebar?'sidebar-open':''}`}><div className="sidebar-brand"><BrandLogo className="brand-logo-sidebar"/><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={()=>setSidebar(false)}><Icon.X/></button></div><div className="workspace"><span className="workspace-icon">SN</span><span><small>Workspace</small><b>Studio North</b></span><Icon.CaretUpDown/></div><nav aria-label="Primary navigation">{groups.map(([name,items])=><div className="nav-group" key={name}><span>{name}</span>{items.map(item=>{const I=Icon[item.icon] as React.ComponentType<{variant?:'Bold'}>;return <a key={item.id} href={`#${item.id}`} className={page===item.id?'active':''} onClick={()=>setSidebar(false)}><I variant={page===item.id?'Bold':undefined}/><span>{item.label}</span>{item.id==='comments'&&<em>12</em>}</a>})}</div>)}</nav><div className="sidebar-foot"><div className="runtime-card"><span className="runtime-orbit"><Icon.Pulse/></span><div><b>Runtime healthy</b><small>All systems nominal</small></div><Icon.CaretRight/></div><a href="#components"><Icon.Cube/> Component lab</a></div></aside>
  {sidebar&&<button className="scrim" aria-label="Close navigation" onClick={()=>setSidebar(false)}/>}<main aria-label={label}><Screens page={page}/></main>
 </div>
}
