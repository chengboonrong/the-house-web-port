import { FramePlayer } from './frames';
import type { PortState, SceneSpec } from './types';

type AnimatedLayer = { image: HTMLImageElement; player: FramePlayer; lastUrl: string };
/** DOM renderer with independently timed image-sequence layers. */
export class SceneRenderer {
  private sceneId: string | null = null;
  private readonly layers = new Map<string, HTMLImageElement>();
  private readonly animated = new Map<string, AnimatedLayer>();
  private active = true;
  private reducedMotion = false;
  private lastNow = 0;
  constructor(private readonly target: HTMLElement) {}

  mount(scene: SceneSpec, now = this.lastNow): void {
    this.sceneId = scene.id;
    this.layers.clear();
    this.animated.clear();
    this.target.replaceChildren();
    this.target.style.backgroundColor = scene.background;
    this.target.style.aspectRatio = scene.width + ' / ' + scene.height;
    this.target.setAttribute('aria-label', 'Scene ' + scene.id);
    for (const layer of scene.layers) {
      if (!layer.src && !layer.animation) continue;
      const image = document.createElement('img');
      image.className = 'port-layer';
      image.alt = '';
      image.draggable = false;
      image.style.position = 'absolute';
      image.style.inset = '0';
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.pointerEvents = 'none';
      image.style.objectFit = 'fill';
      image.style.display = layer.visible ? 'block' : 'none';
      image.dataset.layerId = layer.id;
      if (layer.animation) {
        const player = new FramePlayer(layer.animation);
        player.start(now);
        if (!this.active || this.reducedMotion) player.pause(now);
        const src = this.reducedMotion ? player.sequence.frames[0] : player.current(now);
        image.src = src;
        this.animated.set(layer.id, { image, player, lastUrl: src });
      } else image.src = layer.src;
      this.target.appendChild(image);
      this.layers.set(layer.id, image);
    }
  }

  update(scene: SceneSpec, state: PortState): void {
    if (this.sceneId !== scene.id) this.mount(scene);
    for (const [id, image] of this.layers) {
      image.style.display = state.visibleLayers[id] ? 'block' : 'none';
      image.style.opacity = String(state.layerOpacity[id] ?? 1);
    }
  }

  setVisibility(visible: boolean, now: number): void {
    this.lastNow = now;
    if (this.active === visible) return;
    this.active = visible;
    for (const { player } of this.animated.values()) {
      if (visible && !this.reducedMotion) player.resume(now);
      else player.pause(now);
    }
  }

  setReducedMotion(value: boolean): void {
    if (this.reducedMotion === value) return;
    this.reducedMotion = value;
    for (const layer of this.animated.values()) {
      if (value) {
        layer.player.pause(this.lastNow);
        const first = layer.player.sequence.frames[0];
        layer.image.src = first;
        layer.lastUrl = first;
      } else if (this.active) layer.player.resume(this.lastNow);
    }
  }

  tick(now: number): void {
    this.lastNow = now;
    if (!this.active || this.reducedMotion) return;
    for (const layer of this.animated.values()) {
      const url = layer.player.current(now);
      if (url !== layer.lastUrl) {
        layer.image.src = url;
        layer.lastUrl = url;
      }
    }
  }

  destroy(): void {
    this.target.replaceChildren();
    this.layers.clear();
    this.animated.clear();
    this.sceneId = null;
  }
}
