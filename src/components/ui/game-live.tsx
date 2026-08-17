import * as Icon from '../../icons';
import { Button, PageHeader, Section, Status, Switch } from '../../components';

const triggers=[
  ['Gift received','Spawn power-up','Gift value ≥ 10 coins','online'],
  ['Comment: !boss','Start boss encounter','Cooldown 90 seconds','online'],
  ['5,000 likes','Unlock community shield','Once per round','neutral']
] as const;

export default function GameLive(){return <div className="page wide game-studio">
  <PageHeader eyebrow="Interactive LIVE" title="Game live studio" description="Map audience events to gameplay without exposing the game runtime directly." actions={<><Button icon={<Icon.Play/>}>Test interactions</Button><Button kind="primary" icon={<Icon.Broadcast/>}>Prepare LIVE</Button></>}/>
  <div className="game-readiness"><div><span className="game-signal"><Icon.GameController/></span><div><Status label="Setup required" tone="warning"/><h2>Connect a game source</h2><p>Select the game window or bridge before going live.</p></div></div><Button>Choose source</Button></div>
  <div className="game-layout"><Section title="Interaction map" meta={<Button icon={<Icon.Plus/>}>New interaction</Button>}><div className="trigger-map">{triggers.map((trigger,index)=><button key={trigger[0]}><span className="trigger-index">0{index+1}</span><div><small>Audience event</small><b>{trigger[0]}</b></div><Icon.ArrowRight/><div><small>Game action</small><b>{trigger[1]}</b><em>{trigger[2]}</em></div><Status label={index<2?'Enabled':'Draft'} tone={trigger[3]}/><Icon.CaretRight/></button>)}</div></Section>
  <Section title="Live safety" className="game-safety"><div className="settings-list"><Switch label="Test mode" description="Preview triggers without sending events to the game."/><Switch label="Rate limits" description="Protect the game from event bursts and repeated commands."/><Switch label="Moderator approval" description="Hold high-impact actions for manual approval." on={false}/></div><div className="game-safety-note"><Icon.ShieldCheck/><p><b>Game runtime isolated</b><br/>Only approved actions will cross the bridge.</p></div></Section></div>
  <Section title="Event monitor" meta={<Status label="Waiting for source" tone="neutral"/>}><div className="game-empty"><Icon.Pulse/><div><b>Interaction events will appear here</b><p>Use test mode to validate the timing before the audience joins.</p></div></div></Section>
 </div>}
