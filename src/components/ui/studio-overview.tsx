import * as Icon from '../../icons';
import { Button, PageHeader, Section, Status } from '../../components';

const modes=[
  {id:'live',className:'commerce',icon:Icon.Broadcast,kicker:'Commerce',title:'TikTok Shop LIVE',description:'Products, pinned offers, comments and conversion automation in one control room.',meta:'Shop adapter ready',action:'Open Shop LIVE'},
  {id:'games',className:'games',icon:Icon.GameController,kicker:'Interactive',title:'Game LIVE',description:'Turn gifts, likes and chat messages into safe events inside the game.',meta:'Setup required',action:'Configure game LIVE'},
  {id:'create',className:'creative',icon:Icon.Sparkle,kicker:'Generative',title:'Creation studio',description:'Build reusable visual workflows for video, images and live assets.',meta:'2 connectors to configure',action:'Open creation studio'}
];

export default function StudioOverview(){return <div className="page wide studio-home">
  <PageHeader eyebrow="Studio" title="Choose how you want to create" description="One workspace for commerce lives, interactive games and AI-assisted production." actions={<Button kind="primary" icon={<Icon.Plus/>}>New production</Button>}/>
  <div className="studio-mode-grid">{modes.map(({id,className,icon:ModeIcon,kicker,title,description,meta,action},index)=><a className={`studio-mode studio-mode-${className} ${index===0?'studio-mode-featured':''}`} href={`#${id}`} key={id}>
    <div className="studio-mode-top"><span className="studio-mode-icon"><ModeIcon/></span><span className="studio-mode-kicker">{kicker}</span><Icon.ArrowRight/></div>
    <div><h2>{title}</h2><p>{description}</p></div><footer><Status label={meta} tone={index===0?'online':'neutral'}/><b>{action}</b></footer>
  </a>)}</div>
  <div className="studio-home-lower">
    <Section title="Recent productions" meta={<button className="text-action">View all</button>}><div className="production-list">
      <a href="#live"><span className="production-thumb production-thumb-shop"><Icon.Broadcast/></span><div><b>Summer Studio LIVE</b><small>TikTok Shop · Live now</small></div><Status label="On air" tone="online"/><time>01:43:22</time><Icon.CaretRight/></a>
      <a href="#create"><span className="production-thumb production-thumb-ai"><Icon.VideoPlay/></span><div><b>Launch teaser workflow</b><small>Creation studio · Draft</small></div><Status label="Draft" tone="neutral"/><time>Edited 18 min ago</time><Icon.CaretRight/></a>
    </div></Section>
    <Section title="Workspace readiness"><div className="readiness-list"><div><Icon.CheckCircle/><span><b>Shop LIVE</b><small>TikTok adapter connected</small></span><Status label="Ready" tone="online"/></div><div><Icon.GameController/><span><b>Game bridge</b><small>Choose a capture source</small></span><Status label="Setup" tone="warning"/></div><div><Icon.Processor/><span><b>AI models</b><small>Add API credentials in Creation studio</small></span><Status label="Not connected" tone="neutral"/></div></div></Section>
  </div>
 </div>}
