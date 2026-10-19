import type { PortSpec } from './types';
/** FICTIONAL TEST FIXTURE, NOT ORIGINAL GAME EVIDENCE. */
export const demoSpec: PortSpec = {
  initialScene: 'test-room',
  scenes: [{
    id: 'test-room', width: 640, height: 480, background: '#302e2b',
    layers: [{ id: 'mark', src: '', visible: false }],
    hotspots: [{ id: 'frame', bounds: { x: 245, y: 80, width: 155, height: 176 } }],
    rules: [
      { id: 'first', on: 'frame', when: { variable: 'frameClicks', equals: 0 }, increment: 'frameClicks', actions: [
        { kind: 'text', message: 'A mark appears. (fictional test event)' }, { kind: 'show', layer: 'mark', visible: true }
      ] },
      { id: 'second', on: 'frame', when: { variable: 'frameClicks', equals: 1 }, increment: 'frameClicks', actions: [
        { kind: 'text', message: 'The room becomes still. (fictional test event)' }, { kind: 'wait', ms: 300 }
      ] },
      { id: 'third', on: 'frame', when: { variable: 'frameClicks', equals: 2 }, increment: 'frameClicks', actions: [
        { kind: 'text', message: 'End of the fictional test sequence.' }
      ] }
    ]
  }]
};
