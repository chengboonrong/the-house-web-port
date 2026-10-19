/** Sprite-frame sequence descriptor for browser-neutral frame playback. */
export interface FrameSequence { frames: readonly string[]; fps: number; loop?: boolean }
export function validateFrames(sequence: FrameSequence): void {
  if (!sequence.frames.length || sequence.frames.some(url => !url) ||
      !Number.isFinite(sequence.fps) || sequence.fps <= 0 || sequence.fps > 120)
    throw new Error('Invalid sprite frame sequence');
}
export function frameIndexAt(sequence: FrameSequence, elapsedMs: number): number {
  validateFrames(sequence);
  const elapsed = Math.max(0, elapsedMs);
  const index = Math.floor((elapsed * sequence.fps) / 1000);
  return sequence.loop ? index % sequence.frames.length : Math.min(index, sequence.frames.length - 1);
}
export function frameAt(sequence: FrameSequence, elapsedMs: number): string {
  return sequence.frames[frameIndexAt(sequence, elapsedMs)];
}
export class FramePlayer {
  private elapsed = 0;
  private started: number | null = null;
  constructor(readonly sequence: FrameSequence) { validateFrames(sequence); }
  start(now: number): void { this.elapsed = 0; this.started = now; }
  pause(now: number): void {
    if (this.started !== null) { this.elapsed += Math.max(0, now - this.started); this.started = null; }
  }
  resume(now: number): void { if (this.started === null) this.started = now; }
  current(now: number): string {
    return frameAt(this.sequence, this.elapsed + (this.started === null ? 0 : Math.max(0, now - this.started)));
  }
}
