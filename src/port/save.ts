import { sceneById } from './engine';
import type { PortSpec, PortState } from './types';

export const SAVE_KEY = 'the-house-port-demo:checkpoint:v1';
export interface Checkpoint {
  version: 1;
  scene: string;
  counters: Record<string, number>;
  visibleLayers: Record<string, boolean>;
  layerOpacity: Record<string, number>;
  message: string;
}
function numericRecord(value: unknown, lower: number, upper: number): value is Record<string, number> {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.entries(value).every(([key, v]) => key.length <= 128 &&
      typeof v === 'number' && Number.isFinite(v) && v >= lower && v <= upper);
}
function booleanRecord(value: unknown): value is Record<string, boolean> {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.entries(value).every(([key, v]) => key.length <= 128 && typeof v === 'boolean');
}

/** Checkpoints are allowed only at stable boundaries, never mid-animation. */
export function createCheckpoint(state: PortState, busy = false): Checkpoint | null {
  if (busy || state.pending.length > 0) return null;
  return {
    version: 1, scene: state.scene, counters: { ...state.counters },
    visibleLayers: { ...state.visibleLayers }, layerOpacity: { ...state.layerOpacity },
    message: state.message
  };
}

/** Reject malformed/stale/untrusted stored data before touching the runtime. */
export function parseCheckpoint(raw: string, spec: PortSpec): Checkpoint | null {
  try {
    if (raw.length > 32_768) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return null;
    const s = value as Partial<Checkpoint>;
    if (s.version !== 1 || typeof s.scene !== 'string' ||
      typeof s.message !== 'string' || s.message.length > 1000 ||
      !numericRecord(s.counters, 0, 1_000_000) ||
      !booleanRecord(s.visibleLayers) ||
      !numericRecord(s.layerOpacity, 0, 1)) return null;
    const scene = sceneById(spec, s.scene);
    const ids = new Set(scene.layers.map(layer => layer.id));
    if (!Object.keys(s.visibleLayers).every(key => ids.has(key)) ||
      !Object.keys(s.layerOpacity).every(key => ids.has(key))) return null;
    return {
      version: 1, scene: s.scene, counters: { ...s.counters },
      visibleLayers: { ...s.visibleLayers }, layerOpacity: { ...s.layerOpacity },
      message: s.message
    };
  } catch { return null; }
}
