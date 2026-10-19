import type { PortSpec } from './types';
/** FICTIONAL TEST FIXTURE, NOT ORIGINAL GAME EVIDENCE. */
export const demoSpec: PortSpec = {
  initialScene: 'test-room',
  scenes: [{
    id: 'test-room', width: 640, height: 480, background: '#302e2b',
    layers: [
      { id: 'room', src: '/demo-room.svg', visible: true },
      { id: 'mark', src: '/demo-mark.svg', visible: false },
      { id: 'flicker', src: '/demo-flicker-1.svg', visible: true,
        animation: { frames: ['/demo-flicker-1.svg','/demo-flicker-2.svg'], fps: 2, loop: true } }
    ],
    hotspots: [
      { id: 'frame', bounds: { x: 245, y: 80, width: 155, height: 176 } },
      { id: 'door', bounds: { x: 530, y: 120, width: 100, height: 260 } }
    ],
    rules: [
      { id: 'first', on: 'frame', when: { variable: 'frameClicks', equals: 0 }, increment: 'frameClicks', actions: [
        { kind: 'text', message: 'A mark appears. (fictional test event)' }, { kind: 'show', layer: 'mark', visible: true }
      ] },
      { id: 'second', on: 'frame', when: { variable: 'frameClicks', equals: 1 }, increment: 'frameClicks', actions: [
        { kind: 'text', message: 'The room becomes still. (fictional test event)' }, { kind: 'wait', ms: 300 }
      ] },
      { id: 'third', on: 'frame', when: { variable: 'frameClicks', equals: 2 }, increment: 'frameClicks', actions: [
        { kind: 'text', message: 'End of the fictional test sequence.' },
        { kind: 'flash', color: '#ffffff', opacity: 0.65, ms: 350 },
        { kind: 'shake', strength: 7, ms: 600 },
        { kind: 'opacity', layer: 'room', to: 0.25, ms: 1100 }
      ] },
      { id: 'enter-hall', on: 'door', actions: [
        {kind:'text',message:'You step into a different test room.'},
        {kind:'wait',ms:300},{kind:'goto',scene:'test-hall'}
      ] }
    ]
  }, {
    id:'test-hall', width:640,height:480,background:'#22201f',
    layers:[{id:'hall',src:'/demo-hall.svg',visible:true}],
    hotspots:[{id:'return',bounds:{x:12,y:120,width:120,height:280}}],
    rules:[{id:'back-room',on:'return',actions:[{kind:'text',message:'Returning to test room.'},{kind:'goto',scene:'test-room'}]}]
  }]
};
