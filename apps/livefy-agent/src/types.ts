export type PlaybackStatus='idle'|'loading'|'ready'|'playing'|'paused'|'error';

export type AgentMedia={
  id:string;
  path:string;
  durationMs?:number;
  name?:string;
};

export type AgentPlaybackState={
  sessionId:string|null;
  state:PlaybackStatus;
  mediaId:string|null;
  positionMs:number;
  durationMs:number;
  absolutePositionMs:number;
  loopIndex:number;
  volume:number;
  responseAudioPlaying:boolean;
};

export type AgentDiagnostics={
  agent:{status:'online';pid:number;uptimeMs:number};
  mediaEngine:{status:'ready'|'playing'|'paused'|'unavailable'|'error';ffmpegPath:string;ffprobePath:string;lastError:string|null};
  virtualCamera:{name:'Livefy Camera';backend:'directshow'|'media-foundation';status:'not_installed'|'installed'|'running';installed:boolean;registered:boolean;running:boolean;consumerConnected:boolean;width:number;height:number;fps:number;pixelFormat:'NV12';framesProduced:number;framesDropped:number;lastFrameAt:string|null;timing:{decoded:{frames:number;fps:number;averageIntervalMs:number;p95IntervalMs:number};ready:{frames:number;fps:number;averageIntervalMs:number;p95IntervalMs:number};sent:{frames:number;fps:number;averageIntervalMs:number;p95IntervalMs:number}}};
  audioOutput:{name:'Livefy Audio';status:'not_configured'|'ready'|'running'};
  playback:AgentPlaybackState;
};

export type AgentCommandType='PING'|'GET_STATE'|'START'|'STOP'|'LOAD_SESSION'|'LOAD_MEDIA'|'LOAD_PLAYLIST'|'PLAY'|'PAUSE'|'SEEK'|'SET_VOLUME'|'PLAY_RESPONSE_AUDIO'|'STOP_RESPONSE_AUDIO'|'GET_DIAGNOSTICS';

export type AgentRequest={id:string;type:AgentCommandType;payload?:Record<string,unknown>};
export type AgentResponse={id:string;ok:true;type:'PONG'|'STATE'|'ACK'|'DIAGNOSTICS';payload:unknown}|{id:string;ok:false;type:'ERROR';error:{code:string;message:string}};
