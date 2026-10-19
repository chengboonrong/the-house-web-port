import { consume, createState, setPaused, trigger } from './engine';
import { PausableClock } from './clock';
import type { Action, PortSpec, PortState } from './types';

export interface RunnerHooks {
  onChange?: (state: PortState) => void;
  onSound?: (id: string) => void;
}

/**
 * Deterministic, frame-pumped action runner.
 * The host supplies a monotonic clock value (performance.now() in browsers).
 * Delays are based on foreground elapsed time, not wall-clock time.
 */
export class PortRunner {
  private stateValue: PortState;
  private readonly clock = new PausableClock();
  private waitingUntil: number | null = null;

  constructor(private readonly spec: PortSpec, private readonly hooks: RunnerHooks = {}) {
    this.stateValue = createState(spec);
  }

  get state(): PortState { return this.stateValue; }

  start(now: number): void {
    this.clock.reset();
    this.clock.start(now);
    this.waitingUntil = null;
    this.stateValue = createState(this.spec);
    this.emit();
  }

  reset(now: number): void { this.start(now); }

  setVisibility(visible: boolean, now: number): void {
    if (visible) this.clock.start(now);
    else this.clock.pause(now);
    this.stateValue = setPaused(this.stateValue, !visible);
    this.emit();
  }

  click(id: string): boolean {
    const next = trigger(this.spec, this.stateValue, id);
    if (next === this.stateValue) return false;
    this.stateValue = next;
    this.emit();
    return true;
  }

  /** Tick may process many synchronous actions but stops exactly at a wait. */
  tick(now: number): void {
    if (this.stateValue.paused) return;
    const elapsed = this.clock.value(now);
    if (this.waitingUntil !== null) {
      if (elapsed < this.waitingUntil) return;
      this.waitingUntil = null;
    }
    let budget = 1000;
    while (this.stateValue.pending.length > 0 && budget-- > 0) {
      const { state, effect } = consume(this.spec, this.stateValue);
      this.stateValue = state;
      this.emit();
      if (!effect) break;
      if (effect.kind === 'sound') this.hooks.onSound?.(effect.id);
      if (effect.kind === 'wait') {
        this.waitingUntil = elapsed + effect.ms;
        if (effect.ms > 0) return;
      }
    }
    if (budget <= 0) throw new Error('Timeline exceeded 1000 immediate actions');
  }

  get waiting(): boolean { return this.waitingUntil !== null; }

  private emit(): void { this.hooks.onChange?.(this.stateValue); }
}
