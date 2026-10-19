import type { PortState, SceneSpec } from './types';

/**
 * Data-driven, DOM-based scene renderer.
 * Uses a scalable 100% stage (no distortion) and native stage-pixel positions.
 * No original The House graphics or Flash runtime are used.
 */
export class SceneRenderer {
  private sceneId: string | null = null;
  private readonly layers = new Map<string, HTMLImageElement>();

  constructor(private readonly target: HTMLElement) {}

  mount(scene: SceneSpec): void {
    this.sceneId = scene.id;
    this.layers.clear();
    this.target.replaceChildren();
    this.target.style.backgroundColor = scene.background;
    this.target.style.aspectRatio = String(scene.width) + ' / ' + String(scene.height);
    this.target.setAttribute('aria-label', 'Scene ' + scene.id);

    for (const layer of scene.layers) {
      if (!layer.src) continue;
      const image = document.createElement('img');
      image.className = 'port-layer';
      image.src = layer.src;
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
      this.target.appendChild(image);
      this.layers.set(layer.id, image);
    }
  }

  update(scene: SceneSpec, state: PortState): void {
    if (this.sceneId !== scene.id) this.mount(scene);
    for (const [id, image] of this.layers) {
      image.style.display = state.visibleLayers[id] ? 'block' : 'none';
    }
  }

  destroy(): void {
    this.target.replaceChildren();
    this.layers.clear();
    this.sceneId = null;
  }
}
