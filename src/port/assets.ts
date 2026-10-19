import type { PortSpec, SceneSpec } from './types';

/** Browser-independent asset cache with injectable decoding for tests. */
export class AssetLoader<T> {
  private loaded = new Map<string, T>();
  private inflight = new Map<string, Promise<T>>();

  constructor(private readonly decode: (url: string) => Promise<T>) {}

  async load(url: string): Promise<T> {
    if (!url) throw new Error('Asset URL must not be empty');
    if (this.loaded.has(url)) return this.loaded.get(url)!;
    const existing = this.inflight.get(url);
    if (existing) return existing;
    const job = this.decode(url).then(value => {
      this.loaded.set(url, value);
      return value;
    }).finally(() => { this.inflight.delete(url); });
    this.inflight.set(url, job);
    return job;
  }

  async preload(urls: readonly string[]): Promise<void> {
    await Promise.all([...new Set(urls.filter(Boolean))].map(url => this.load(url)));
  }

  get(url: string): T | undefined { return this.loaded.get(url); }
  clear(): void { this.loaded.clear(); this.inflight.clear(); }
}

export function sceneAssetUrls(scene: SceneSpec): string[] {
  return [...new Set(scene.layers.map(layer => layer.src).filter(Boolean))];
}

export function portAssetUrls(spec: PortSpec): string[] {
  return [...new Set(spec.scenes.flatMap(sceneAssetUrls))];
}

export function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image decode failed: ' + url));
    image.src = url;
  });
}
