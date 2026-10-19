/** Mobile-safe sound adapter: audio must be unlocked by a real user gesture. */
export class PortAudio {
  private context: AudioContext | null = null;
  private readonly buffers = new Map<string, AudioBuffer>();
  private muted = false;

  async unlock(): Promise<void> {
    if (this.context === null) this.context = new AudioContext();
    if (this.context.state !== 'running') await this.context.resume();
  }

  async register(id: string, url: string): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Audio asset failed to load: ' + id);
    const array = await response.arrayBuffer();
    if (!this.context) throw new Error('Unlock audio before registering assets');
    this.buffers.set(id, await this.context.decodeAudioData(array));
  }

  play(id: string): boolean {
    if (this.muted || !this.context || this.context.state !== 'running') return false;
    const buffer = this.buffers.get(id);
    if (!buffer) return false;
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.connect(this.context.destination);
    source.start();
    return true;
  }

  setMuted(muted: boolean): void { this.muted = muted; }
  get isMuted(): boolean { return this.muted; }

  async suspend(): Promise<void> { if (this.context?.state === 'running') await this.context.suspend(); }
  async resume(): Promise<void> { if (this.context?.state === 'suspended') await this.context.resume(); }
  async close(): Promise<void> { await this.context?.close(); this.context = null; this.buffers.clear(); }
}
