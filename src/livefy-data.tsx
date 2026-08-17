/* eslint-disable react-refresh/only-export-components */
import { createContext,useCallback,useContext,useEffect,useMemo,useState,type ReactNode } from 'react';
import { supabase } from './lib/supabase';
import { useAuth } from './auth';

export type Workspace={id:string;name:string};
export type LiveSession={id:string;title:string;platform:string;mode:'shop'|'game'|'creative';status:'draft'|'live'|'paused'|'ended';viewer_count:number;started_at:string|null;ended_at:string|null;created_at:string};
export type Product={id:string;external_id:string|null;name:string;sku:string|null;price:number;currency:string;status:string;rotation_seconds:number;orders:number;gmv:number};
export type LiveEvent={id:number;type:string;message:string;severity:'info'|'success'|'warning'|'error';metadata:Record<string,unknown>;created_at:string};
export type LiveComment={id:string;author_name:string;author_handle:string|null;body:string;classification:string|null;status:string;reply:string|null;created_at:string};
export type MediaItem={id:string;name:string;storage_path:string;duration_seconds:number;status:string;position:number};
export type AutomationRule={id:string;name:string;enabled:boolean;trigger:Record<string,unknown>;conditions:unknown[];actions:unknown[]};
export type SystemComponent={id:string;name:string;status:string;detail:string|null;checked_at:string|null};
export type Workflow={id:string;name:string;nodes:unknown[];edges:unknown[];status:string;updated_at:string};

type LivefyData={
  loading:boolean;error:string|null;workspace:Workspace|null;
  sessions:LiveSession[];products:Product[];events:LiveEvent[];comments:LiveComment[];
  media:MediaItem[];rules:AutomationRule[];systems:SystemComponent[];workflows:Workflow[];
  refresh:()=>Promise<void>;
};

type DataCollections=Pick<LivefyData,'sessions'|'products'|'events'|'comments'|'media'|'rules'|'systems'|'workflows'>;
const emptyData:DataCollections={sessions:[],products:[],events:[],comments:[],media:[],rules:[],systems:[],workflows:[]};
const DataContext=createContext<LivefyData|undefined>(undefined);

export function LivefyDataProvider({children}:{children:ReactNode}){
  const{user}=useAuth();
  const[loading,setLoading]=useState(Boolean(user));
  const[error,setError]=useState<string|null>(null);
  const[workspace,setWorkspace]=useState<Workspace|null>(null);
  const[data,setData]=useState<DataCollections>(emptyData);

  const refresh=useCallback(async()=>{
    if(!user){setWorkspace(null);setData(emptyData);setLoading(false);return}
    setLoading(true);setError(null);
    const membership=await supabase.from('workspace_members').select('workspace_id,workspaces(id,name)').eq('user_id',user.id).limit(1).maybeSingle();
    if(membership.error){setError(membership.error.message);setLoading(false);return}
    const joined=membership.data?.workspaces as unknown as Workspace|null;
    if(!joined){setError('No workspace is linked to this account.');setLoading(false);return}
    setWorkspace(joined);
    const workspaceId=joined.id;
    const[sessions,products,events,comments,media,rules,systems,workflows]=await Promise.all([
      supabase.from('live_sessions').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false}),
      supabase.from('products').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false}),
      supabase.from('events').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(100),
      supabase.from('comments').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false}).limit(100),
      supabase.from('media_items').select('*').eq('workspace_id',workspaceId).neq('status','archived').order('position'),
      supabase.from('automation_rules').select('*').eq('workspace_id',workspaceId).order('created_at',{ascending:false}),
      supabase.from('system_components').select('*').eq('workspace_id',workspaceId).order('name'),
      supabase.from('workflows').select('*').eq('workspace_id',workspaceId).order('updated_at',{ascending:false})
    ]);
    const failure=[sessions,products,events,comments,media,rules,systems,workflows].find(result=>result.error)?.error;
    if(failure){setError(failure.message);setLoading(false);return}
    setData({
      sessions:(sessions.data??[]) as LiveSession[],products:(products.data??[]) as Product[],events:(events.data??[]) as LiveEvent[],
      comments:(comments.data??[]) as LiveComment[],media:(media.data??[]) as MediaItem[],rules:(rules.data??[]) as AutomationRule[],
      systems:(systems.data??[]) as SystemComponent[],workflows:(workflows.data??[]) as Workflow[]
    });
    setLoading(false);
  },[user]);

  useEffect(()=>{void refresh()},[refresh]);
  useEffect(()=>{
    if(!workspace)return;
    const channel=supabase.channel(`workspace:${workspace.id}`)
      .on('postgres_changes',{event:'*',schema:'public',table:'events',filter:`workspace_id=eq.${workspace.id}`},()=>void refresh())
      .on('postgres_changes',{event:'*',schema:'public',table:'products',filter:`workspace_id=eq.${workspace.id}`},()=>void refresh())
      .on('postgres_changes',{event:'*',schema:'public',table:'live_sessions',filter:`workspace_id=eq.${workspace.id}`},()=>void refresh())
      .on('postgres_changes',{event:'*',schema:'public',table:'comments',filter:`workspace_id=eq.${workspace.id}`},()=>void refresh())
      .subscribe();
    return()=>{void supabase.removeChannel(channel)};
  },[workspace,refresh]);

  const value=useMemo<LivefyData>(()=>({loading,error,workspace,...data,refresh}),[loading,error,workspace,data,refresh]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useLivefyData(){
  const value=useContext(DataContext);
  if(!value)throw new Error('useLivefyData must be used inside LivefyDataProvider');
  return value;
}
