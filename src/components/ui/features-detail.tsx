import { useEffect, useRef, useState } from 'react';
import * as Icon from '../../icons';
import { Button, Status } from '../../components';
import { events, products } from '../../data';
import ProgressMetricCard, { type SeriesPoint } from './progress-metric-card';
import { useI18n } from '../../i18n';

const dashboardTabs=[
  {id:'overview',title:'Overview',icon:Icon.SquaresFour},
  {id:'products',title:'Products',icon:Icon.Package},
  {id:'automation',title:'Automation',icon:Icon.FlowArrow},
  {id:'comments',title:'Comments',icon:Icon.ChatsCircle},
  {id:'diagnostics',title:'Diagnostics',icon:Icon.Pulse},
] as const;

const orderVelocity:SeriesPoint[]=[
  {value:4,date:'13:25'},{value:5,date:'13:35'},{value:4,date:'13:45'},{value:6,date:'13:55'},
  {value:7,date:'14:05'},{value:6,date:'14:15'},{value:8,date:'14:25'},{value:7,date:'14:35'},
  {value:9,date:'14:45'},{value:8,date:'14:55'},{value:10,date:'15:05'},{value:11,date:'15:15'},
  {value:9,date:'15:25'},{value:12,date:'15:35'},
];

function OverviewPanel(){
  const {formatCurrency}=useI18n();
  return <div className="deck-panel overview-panel">
    <div className="deck-session"><div><Status label="Active" tone="online"/><h2>Summer Studio LIVE</h2><p>TikTok Shop · Studio North</p></div><div><span>Session duration</span><strong>01:43:22</strong><small>Started at 13:21</small></div></div>
    <div className="deck-metrics"><div><span>Viewers</span><strong>1,284</strong><small>↑ 18% in 5 min</small></div><div><span>GMV</span><strong>{formatCurrency(4823,{maximumFractionDigits:0})}</strong><small>+{formatCurrency(684,{maximumFractionDigits:0})} this hour</small></div><div><span>Orders</span><strong>72</strong><small>1.8% conversion</small></div><div><span>Comments / min</span><strong>38</strong><small>Stable volume</small></div></div>
    <div className="overview-lower"><ProgressMetricCard title="Order velocity" total="72" unit="orders" deltaLabel="in 5 min" data={orderVelocity} period="Session" periodOptions={[{label:'30 min',points:4},{label:'1 hour',points:7},{label:'Session'}]}/><div className="overview-support"><div className="deck-detail"><span className="deck-icon"><Icon.LightbulbFilament/></span><div><small>Current product</small><h3>{products[0].name}</h3><p>{formatCurrency(products[0].price)} · 31 orders · {formatCurrency(products[0].gmv,{maximumFractionDigits:0})} GMV</p></div><Status label="Pinned 02:14" tone="online"/></div><div className="deck-detail"><span className="deck-icon deck-icon-dark"><Icon.Play variant="Bold"/></span><div><small>Media output</small><h3>studio-demo-vertical.mp4</h3><p>01:34 / 12:32 · 30 FPS</p></div><Status label="Healthy" tone="online"/></div></div></div>
  </div>
}

function ProductsPanel(){
  const {formatCurrency}=useI18n();
  return <div className="deck-panel"><div className="panel-heading"><div><span>Catalog</span><h2>Product performance</h2><p>Products detected from TikTok LIVE Manager and their session performance.</p></div><Button icon={<Icon.ArrowsClockwise/>}>Sync products</Button></div><div className="deck-table"><div className="deck-table-head"><span>Product</span><span>Status</span><span>Orders</span><span>GMV</span></div>{products.map(product=><div className="deck-table-row" key={product.sku}><span className="deck-product"><i><Icon.Package/></i><span><b>{product.name}</b><small>{product.sku} · {formatCurrency(product.price)}</small></span></span><Status label={product.status} tone={product.status==='Pinned'?'online':'neutral'}/><strong>{product.orders}</strong><strong>{formatCurrency(product.gmv,{maximumFractionDigits:0})}</strong></div>)}</div></div>
}

function AutomationPanel(){
  return <div className="deck-panel"><div className="panel-heading"><div><span>Automation</span><h2>Balanced rotation</h2><p>A readable account of what the system is doing and why.</p></div><Status label="Running" tone="online"/></div><div className="automation-focus"><div><span>Next scheduled action</span><strong>00:46</strong><small>Pin AeroClip Wireless Microphone Duo</small></div><Icon.Timer/></div><div className="deck-queue">{products.map((product,index)=><div key={product.sku}><span>{index+1}</span><div><b>{product.name}</b><small>{index===0?'Currently pinned':`${product.duration} duration`}</small></div><Status label={index===0?'Active':'Waiting'} tone={index===0?'online':'neutral'}/></div>)}</div></div>
}

function CommentsPanel(){
  const comments=[['Mara Veloso','Does this light include the desk clamp?','Question detected'],['Leo Martins','How long does shipping take to Curitiba?','FAQ answered · 18 sec ago'],['Bianca Rocha','Can I use two microphones at once?','AI candidate · Waiting']];
  return <div className="deck-panel"><div className="panel-heading"><div><span>Engage</span><h2>Comment activity</h2><p>Moderate questions and inspect automated responses.</p></div><Status label="38 / min" tone="online"/></div><div className="comment-dashboard">{comments.map((comment,index)=><div className={index===0?'selected':''} key={comment[0]}><span className="avatar">{comment[0].split(' ').map(part=>part[0]).join('')}</span><div><b>{comment[0]}</b><p>{comment[1]}</p><small>{comment[2]}</small></div><Button kind="quiet">Reply</Button></div>)}</div></div>
}

function DiagnosticsPanel(){
  const systems=[['TikTok Adapter','Selector profile v3 · confidence 96%'],['Desktop Runtime','Heartbeat 8 ms ago'],['Virtual Camera','30 FPS · 0 frames dropped'],['Pushcut','Last delivery 3 min ago']];
  return <div className="deck-panel"><div className="health-hero"><Icon.CheckCircle variant="Bold"/><div><span>System</span><h2>Core systems are healthy</h2><p>AI capacity is reduced but live operations are unaffected.</p></div><Status label="1 degraded" tone="warning"/></div><div className="health-grid">{systems.map((system,index)=><div key={system[0]}><span className="health-icon"><Icon.Pulse/></span><div><b>{system[0]}</b><small>{system[1]}</small></div><Status label={index===3?'Degraded':'Healthy'} tone={index===3?'warning':'online'}/></div>)}</div><div className="event-preview"><span>Recent activity</span>{events.slice(0,2).map(event=><div key={event[0]}><time>{event[0]}</time><p>{event[2]}</p><Status label={event[3]==='success'?'Confirmed':'Recorded'} tone={event[3]==='success'?'online':'neutral'}/></div>)}</div></div>
}

const panels=[OverviewPanel,ProductsPanel,AutomationPanel,CommentsPanel,DiagnosticsPanel];

export default function FeaturesDetail(){
  const rootRef=useRef<HTMLDivElement>(null);
  const [currentSlide,setCurrentSlide]=useState(0);
  const [paused,setPaused]=useState(false);

  useEffect(()=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    let cancelled=false;
    let revert:undefined|(()=>void);
    void Promise.all([import('gsap'),import('gsap/ScrollTrigger')]).then(([gsapModule,scrollModule])=>{
      if(cancelled)return;
      const gsap=gsapModule.gsap;
      gsap.registerPlugin(scrollModule.ScrollTrigger);
      const context=gsap.context(()=>{
        gsap.fromTo('.dashboard-intro > *',{y:22,opacity:0},{y:0,opacity:1,duration:.62,stagger:.08,ease:'power3.out'});
        gsap.fromTo('.dashboard-tabs',{y:18,opacity:0},{y:0,opacity:1,duration:.55,delay:.18,ease:'power3.out'});
        gsap.fromTo('.dashboard-stage',{y:28,opacity:0},{y:0,opacity:1,duration:.7,delay:.26,ease:'power3.out'});
        gsap.to('.dashboard-ambient',{yPercent:18,ease:'none',scrollTrigger:{trigger:rootRef.current,start:'top top',end:'bottom top',scrub:true}});
      },rootRef);
      revert=()=>context.revert();
    });
    return()=>{cancelled=true;revert?.()};
  },[]);

  useEffect(()=>{
    if(paused)return;
    const interval=window.setInterval(()=>setCurrentSlide(current=>(current+1)%dashboardTabs.length),7000);
    return()=>window.clearInterval(interval);
  },[paused,currentSlide]);

  return <div className="features-dashboard" ref={rootRef} onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onFocusCapture={()=>setPaused(true)} onBlurCapture={()=>setPaused(false)}>
    <div className="dashboard-ambient" aria-hidden="true"/>
    <div className="dashboard-intro"><div><span className="eyebrow">Sunday, August 16</span><h1>Session overview</h1><p>A live operational view of commerce, media, and automation.</p></div><div className="dashboard-actions"><Button icon={<Icon.ArrowClockwise/>}>Refresh</Button><Button kind="primary" icon={<Icon.Play/>}>Start control</Button></div></div>
    <div className="dashboard-tabs" role="tablist" aria-label="Dashboard views">{dashboardTabs.map((tab,index)=>{const TabIcon=tab.icon;return <button key={tab.id} role="tab" aria-selected={currentSlide===index} aria-controls={`dashboard-panel-${tab.id}`} id={`dashboard-tab-${tab.id}`} onClick={()=>setCurrentSlide(index)}><TabIcon variant={currentSlide===index?'Bold':undefined}/><span>{tab.title}</span><i/></button>})}</div>
    <div className="dashboard-stage">{panels.map((Panel,index)=>{const position=index-currentSlide;return <section id={`dashboard-panel-${dashboardTabs[index].id}`} aria-labelledby={`dashboard-tab-${dashboardTabs[index].id}`} aria-hidden={currentSlide!==index} inert={currentSlide!==index} className={`dashboard-slide ${currentSlide===index?'active':''}`} key={dashboardTabs[index].id} style={{transform:`translate3d(${position*104}%,0,0) scale(${currentSlide===index?1:.965})`,zIndex:currentSlide===index?2:1}}><Panel/></section>})}</div>
  </div>
}
