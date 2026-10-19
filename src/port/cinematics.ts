import type { Action } from './types';
type VisualAction = Extract<Action, {kind:'flash' | 'shake'}>;
type Active = { action: VisualAction; started: number; pausedAt: number | null; pausedTotal: number };
/** Applies composited visual effects without blocking gameplay or reading wall time during pause. */
export class CinematicEffects {
  private readonly effects: Active[] = [];
  private currentNow = 0;
  private paused = false;
  private reducedMotion = false;
  constructor(private readonly stage: HTMLElement, private readonly overlay: HTMLElement) {
    this.overlay.style.pointerEvents = 'none';
  }
  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    if (value) this.reset();
  }
  enqueue(action: VisualAction, now: number): void {
    this.currentNow = now;
    if (this.reducedMotion) return;
    if (action.ms <= 0) return;
    this.effects.push({action,started:now,pausedAt:this.paused?now:null,pausedTotal:0});
  }
  setVisibility(visible:boolean, now:number):void {
    this.currentNow = now;
    if (this.paused === !visible) return;
    this.paused = !visible;
    for(const effect of this.effects) {
      if (!visible && effect.pausedAt === null) effect.pausedAt=now;
      if (visible && effect.pausedAt !== null) {
        effect.pausedTotal += Math.max(0,now-effect.pausedAt);
        effect.pausedAt=null;
      }
    }
  }
  tick(now:number):void {
    this.currentNow=now;
    if (this.paused) return;
    let flash: {color:string;opacity:number} | null=null;
    let dx=0,dy=0;
    for(let i=this.effects.length-1;i>=0;i--) {
      const active=this.effects[i];
      const duration=active.action.ms;
      const elapsed=Math.max(0,now-active.started-active.pausedTotal);
      if(elapsed>=duration){this.effects.splice(i,1);continue;}
      const progress=elapsed/duration;
      if(active.action.kind==='flash'){
        const opacity=active.action.opacity*(1-progress);
        if(!flash || flash.opacity<opacity)flash={color:active.action.color,opacity};
      } else {
        const amp=active.action.strength*(1-progress);
        dx+=Math.sin(elapsed*0.15)*amp;
        dy+=Math.cos(elapsed*0.19)*amp;
      }
    }
    this.stage.style.transform=dx||dy?`translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px)`:'';
    this.overlay.style.backgroundColor=flash?.color??'transparent';
    this.overlay.style.opacity=String(flash?.opacity??0);
  }
  reset():void {
    this.effects.length=0;
    this.stage.style.transform='';
    this.overlay.style.backgroundColor='transparent';
    this.overlay.style.opacity='0';
  }
  get activeCount():number{return this.effects.length;}
}
