export type ClockSnapshot={positionMs:number;durationMs:number;absolutePositionMs:number;loopIndex:number;running:boolean};

export class AuthoritativeClock{
  private durationMs=0;
  private absoluteAtAnchor=0;
  private anchor=0;
  private running=false;

  constructor(private readonly now:()=>number=()=>performance.now()){}

  load(durationMs:number){
    if(!Number.isFinite(durationMs)||durationMs<=0)throw new Error('Media duration must be greater than zero.');
    this.durationMs=Math.round(durationMs);this.absoluteAtAnchor=0;this.anchor=this.now();this.running=false;
  }

  play(){if(!this.durationMs)throw new Error('No media loaded.');if(this.running)return;this.anchor=this.now();this.running=true}
  pause(){if(!this.running)return;this.absoluteAtAnchor=this.absolute();this.running=false}
  stop(){this.running=false;this.absoluteAtAnchor=0;this.anchor=this.now()}
  seek(positionMs:number){if(!this.durationMs)throw new Error('No media loaded.');const current=this.snapshot();const normalized=Math.max(0,Math.min(this.durationMs-1,Math.round(positionMs)));this.absoluteAtAnchor=current.loopIndex*this.durationMs+normalized;this.anchor=this.now()}

  snapshot():ClockSnapshot{
    const absolute=this.absolute();
    return{positionMs:this.durationMs?absolute%this.durationMs:0,durationMs:this.durationMs,absolutePositionMs:absolute,loopIndex:this.durationMs?Math.floor(absolute/this.durationMs):0,running:this.running};
  }

  private absolute(){return Math.max(0,Math.floor(this.absoluteAtAnchor+(this.running?this.now()-this.anchor:0)))}
}
