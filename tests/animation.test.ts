import { describe, expect, it } from 'vitest';
import { PortRunner } from '../src/port/runner';
import { PlaybackTrace } from '../src/port/trace';
import type { PortSpec } from '../src/port/types';

const spec: PortSpec = { initialScene: 'a', scenes: [
  { id: 'a', width: 100, height: 100, background: '#000', layers: [{id:'ghost',src:'/ghost.svg',visible:true}],
    hotspots: [{ id:'frame',bounds:{x:0,y:0,width:10,height:10}}],
    rules: [{ id:'sequence',on:'frame',actions:[
      {kind:'opacity',layer:'ghost',to:0,ms:1000},
      {kind:'goto',scene:'b'}
    ]}] },
  { id: 'b', width: 100, height: 100, background: '#fff', layers:[],hotspots:[],rules:[] }
]};
describe('animated timeline and scene transitions', () => {
  it('interpolates a fade, freezes in background, and then transitions', () => {
    const trace = new PlaybackTrace();
    const runner = new PortRunner(spec,{onEvent:e=>trace.append(e)});
    runner.start(0);
    expect(runner.click('frame')).toBe(true);
    runner.tick(0);
    runner.tick(400);
    expect(runner.state.layerOpacity.ghost).toBeCloseTo(0.6);
    runner.setVisibility(false,400);
    runner.tick(8000);
    expect(runner.state.layerOpacity.ghost).toBeCloseTo(0.6);
    runner.setVisibility(true,8000);
    runner.tick(8600);
    expect(runner.state.scene).toBe('b');
    expect(trace.toJSON().map(e=>e.event)).toEqual(['start','click','opacity','goto']);
  });
  it('reset cancels an active fade and pending transition',()=>{
    const runner = new PortRunner(spec);
    runner.start(0); runner.click('frame'); runner.tick(0); runner.tick(100);
    runner.reset(200); runner.tick(5000);
    expect(runner.state.scene).toBe('a');
    expect(runner.state.layerOpacity.ghost).toBe(1);
  });
  it('exports bounded event log',()=>{
    const trace=new PlaybackTrace(2);
    for(let i=0;i<3;i++)trace.append({at:i,scene:'a',event:'tick'});
    expect(trace.toJSON()).toHaveLength(2);
    expect(JSON.parse(trace.export()).format).toBe('port-trace-v1');
  });
});
