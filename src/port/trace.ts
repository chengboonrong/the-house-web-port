/** Bounded diagnostics for comparison with future verified game events. No personal data recorded. */
export interface TraceEvent { at: number; scene: string; event: string; detail?: string }
export class PlaybackTrace {
  private entries: TraceEvent[] = [];
  constructor(private readonly capacity = 1000) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('capacity must be a positive integer');
  }
  append(event: TraceEvent): void {
    this.entries.push({ ...event });
    if (this.entries.length > this.capacity) this.entries.shift();
  }
  clear(): void { this.entries = []; }
  toJSON(): TraceEvent[] { return this.entries.map(entry => ({ ...entry })); }
  export(): string { return JSON.stringify({ format: 'port-trace-v1', events: this.toJSON() }, null, 2); }
}
