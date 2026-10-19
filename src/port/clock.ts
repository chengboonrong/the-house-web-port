/** Pausable clock used to control timeline delays across Safari tab suspension. */
export class PausableClock {
  private elapsed = 0;
  private startedAt: number | null = null;
  start(now: number) { if (this.startedAt === null) this.startedAt = now; }
  pause(now: number) {
    if (this.startedAt !== null) { this.elapsed += Math.max(0, now - this.startedAt); this.startedAt = null; }
  }
  reset() { this.elapsed = 0; this.startedAt = null; }
  value(now: number) { return this.elapsed + (this.startedAt === null ? 0 : Math.max(0, now - this.startedAt)); }
  get running() { return this.startedAt !== null; }
}
