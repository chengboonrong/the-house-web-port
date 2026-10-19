import type { Action } from './types';

/**
 * Original, reusable authoring utilities.
 * These presets are not extracted from any copyrighted Flash game.
 */
export interface ScarePreset {
  readonly id: string;
  readonly actions: readonly Action[];
}
const presets: Record<string, ScarePreset> = {
  'photo-disturbance': {
    id: 'photo-disturbance',
    actions: [
      { kind: 'show', layer: 'mark', visible: true },
      { kind: 'text', message: 'The photograph looks different. (fictional)' },
      { kind: 'wait', ms: 220 }
    ]
  },
  'sudden-flash': {
    id: 'sudden-flash',
    actions: [
      { kind: 'flash', color: '#ffffff', opacity: 0.65, ms: 350 },
      { kind: 'shake', strength: 7, ms: 600 },
      { kind: 'opacity', layer: 'room', to: 0.25, ms: 1100 }
    ]
  }
};
export function scarePreset(id: string): Action[] {
  const preset = presets[id];
  if (!preset) throw new Error('Unknown scare preset: ' + id);
  return preset.actions.map(action => ({ ...action }));
}
export const presetNames = Object.freeze(Object.keys(presets));
