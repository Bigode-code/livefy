import type { ReactNode } from 'react';
import * as Icon from '../../icons';
import { Button, PageHeader, Section, Skeleton, Status } from '../../components';
import { useLivefyData } from '../../livefy-data';
import { useI18n } from '../../i18n';

export default function StudioOverview(){
  const{loading,error,sessions,workflows,products,comments,systems}=useLivefyData();
  const{t}=useI18n();
  const live=sessions.find(session=>session.status==='live');
  const modes=[
    {id:'live',className:'commerce',icon:Icon.Broadcast,kicker:'Commerce',title:'TikTok Shop LIVE',description:'Products, pinned offers, comments and conversion automation in one control room.',meta:live?.mode==='shop'?'Live now':`${products.length} ${t('products')}`,tone:live?.mode==='shop'?'online':'neutral',action:'Open Shop LIVE'},
    {id:'games',className:'games',icon:Icon.GameController,kicker:'Interactive',title:'Game LIVE',description:'Turn gifts, likes and chat messages into safe events inside the game.',meta:sessions.some(session=>session.mode==='game')?'Configured':'Not configured',tone:'neutral',action:'Configure game LIVE'},
    {id:'create',className:'creative',icon:Icon.Sparkle,kicker:'Generative',title:'Creation studio',description:'Build reusable visual workflows for video, images and live assets.',meta:`${workflows.length} ${t('workflows')}`,tone:'neutral',action:'Open creation studio'}
  ] as const;
  return <div className="page wide studio-home">
    <PageHeader eyebrow="Studio" title="Choose how you want to create" description="One workspace for commerce lives, interactive games and AI-assisted production." actions={<Button kind="primary" icon={<Icon.Plus/>} onClick={()=>{location.hash='create'}}>New production</Button>}/>
    {error&&<div className="data-error" role="alert">{error}</div>}
    <div className="studio-mode-grid">{modes.map(({id,className,icon:ModeIcon,kicker,title,description,meta,tone,action},index)=><a className={`studio-mode studio-mode-${className} ${index===0?'studio-mode-featured':''}`} href={`#${id}`} key={id}>
      <div className="studio-mode-top"><span className="studio-mode-icon"><ModeIcon/></span><span className="studio-mode-kicker">{kicker}</span><Icon.ArrowRight/></div>
      <div><h2>{title}</h2><p>{description}</p></div><footer><Status label={meta} tone={tone}/><b>{action}</b></footer>
    </a>)}</div>
    <div className="studio-home-lower">
      <Section title="Recent productions">{loading?<Skeleton/>:sessions.length||workflows.length?<div className="production-list">
        {sessions.slice(0,3).map(session=><a href={session.mode==='game'?'#games':'#live'} key={session.id}><span className="production-thumb production-thumb-shop"><Icon.Broadcast/></span><div><b>{session.title}</b><small>{session.platform} · {session.status}</small></div><Status label={session.status} tone={session.status==='live'?'online':'neutral'}/><time>{new Date(session.created_at).toLocaleDateString()}</time><Icon.CaretRight/></a>)}
        {workflows.slice(0,3).map(workflow=><a href="#create" key={workflow.id}><span className="production-thumb production-thumb-ai"><Icon.VideoPlay/></span><div><b>{workflow.name}</b><small>Creation studio · {workflow.status}</small></div><Status label={workflow.status} tone="neutral"/><time>{new Date(workflow.updated_at).toLocaleDateString()}</time><Icon.CaretRight/></a>)}
      </div>:<RealEmpty title="No productions yet" description="Create a live session or workflow to see it here."/>}</Section>
      <Section title="Workspace data"><div className="readiness-list"><DataRow icon={<Icon.Package/>} label="Products" value={products.length}/><DataRow icon={<Icon.ChatsCircle/>} label="Comments" value={comments.length}/><DataRow icon={<Icon.Processor/>} label="Connected systems" value={systems.filter(system=>system.status==='healthy'||system.status==='connected').length}/></div></Section>
    </div>
  </div>;
}

function DataRow({icon,label,value}:{icon:ReactNode;label:string;value:number}){return <div>{icon}<span><b>{label}</b><small>Stored in Supabase</small></span><b>{value}</b></div>}
function RealEmpty({title,description}:{title:string;description:string}){return <div className="empty-state"><div className="empty-icon"><Icon.Plus/></div><h3>{title}</h3><p>{description}</p></div>}
