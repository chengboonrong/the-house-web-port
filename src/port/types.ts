/** Generic preservation-oriented scene format. No original The House content. */
export type Rect = Readonly<{ x: number; y: number; width: number; height: number }>;
export type Action =
  | Readonly<{ kind: 'show'; layer: string; visible: boolean }>
  | Readonly<{ kind: 'opacity'; layer: string; to: number; ms: number }>
  | Readonly<{ kind: 'text'; message: string }>
  | Readonly<{ kind: 'sound'; id: string }>
  | Readonly<{ kind: 'wait'; ms: number }>
  | Readonly<{ kind: 'goto'; scene: string }>
  | Readonly<{ kind: 'flash'; color: string; opacity: number; ms: number }>
  | Readonly<{ kind: 'shake'; strength: number; ms: number }>;
export interface Hotspot { id: string; bounds: Rect; cursor?: 'pointer' | 'default' }
export interface EventRule {
  id: string;
  on: string;
  when?: { variable: string; equals: number };
  increment?: string;
  actions: Action[];
}
export interface SceneSpec {
  id: string; width: number; height: number; background: string;
  layers: { id: string; src: string; visible?: boolean; animation?: { frames: string[]; fps: number; loop?: boolean } }[];
  hotspots: Hotspot[];
  rules: EventRule[];
}
export interface PortSpec { initialScene: string; scenes: SceneSpec[] }
export interface PortState {
  scene: string;
  counters: Record<string, number>;
  visibleLayers: Record<string, boolean>;
  layerOpacity: Record<string, number>;
  message: string;
  pending: Action[];
  paused: boolean;
}
