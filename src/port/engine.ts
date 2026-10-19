import type { Action, PortSpec, PortState, SceneSpec } from './types';
export function sceneById(spec: PortSpec, id: string): SceneSpec {
  const found = spec.scenes.find(scene => scene.id === id);
  if (!found) throw new Error('Missing scene: ' + id);
  return found;
}
export function layers(scene: SceneSpec): Record<string, boolean> {
  return Object.fromEntries(scene.layers.map(layer => [layer.id, !!layer.visible]));
}
export function opacities(scene: SceneSpec): Record<string, number> {
  return Object.fromEntries(scene.layers.map(layer => [layer.id, 1]));
}
export function createState(spec: PortSpec): PortState {
  const scene = sceneById(spec, spec.initialScene);
  return { scene: scene.id, counters: {}, visibleLayers: layers(scene),
    layerOpacity: opacities(scene), message: '', pending: [], paused: false };
}
export function hitTest(scene: SceneSpec, x: number, y: number): string | null {
  for (let i = scene.hotspots.length - 1; i >= 0; i--) {
    const { id, bounds: b } = scene.hotspots[i];
    if (x >= b.x && y >= b.y && x < b.x+b.width && y < b.y+b.height) return id;
  }
  return null;
}
export function trigger(spec: PortSpec, state: PortState, hotspot: string): PortState {
  if (state.paused || state.pending.length) return state;
  const scene = sceneById(spec, state.scene);
  if (!scene.hotspots.some(h => h.id === hotspot)) return state;
  const rule = scene.rules.find(rule => rule.on === hotspot &&
    (!rule.when || (state.counters[rule.when.variable] ?? 0) === rule.when.equals));
  if (!rule) return state;
  const counters = { ...state.counters };
  if (rule.increment) counters[rule.increment] = (counters[rule.increment] ?? 0) + 1;
  return { ...state, counters, pending: [...rule.actions] };
}
export function consume(spec: PortSpec, state: PortState): { state: PortState; effect?: Action } {
  if (state.paused || !state.pending.length) return { state };
  const [action, ...pending] = state.pending;
  let next: PortState = { ...state, pending };
  switch(action.kind) {
    case 'show': next = { ...next, visibleLayers: {...next.visibleLayers, [action.layer]: action.visible} }; break;
    case 'text': next = { ...next, message: action.message }; break;
    case 'goto': {
      const destination = sceneById(spec, action.scene);
      next = {...next, scene: destination.id, visibleLayers: layers(destination),
        layerOpacity: opacities(destination), pending: [] };
      break;
    }
    case 'opacity':
    case 'sound':
    case 'wait': break;
  }
  return { state: next, effect: action };
}
export function setPaused(state: PortState, paused: boolean): PortState {
  return { ...state, paused };
}
