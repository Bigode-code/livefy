import { useCallback, useMemo, useState } from 'react';
import {
  addEdge, Background, BackgroundVariant, Controls, Handle, MiniMap, Position,
  ReactFlow, useEdgesState, useNodesState, type Connection, type Edge, type Node, type NodeProps
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import * as Icon from '../../icons';
import { Button, Status } from '../../components';
import { useI18n } from '../../i18n';

type StudioNodeData={label:string;kind:'prompt'|'model'|'output';model?:string;description:string;status?:string;accent:'text'|'video'|'model'|'output'};
type StudioNode=Node<StudioNodeData,'studio'>;

const initialNodes:StudioNode[]=[
  {id:'prompt',type:'studio',position:{x:100,y:195},data:{label:'Campaign direction',kind:'prompt',description:'A cinematic product launch with clean camera motion, natural light and a vertical-safe composition.',accent:'text'}},
  {id:'seedance',type:'studio',position:{x:500,y:72},data:{label:'Seedance 2.5',kind:'model',model:'Video generation',description:'Prompt · 9:16 · 5 seconds',status:'API not connected',accent:'video'}},
  {id:'kling',type:'studio',position:{x:500,y:355},data:{label:'Kling Omni',kind:'model',model:'Multimodal generation',description:'Prompt + reference · 9:16',status:'API not connected',accent:'model'}},
  {id:'output',type:'studio',position:{x:930,y:205},data:{label:'Live asset',kind:'output',description:'Preview and export',status:'Waiting for a generation',accent:'output'}}
];
const initialEdges:Edge[]=[
  {id:'prompt-seedance',source:'prompt',target:'seedance',type:'smoothstep'},
  {id:'prompt-kling',source:'prompt',target:'kling',type:'smoothstep'},
  {id:'seedance-output',source:'seedance',target:'output',type:'smoothstep'},
  {id:'kling-output',source:'kling',target:'output',type:'smoothstep'}
];

function NodeIcon({accent}:{accent:StudioNodeData['accent']}){return <span className={`creation-node-icon creation-node-icon-${accent}`}>{accent==='text'?<Icon.ChatCenteredText/>:accent==='output'?<Icon.PlayCircle/>:accent==='video'?<Icon.VideoPlay/>:<Icon.Sparkle/>}</span>}

function StudioNodeCard({data,selected}:NodeProps<StudioNode>){return <div className={`creation-node creation-node-${data.kind} ${selected?'is-selected':''}`}>
  {data.kind!=='prompt'&&<Handle type="target" position={Position.Left}/>}<Handle type="source" position={Position.Right}/>
  <header><NodeIcon accent={data.accent}/><div><small>{data.model??(data.kind==='prompt'?'Text prompt':'Output')}</small><b>{data.label}</b></div><button aria-label="Node options"><Icon.DotsThree/></button></header>
  {data.kind==='prompt'&&<p>{data.description}</p>}
  {data.kind==='model'&&<><div className="creation-model-input"><span>Input</span><b>{data.description}</b></div><footer><Status label={data.status!} tone="warning"/><button aria-label={`Run ${data.label}`}><Icon.Play/></button></footer></>}
  {data.kind==='output'&&<><div className="creation-output-preview"><Icon.PlayCircle/><span>Generated media appears here</span></div><footer><span>{data.status}</span></footer></>}
 </div>}

const libraryItems=[
  {label:'Prompt',description:'Write or combine text',accent:'text' as const,kind:'prompt' as const},
  {label:'Import media',description:'Image, video or audio',accent:'output' as const,kind:'prompt' as const},
  {label:'Seedance 2.5',description:'Text and image to video',accent:'video' as const,kind:'model' as const},
  {label:'Kling Omni',description:'Multimodal generation',accent:'model' as const,kind:'model' as const},
  {label:'Preview',description:'Inspect generated media',accent:'output' as const,kind:'output' as const}
];
const templates=[['Product motion','Prompt → Seedance → Output'],['Dual model compare','Prompt → 2 models → Compare'],['Live scene pack','Reference → Kling → 3 outputs']];

export default function CreationStudio(){
 const{t}=useI18n();
 const desktopInitial=()=>typeof window==='undefined'||window.innerWidth>820;
 const compactCanvas=typeof window!=='undefined'&&window.innerWidth<=820;
 const[nodes,setNodes,onNodesChange]=useNodesState<StudioNode>(initialNodes);
 const[edges,setEdges,onEdgesChange]=useEdgesState(initialEdges);
 const[selectedId,setSelectedId]=useState('seedance');
 const[activeLibrary,setActiveLibrary]=useState<'nodes'|'templates'|'saved'>('nodes');
 const[libraryOpen,setLibraryOpen]=useState(desktopInitial);
 const[inspectorOpen,setInspectorOpen]=useState(desktopInitial);
 const[running,setRunning]=useState(false);
 const nodeTypes=useMemo(()=>({studio:StudioNodeCard}),[]);
 const selectedNode=nodes.find(node=>node.id===selectedId)??nodes[0];
 const onConnect=useCallback((connection:Connection)=>setEdges(current=>addEdge({...connection,type:'smoothstep'},current)),[setEdges]);
 const addNode=(item:(typeof libraryItems)[number])=>{const id=`${item.label.toLowerCase().replace(/\s/g,'-')}-${nodes.length}`;setNodes(current=>[...current,{id,type:'studio',position:{x:310+current.length*35,y:130+current.length*28},data:{label:item.label,kind:item.kind,description:item.description,status:item.kind==='model'?'API not connected':undefined,accent:item.accent}}]);setSelectedId(id);setInspectorOpen(true)};
 const runFlow=()=>{setRunning(true);window.setTimeout(()=>setRunning(false),1200)};
 return <div className="creation-workspace">
  <header className="creation-topbar"><div className="creation-file"><a href="#overview">Creation studio</a><Icon.CaretRight/><input aria-label="Workflow name" defaultValue={t('Launch video workflow')}/><Status label="Saved" tone="neutral"/></div><nav aria-label="Creation views"><button className="active">Flow</button><button>Tool</button><button>Runs</button></nav><div className="creation-actions"><button className="creation-icon-button" aria-label="Undo"><Icon.ArrowUUpLeft/></button><button className="creation-icon-button" aria-label="Redo"><Icon.ArrowRight/></button><Button>Share</Button><Button kind="primary" icon={<Icon.Play/>} onClick={runFlow}>{running?'Running…':'Run workflow'}</Button></div></header>
  <div className={`creation-body ${libraryOpen?'with-library':''} ${inspectorOpen?'with-inspector':''}`}>
   <aside className="creation-rail" aria-label="Creation tools"><button className={libraryOpen?'active':''} onClick={()=>setLibraryOpen(value=>!value)} aria-label="Toggle node library"><Icon.Plus/></button><button aria-label="Assets"><Icon.PlayCircle/></button><button aria-label="Saved"><Icon.Layers/></button><span/><button aria-label="Creation settings"><Icon.GearSix/></button></aside>
   {libraryOpen&&<aside className="creation-library"><header><div><b>Add to canvas</b><span>Drag or click an item</span></div><button aria-label="Close library" onClick={()=>setLibraryOpen(false)}><Icon.X/></button></header><label className="creation-library-search"><Icon.MagnifyingGlass/><input placeholder="Search models and tools"/><kbd>Tab</kbd></label><div className="creation-library-tabs"><button className={activeLibrary==='nodes'?'active':''} onClick={()=>setActiveLibrary('nodes')}>Nodes</button><button className={activeLibrary==='templates'?'active':''} onClick={()=>setActiveLibrary('templates')}>Templates</button><button className={activeLibrary==='saved'?'active':''} onClick={()=>setActiveLibrary('saved')}>Saved</button></div>
    {activeLibrary==='nodes'&&<div className="creation-library-content"><small>ESSENTIALS</small>{libraryItems.slice(0,2).map(item=><button key={item.label} onClick={()=>addNode(item)}><NodeIcon accent={item.accent}/><div><b>{item.label}</b><span>{item.description}</span></div><Icon.Plus/></button>)}<small>VIDEO MODELS</small>{libraryItems.slice(2,4).map(item=><button key={item.label} onClick={()=>addNode(item)}><NodeIcon accent={item.accent}/><div><b>{item.label}</b><span>{item.description}</span></div><Icon.Plus/></button>)}<small>OUTPUT</small>{libraryItems.slice(4).map(item=><button key={item.label} onClick={()=>addNode(item)}><NodeIcon accent={item.accent}/><div><b>{item.label}</b><span>{item.description}</span></div><Icon.Plus/></button>)}</div>}
    {activeLibrary==='templates'&&<div className="creation-template-list">{templates.map((template,index)=><button key={template[0]}><span className={`template-preview template-preview-${index+1}`}><i/><i/><i/></span><b>{template[0]}</b><small>{template[1]}</small></button>)}</div>}
    {activeLibrary==='saved'&&<div className="creation-saved-empty"><Icon.Layers/><b>No saved nodes yet</b><p>Save configured nodes or complete groups to reuse them here.</p></div>}
   </aside>}
   <section className="creation-canvas" aria-label="Visual creation workflow"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_,node)=>{setSelectedId(node.id);setInspectorOpen(true)}} fitView fitViewOptions={{padding:compactCanvas?.08:.22,minZoom:compactCanvas?.55:.35}} minZoom={compactCanvas?.55:.35} maxZoom={1.8} defaultEdgeOptions={{style:{stroke:'#a4a7ad',strokeWidth:1.5}}} colorMode="light" deleteKeyCode={['Backspace','Delete']}>
     <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d7d9de"/><Controls showInteractive={false}/><MiniMap pannable zoomable nodeStrokeWidth={2}/>
     <div className="creation-canvas-head"><button onClick={()=>setLibraryOpen(true)}><Icon.Plus/><span>Add node</span><kbd>Tab</kbd></button><button><Icon.MagnifyingGlass/><span>Find on canvas</span></button></div>
     <div className="creation-canvas-tools"><button className="active" aria-label="Select"><Icon.CaretUpDown/></button><button aria-label="Add prompt" onClick={()=>addNode(libraryItems[0])}><Icon.ChatCenteredText/></button><button aria-label="Import media"><Icon.PlayCircle/></button><button aria-label="Add note"><Icon.ListMagnifyingGlass/></button><i/><button aria-label="Auto arrange"><Icon.SquaresFour/></button></div>
     {running&&<div className="creation-run-state"><Icon.Pulse/><div><b>Validating workflow</b><span>Checking model connections and credentials…</span></div></div>}
    </ReactFlow></section>
   {inspectorOpen&&<aside className="creation-inspector"><header><div><small>SELECTED NODE</small><b>Properties</b></div><button aria-label="Close properties" onClick={()=>setInspectorOpen(false)}><Icon.X/></button></header><div className="creation-inspector-node"><NodeIcon accent={selectedNode.data.accent}/><div><small>{selectedNode.data.model??selectedNode.data.kind}</small><h2>{selectedNode.data.label}</h2></div></div><p>{selectedNode.data.description}</p>
    {selectedNode.data.kind==='prompt'?<label className="creation-property"><span>Prompt</span><textarea defaultValue={selectedNode.data.description}/><small>Connected models receive this text.</small></label>:selectedNode.data.kind==='output'?<div className="creation-property-empty"><Icon.PlayCircle/><b>No media generated</b><span>Run a connected model to create a preview.</span></div>:<><label className="creation-property"><span>API connection</span><button className="creation-connection"><Icon.Link/><b>Not configured</b><Icon.CaretRight/></button><small>Credentials are stored securely.</small></label><div className="creation-property-grid"><label><span>Aspect ratio</span><select defaultValue="9:16"><option>9:16</option><option>16:9</option><option>1:1</option></select></label><label><span>Duration</span><select defaultValue="5 sec"><option>5 sec</option><option>10 sec</option></select></label></div><label className="creation-property"><span>Output quality</span><select defaultValue="1080p"><option>1080p</option><option>720p</option></select></label><div className="creation-api-note"><Icon.ShieldCheck/><p><b>Provider access required</b><br/>Connect your API before running this node.</p></div></>}
   </aside>}
  </div>
 </div>
}
