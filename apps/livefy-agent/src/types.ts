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
  audioOutput:{name:'Livefy Audio';status:'not_configured'|'ready'|'running';installed:boolean;registered:boolean;running:boolean;consumerConnected:boolean;sampleRate:48000;channels:2;format:'s16le';masterVolume:number;programVolume:number;muted:boolean;responseActive:boolean;audioClockMs:number;videoClockMs:number;avDriftMs:number;underruns:number;overruns:number;samplesProduced:number;samplesDropped:number;lastSampleAt:string|null;ducking:{enabled:boolean;level:number;attackMs:number;releaseMs:number}};
  playback:AgentPlaybackState;
  preparation:{state:'idle'|'checking_camera'|'preparing_media'|'downloading'|'loading'|'ready'|'error';sessionId:string|null;workspaceId:string|null;mediaTotal:number;mediaPrepared:number;error:string|null};
};

export type AgentCommandType='PING'|'GET_STATE'|'GET_AGENT_STATUS'|'GET_PLAYBACK_STATE'|'GET_PREPARATION_STATE'|'PREPARE_SESSION'|'START'|'STOP'|'LOAD_SESSION'|'LOAD_MEDIA'|'LOAD_PLAYLIST'|'PLAY'|'PAUSE'|'SEEK'|'NEXT'|'PREVIOUS'|'SET_VOLUME'|'PLAY_RESPONSE_AUDIO'|'STOP_RESPONSE_AUDIO'|'GET_DIAGNOSTICS';

export type AgentRequest={id:string;type:AgentCommandType;payload?:Record<string,unknown>};
export type AgentResponse={id:string;ok:true;type:'PONG'|'STATE'|'ACK'|'DIAGNOSTICS';payload:unknown}|{id:string;ok:false;type:'ERROR';error:{code:string;message:string}};
