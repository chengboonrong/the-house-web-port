import { describe, expect, it } from 'vitest';
import { portAssetUrls } from '../src/port/assets';
import { demoSpec } from '../src/port/demo';
import { validateSpec } from '../src/port/validate';
import { FramePlayer } from '../src/port/frames';

describe('declarative animation asset contracts', () => {
  it('preloads all frame image assets and validates the scene', () => {
    expect(validateSpec(demoSpec)).toEqual([]);
    expect(portAssetUrls(demoSpec)).toContain('/demo-flicker-1.svg');
    expect(portAssetUrls(demoSpec)).toContain('/demo-flicker-2.svg');
  });
  it('frame sequencer repeats and resumes without elapsed wall-time jumps', () => {
    const player = new FramePlayer({ frames: ['a', 'b'], fps: 4, loop: true });
    player.start(0);
    expect(player.current(260)).toBe('b');
    player.pause(300);
    expect(player.current(10000)).toBe('b');
    player.resume(10000);
    expect(player.current(10200)).toBe('a');
  });
});
