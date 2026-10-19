import type { PortSpec } from './types';
export function validateSpec(spec: PortSpec): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const scene of spec.scenes) {
    if (ids.has(scene.id)) errors.push('Duplicate scene ' + scene.id);
    ids.add(scene.id);
    if (!(scene.width > 0 && scene.height > 0)) errors.push('Invalid dimensions: ' + scene.id);
    const hotspots = new Set(scene.hotspots.map(h => h.id));
    for (const hot of scene.hotspots) {
      const b = hot.bounds;
      if (b.width <= 0 || b.height <= 0 || b.x < 0 || b.y < 0 || b.x + b.width > scene.width || b.y + b.height > scene.height) errors.push('Out-of-bounds hotspot: ' + hot.id);
    }
    for (const rule of scene.rules) {
      if (!hotspots.has(rule.on)) errors.push('Rule references missing hotspot: ' + rule.on);
      for (const action of rule.actions) {
        if (action.kind === 'wait' && (!Number.isFinite(action.ms) || action.ms < 0)) errors.push('Invalid wait: ' + rule.id);
        if ((action.kind === 'show' || action.kind === 'opacity') && !scene.layers.some(l => l.id === action.layer)) errors.push('Missing layer: ' + action.layer);
        if (action.kind === 'opacity' && (!Number.isFinite(action.to) || action.to < 0 || action.to > 1 || !Number.isFinite(action.ms) || action.ms < 0)) errors.push('Invalid opacity: ' + rule.id);
      }
    }
  }
  if (!ids.has(spec.initialScene)) errors.push('Missing initial scene');
  for (const scene of spec.scenes) for (const rule of scene.rules) for (const action of rule.actions)
    if (action.kind === 'goto' && !ids.has(action.scene)) errors.push('Missing destination: ' + action.scene);
  return errors;
}
