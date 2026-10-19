import { describe, expect, it } from 'vitest';
import { createState } from '../src/port/engine';
import { demoSpec } from '../src/port/demo';
import { createCheckpoint, parseCheckpoint } from '../src/port/save';
import { FramePlayer, frameIndexAt } from '../src/port/frames';
import { PortRunner } from '../src/port/runner';

describe('checkpoint', () => {
  it('roundtrips only stable, valid states', () => {
    const state = createState(demoSpec);
    state.counters.frameClicks = 2;
    const checkpoint = createCheckpoint(state);
    expect(checkpoint).not.toBeNull();
    expect(parseCheckpoint(JSON.stringify(checkpoint), demoSpec)?.counters.frameClicks).toBe(2);
    expect(createCheckpoint({ ...state, pending: [{ kind: 'wait', ms: 1 }] })).toBeNull();
    expect(createCheckpoint(state, true)).toBeNull();
  });
  it('restores counters and scene state without replaying pending events', () => {
    const runner = new PortRunner(demoSpec);
    runner.start(0);
    runner.click('frame');
    runner.tick(0);
    const checkpoint = createCheckpoint(runner.state, runner.busy)!;
    expect(checkpoint).not.toBeNull();
    runner.reset(100);
    runner.restore(checkpoint, 200);
    expect(runner.state.counters.frameClicks).toBe(1);
    expect(runner.state.visibleLayers.mark).toBe(true);
    expect(runner.state.pending).toEqual([]);
  });
  it('rejects malformed, invalid scene, invalid opacity and oversized data', () => {
    const good = createCheckpoint(createState(demoSpec))!;
    expect(parseCheckpoint('{no}', demoSpec)).toBeNull();
    expect(parseCheckpoint(JSON.stringify({...good, scene: 'untrusted'}), demoSpec)).toBeNull();
    expect(parseCheckpoint(JSON.stringify({...good, layerOpacity:{room:42}}), demoSpec)).toBeNull();
    expect(parseCheckpoint(' '.repeat(32769), demoSpec)).toBeNull();
  });
});
describe('frame player', () => {
  const sequence = {frames:['a.png','b.png','c.png'],fps:10,loop:true};
  it('selects frame by elapsed time', () => {
    expect(frameIndexAt(sequence,0)).toBe(0);
    expect(frameIndexAt(sequence,100)).toBe(1);
    expect(frameIndexAt(sequence,350)).toBe(0);
  });
  it('pauses and resumes without time jump', () => {
    const player = new FramePlayer(sequence);
    player.start(0);
    player.pause(150);
    expect(player.current(9999)).toBe('b.png');
    player.resume(9999);
    expect(player.current(10049)).toBe('c.png');
  });
});
