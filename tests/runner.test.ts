import { describe, expect, it, vi } from 'vitest';
import { PortRunner } from '../src/port/runner';
import type { PortSpec } from '../src/port/types';

const spec: PortSpec = {
  initialScene: 'room',
  scenes: [{
    id: 'room', width: 100, height: 100, background: '#000',
    layers: [{ id: 'ghost', src: '', visible: false }],
    hotspots: [{ id: 'door', bounds: { x: 0, y: 0, width: 50, height: 50 } }],
    rules: [{
      id: 'open', on: 'door', increment: 'clicks', actions: [
        { kind: 'text', message: 'Wait...' },
        { kind: 'wait', ms: 500 },
        { kind: 'show', layer: 'ghost', visible: true },
        { kind: 'sound', id: 'sting' }
      ]
    }]
  }]
};

describe('timeline runner', () => {
  it('applies ordered events and prevents clicks during queued actions', () => {
    const sound = vi.fn();
    const runner = new PortRunner(spec, { onSound: sound });
    runner.start(100);
    expect(runner.click('door')).toBe(true);
    expect(runner.click('door')).toBe(false);
    runner.tick(100);
    expect(runner.state.message).toBe('Wait...');
    expect(runner.state.visibleLayers.ghost).toBe(false);
    runner.tick(599);
    expect(runner.state.visibleLayers.ghost).toBe(false);
    runner.tick(600);
    expect(runner.state.visibleLayers.ghost).toBe(true);
    expect(sound).toHaveBeenCalledExactlyOnceWith('sting');
  });

  it('freezes delayed events while Safari is backgrounded', () => {
    const runner = new PortRunner(spec);
    runner.start(0);
    runner.click('door');
    runner.tick(0);
    runner.setVisibility(false, 100);
    runner.tick(10000);
    runner.setVisibility(true, 10000);
    runner.tick(10399);
    expect(runner.state.visibleLayers.ghost).toBe(false);
    runner.tick(10400);
    expect(runner.state.visibleLayers.ghost).toBe(true);
  });

  it('reset cancels pending waits and interactions', () => {
    const runner = new PortRunner(spec);
    runner.start(0);
    runner.click('door');
    runner.tick(0);
    runner.reset(200);
    runner.tick(10000);
    expect(runner.state.visibleLayers.ghost).toBe(false);
    expect(runner.state.counters.clicks).toBeUndefined();
  });
});
