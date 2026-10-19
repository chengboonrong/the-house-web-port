import { consume, createState, setPaused, trigger } from './engine';
import { PausableClock } from './clock';
import type { Action, PortSpec, PortState } from './types';
import type { Checkpoint } from './save';
import { sceneById } from './engine';

export interface RunnerHooks {
  onChange?: (state: PortState) => void;
  onSound?: (id: string) => void;
  onVisual?: (action: Extract<Action, {kind: 'flash' | 'shake'}>, now: number) => void;
  onEvent?: (entry: { at: number; scene: string; event: string; detail?: string }) => void;
}
type Fade = { layer: string; from: number; to: number; start: number; end: number };
export class PortRunner {
  private stateValue: PortState;
  private readonly clock = new PausableClock();
  private waitingUntil: number | null = null;
  private fade: Fade | null = null;
  private lastNow = 0;

  constructor(private readonly spec: PortSpec, private readonly hooks: RunnerHooks = {}) {
    this.stateValue = createState(spec);
  }
  get state(): PortState { return this.stateValue; }
  private emit(): void { this.hooks.onChange?.(this.stateValue); }
  private record(event: string, at: number, detail?: string): void {
    this.hooks.onEvent?.({ at, scene: this.stateValue.scene, event, detail });
  }

  start(now: number): void {
    this.lastNow = now;
    this.clock.reset();
    this.clock.start(now);
    this.waitingUntil = null;
    this.fade = null;
    this.stateValue = createState(this.spec);
    this.record('start', 0);
    this.emit();
  }
  reset(now: number): void { this.start(now); }
  restore(checkpoint: Checkpoint, now: number): void {
    const scene = sceneById(this.spec, checkpoint.scene);
    this.lastNow = now;
    this.clock.reset();
    this.clock.start(now);
    this.fade = null;
    this.waitingUntil = null;
    this.stateValue = {
      scene: scene.id, counters: { ...checkpoint.counters },
      visibleLayers: { ...checkpoint.visibleLayers },
      layerOpacity: { ...checkpoint.layerOpacity },
      message: checkpoint.message, pending: [], paused: false
    };
    this.record('restore', 0);
    this.emit();
  }
  get busy(): boolean { return this.waiting || this.stateValue.pending.length > 0; }
  setVisibility(visible: boolean, now: number): void {
    this.lastNow = now;
    if (visible) this.clock.start(now);
    else this.clock.pause(now);
    this.stateValue = setPaused(this.stateValue, !visible);
    this.emit();
  }
  click(id: string): boolean {
    const next = trigger(this.spec, this.stateValue, id);
    if (next === this.stateValue) return false;
    this.stateValue = next;
    this.record('click', this.clock.value(this.lastNow), id);
    this.emit();
    return true;
  }

  tick(now: number): void {
    this.lastNow = now;
    if (this.stateValue.paused) return;
    const elapsed = this.clock.value(now);
    if (this.fade) {
      const { layer, from, to, start, end } = this.fade;
      const progress = end === start ? 1 : Math.min(1, Math.max(0, (elapsed - start) / (end - start)));
      const opacity = from + (to - from) * progress;
      if (this.stateValue.layerOpacity[layer] !== opacity) {
        this.stateValue = { ...this.stateValue,
          layerOpacity: { ...this.stateValue.layerOpacity, [layer]: opacity } };
        this.emit();
      }
      if (progress < 1) return;
      this.fade = null;
    }
    if (this.waitingUntil !== null) {
      if (elapsed < this.waitingUntil) return;
      this.waitingUntil = null;
    }

    let budget = 1000;
    while (this.stateValue.pending.length > 0 && budget-- > 0) {
      const { state, effect } = consume(this.spec, this.stateValue);
      this.stateValue = state;
      if (!effect) break;
      this.record(effect.kind, elapsed, effect.kind === 'goto' ? effect.scene : undefined);
      if (effect.kind === 'sound') this.hooks.onSound?.(effect.id);
      if (effect.kind === 'flash' || effect.kind === 'shake') this.hooks.onVisual?.(effect, now);
      if (effect.kind === 'opacity') {
        const from = this.stateValue.layerOpacity[effect.layer] ?? 1;
        if (effect.ms > 0) {
          this.fade = { layer: effect.layer, from, to: effect.to, start: elapsed, end: elapsed + effect.ms };
          this.emit();
          return;
        }
        this.stateValue = { ...this.stateValue, layerOpacity: { ...this.stateValue.layerOpacity, [effect.layer]: effect.to } };
      }
      if (effect.kind === 'wait' && effect.ms > 0) {
        this.waitingUntil = elapsed + effect.ms;
        this.emit();
        return;
      }
      this.emit();
    }
    if (budget <= 0) throw new Error('Timeline exceeded 1000 immediate actions');
  }
  get waiting(): boolean { return this.waitingUntil !== null || this.fade !== null; }
}
